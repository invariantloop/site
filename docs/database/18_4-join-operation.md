---
outline: deep
---

## Implementing the JOIN Operation

A join combines records from two relations according to a condition. It is often one of the most expensive query-processing operations because the DBMS must compare or coordinate many records from both inputs, may produce a large result, and may need extra I/O for indexes, sorting, or temporary partitions.

This section focuses on a two-way <mark>**equijoin**</mark>:

$$
R \bowtie_{R.A=S.B} S
$$

where $A$ and $B$ are domain-compatible join attributes. A natural join is a special equijoin that removes duplicate copies of the common join attributes from the result.

We use this example throughout:

```sql
SELECT C.customer_id, C.name, O.order_id, O.total_amount
FROM Customers AS C
JOIN Orders AS O
  ON C.customer_id = O.customer_id;
```

`Customers.customer_id` is a primary key, while `Orders.customer_id` is a foreign key and may appear in many order records.

## Cost Notation

Let:

- $b_R$ and $b_S$ be the numbers of blocks in $R$ and $S$;
- $r_R$ and $r_S$ be their numbers of records;
- $n_B$ be the buffer blocks available to the join;
- $x$ be the number of index levels traversed for an inner lookup;
- $js$ be the join selection factor.

The formulas below count input block transfers and generally exclude the cost of writing the join result. Every algorithm must produce the same logical result, so output cost is often separated when comparing alternatives. In practice, a large output can dominate all other costs.

## Join Selection Factor

The <mark>**join selection factor**</mark> is the fraction of pairs in the Cartesian product that satisfy the join condition:

$$
js = \frac{|R \bowtie S|}{|R|\,|S|}
$$

Therefore, the estimated number of output records is:

$$
|R \bowtie S| \approx js \cdot r_R \cdot r_S
$$

For a foreign-key-to-primary-key join in which every foreign key has a matching parent, each child record joins with exactly one parent. If `Orders` is the child relation:

$$
|Customers \bowtie Orders| = |Orders|
$$

For a many-to-many join, duplicate join values on both sides can produce a much larger result. If one key value occurs $m$ times in $R$ and $n$ times in $S$, that key alone contributes:

$$
m \times n
$$

output records.

:::warning Input cost is not the whole query cost
A join plan that reads its inputs efficiently can still be expensive when it generates a huge intermediate result. Join order and earlier selections matter because they change both input sizes and output cardinality.
:::

## J1 — Nested-Loop Join

The basic <mark>**nested-loop join**</mark> requires no index, hashing, or ordering. For every record from the outer relation, it scans every record from the inner relation and tests the join condition.

```text
for each record r in R:
    for each record s in S:
        if r.A = s.B:
            emit combine(r, s)
```

This algorithm is universally applicable, but record-at-a-time execution is extremely expensive for large disk files.

### Record-oriented cost

If $R$ is the outer input and $S$ is rescanned once for every record of $R$, the approximate cost is:

$$
\operatorname{Cost}_{tuple\ NLJ}
= b_R + r_R b_S
$$

The first term scans the outer file once. The second term scans all $b_S$ inner blocks for each of the $r_R$ outer records.

Reversing the inputs gives:

$$
b_S + r_S b_R
$$

The two expressions can be very different, so “left” and “right” in the SQL text do not necessarily determine the physical outer and inner roles.

## Block Nested-Loop Join

Real implementations improve J1 by comparing <mark>**blocks**</mark> or groups of blocks rather than repeatedly fetching one inner file per outer record.

With $n_B$ available buffers, reserve:

- $n_B-2$ buffers for a chunk of the outer relation;
- one buffer for scanning the inner relation;
- one buffer for output.

```text
load up to nB - 2 outer blocks
              ↓
scan every inner block once
              ↓
compare all records in the resident outer chunk
              ↓
load the next outer chunk and repeat
```

If $R$ is outer, its blocks are loaded once and $S$ is scanned once per outer chunk:

$$
\operatorname{Cost}_{block\ NLJ}(R,S)
= b_R
+ \left\lceil \frac{b_R}{n_B-2} \right\rceil b_S
$$

If only one outer block is buffered at a time, this reduces to approximately:

$$
b_R + b_Rb_S
$$

### Choosing the outer relation

For block nested-loop join, it is generally advantageous to make the relation requiring fewer outer chunks the outer input. Compare both orientations:

$$
b_R + \left\lceil \frac{b_R}{n_B-2} \right\rceil b_S
$$

and:

$$
b_S + \left\lceil \frac{b_S}{n_B-2} \right\rceil b_R
$$

The smaller relation is often the better outer input because more—or all—of it can remain in memory while the larger inner file is scanned.

:::info Buffer memory changes the algorithm
If the entire outer input fits in $n_B-2$ blocks, the inner input is scanned only once. The input cost then approaches $b_R+b_S$, even without an index or ordering.
:::

### Worked block nested-loop cost

Suppose:

$$
b_{Customers}=500,\qquad b_{Orders}=8{,}000,\qquad n_B=52
$$

Using `Customers` as outer gives 50 outer-block buffers:

$$
500 + \left\lceil\frac{500}{50}\right\rceil(8{,}000)
= 80{,}500
$$

block transfers.

Reversing the inputs gives:

$$
8{,}000 + \left\lceil\frac{8{,}000}{50}\right\rceil(500)
= 88{,}000
$$

The first orientation is cheaper, but both repeatedly scan an input. An index, compatible ordering, or hash partitioning can do much better.

## J2 — Index-Based Nested-Loop Join

An <mark>**index-based nested-loop join**</mark> avoids scanning the inner file. For each outer record, it uses an index or hash access path on the inner join attribute to retrieve matching records directly.

If `Orders` is outer and a primary-key index exists on `Customers.customer_id`:

```text
scan each order O
       ↓
probe Customers(customer_id) with O.customer_id
       ↓
combine O with the matching customer
```

Conceptually:

```text
for each order o in Orders:
    matches = lookup Customers.customer_id = o.customer_id
    for each customer c in matches:
        emit combine(c, o)
```

### Cost with a unique inner index

If the outer relation is $R$, the indexed inner relation is $S$, and each B⁺-tree probe plus data access costs about $x+1$ blocks:

$$
\operatorname{Cost}_{index\ NLJ}
\approx b_R + r_R(x+1)
$$

This worst-looking expression assumes each probe performs its own I/O. Actual cost can be lower because upper index pages and frequently used data pages stay in the buffer pool.

If the inner access path is a hash key, replace $x+1$ with the expected bucket and overflow cost.

### Nonunique inner index

If the inner join attribute is nonkey, one probe may retrieve several records:

$$
\operatorname{Cost}
\approx b_R + r_R(C_{probe}+C_{matching\ data})
$$

A clustering index keeps equal inner values together and makes each probe relatively sequential. A nonclustered secondary index may point to matching records scattered across many blocks.

### When J2 is attractive

Index nested-loop join works well when:

- the outer input is small after selections;
- the inner join attribute has a suitable index or hash access path;
- each probe returns few records;
- the inner index covers the required columns;
- repeated probes benefit from cached index and data pages.

It is unattractive when the outer input is large and every outer record causes a random lookup, or when a nonclustered inner index returns many scattered records.

:::tip Apply selection before probing
If `Orders` is first reduced to a small date range, probing an index on `Customers` only for those qualifying orders can turn an otherwise expensive index nested-loop join into the cheapest plan.
:::

## J3 — Sort-Merge Join

A <mark>**sort-merge join**</mark> processes both inputs in join-key order. If they are not already ordered, each is first sorted using an external sorting algorithm.

For:

$$
R \bowtie_{R.A=S.B} S
$$

the merge phase maintains a current position in both ordered inputs:

1. If $r.A < s.B$, advance $R$.
2. If $r.A > s.B$, advance $S$.
3. If $r.A = s.B$, emit every required pair for that key and then continue.

```text
R.A:  1   3   3   7   9
           ╲ ╱
S.B:  2   3   3   3   8
           matching groups
```

Keys smaller on one side cannot match any later key already passed on the other side, so the merge advances monotonically.

### Cost when inputs are already sorted

If both files are physically ordered on their join attributes and duplicate groups fit in memory, the merge scans each input once:

$$
\operatorname{Cost}_{merge} \approx b_R+b_S
$$

This is close to the minimum input-reading cost.

### Cost when sorting is required

If neither input is ordered:

$$
\operatorname{Cost}_{sort\text{-}merge}
\approx
\operatorname{Sort}(R)
+\operatorname{Sort}(S)
+b_R+b_S
$$

Using the external-sort cost from Section 18.2:

$$
\operatorname{Sort}(R)
\approx 2b_R(1+p_R)
$$

and similarly for $S$. The final merge of the sorting phase can sometimes be combined with the join, avoiding materialization of the fully sorted inputs.

### Duplicate join values

If both join attributes contain duplicates, matching one pair is not enough. For a key $k$, let:

$$
R_k = \{r \in R \mid r.A=k\}
$$

and:

$$
S_k = \{s \in S \mid s.B=k\}
$$

The join must emit the Cartesian product of the two equal-key groups:

$$
R_k \times S_k
$$

The implementation retains one group while scanning the other, rewinds a buffered group, or spills an oversized group to temporary storage. The simple $b_R+b_S$ scan cost assumes this duplicate handling does not force substantial extra I/O.

### Existing indexes and order

A primary or clustering B⁺-tree can expose records in physical join-key order. Secondary indexes can expose record pointers in key order, but following those pointers may access scattered data blocks. An “ordered index scan” is therefore not equivalent to a sequential scan of an ordered file.

### When J3 is attractive

Sort-merge join is a strong choice when:

- both inputs already have compatible order;
- the result or a later operator also needs that order;
- the join inputs are large and an equality merge can scan them sequentially;
- sorting can be shared with `ORDER BY`, grouping, or duplicate elimination.

The sorting cost can make it less attractive for a one-off equality join whose inputs are unordered and can instead be hashed.

## J4 — Partition-Hash Join

A <mark>**partition-hash join**</mark> uses the same partitioning hash function on both join attributes:

$$
h(R.A),\qquad h(S.B)
$$

Equal join values always hash to the same partition number. Therefore, a record in $R_i$ can match records only in $S_i$:

$$
R \bowtie S
= \bigcup_{i=0}^{M-1}(R_i \bowtie S_i)
$$

where $M$ is the number of partitions.

### Partitioning phase

Scan both inputs and distribute their records using $h$:

```text
R ──h(A)──► R0  R1  R2 ... RM-1
S ──h(B)──► S0  S1  S2 ... SM-1
```

Partition $R_i$ and $S_i$ contain values assigned to the same hash range. Pairs with different partition numbers cannot satisfy equality and never need to be compared.

### Joining phase

For each corresponding pair $(R_i,S_i)$:

1. Choose the smaller partition as the build input.
2. Load it into an in-memory hash table using a second hash function.
3. Scan the other partition as the probe input.
4. Probe the hash table and verify equality before emitting matches.

The build partition must fit in the memory allocated to the hash table. The partitioning fan-out $M$ is chosen so that partitions of the smaller relation are expected to fit.

:::warning Hash matches are candidates
The join must still compare the actual join keys. Different values can collide under either hash function.
:::

### I/O cost

The partitioning phase reads and writes both inputs:

$$
2(b_R+b_S)
$$

The joining phase reads the stored partitions once more:

$$
b_R+b_S
$$

Thus the common two-pass estimate is:

$$
\operatorname{Cost}_{partition\ hash}
\approx 3(b_R+b_S)
$$

This excludes output writes and assumes every build partition fits in memory after partitioning.

### In-memory hash join

If the entire smaller input already fits in memory, partition files are unnecessary:

1. Build an in-memory hash table for the smaller relation.
2. Scan and probe with the larger relation.

The input cost approaches:

$$
b_R+b_S
$$

plus CPU work for building and probing the hash table.

### Hybrid hash join

A <mark>**hybrid hash join**</mark> keeps one or more build partitions resident during the initial partitioning phase. Probe records belonging to those resident partitions can be joined immediately.

This avoids writing and rereading the resident partitions:

```text
partition 0: keep in memory and join now
partitions 1..M-1: spill to disk and join later
```

The larger the useful resident portion, the closer the cost moves from the two-pass $3(b_R+b_S)$ estimate toward an in-memory scan.

### Data skew and recursive partitioning

Hash join depends on reasonably balanced partitions. A frequent join value can create an oversized partition even when the average partition size is small.

If a build partition does not fit in memory, the DBMS can:

- recursively repartition it with another hash function;
- use block nested-loop join for that partition;
- treat exceptionally frequent values separately.

Skew can increase both temporary I/O and CPU work. Catalog statistics and histograms help the optimizer predict this risk.

### When J4 is attractive

Partition-hash join is effective when:

- the condition is equality;
- inputs are large and unordered;
- no useful inner index exists;
- the smaller side, or each of its partitions, fits in memory;
- hash values are distributed without severe skew.

It does not directly support general inequality conditions such as $R.A < S.B$, because unequal values that should join may hash to different partitions.

## Comparing the Four Join Methods

| Method | Required access property | Main strength | Main risk |
|---|---|---|---|
| J1 nested/block nested loop | none | Works for any join condition | Repeated inner scans |
| J2 index nested loop | index/hash path on inner join field | Excellent for small outer input and selective probes | Many random inner lookups |
| J3 sort-merge | compatible order, or ability to sort | Sequential merge; preserves useful order | Sorting and duplicate-group handling |
| J4 partition-hash | equality condition and enough memory | Linear-style processing of large unordered inputs | Partition spills and data skew |

No algorithm is universally best. The choice depends on input sizes after filtering, available buffers, indexes, existing order, join-key uniqueness, expected output size, and downstream operators.

## Worked Plan Comparison

Reuse:

$$
b_{Customers}=500,\qquad b_{Orders}=8{,}000,\qquad n_B=52
$$

Assume 50,000 customers, 800,000 orders, and a B⁺-tree primary-key index on `Customers.customer_id`.

### Block nested loop

With `Customers` outer, the earlier estimate is:

$$
80{,}500 \text{ block transfers}
$$

### Index nested loop

Scanning 800,000 orders and probing `Customers` once per order performs many logical index lookups. Even with a shallow tree, the naïve upper estimate is large:

$$
8{,}000 + 800{,}000(x+1)
$$

Caching can reduce real I/O substantially, but the large outer cardinality makes J2 less compelling here. If an earlier selection reduced `Orders` to 100 records, the same plan would become attractive.

### Sort-merge

If both inputs are already ordered on `customer_id`, the merge cost is approximately:

$$
500+8{,}000=8{,}500
$$

If not, the cost of externally sorting one or both relations must be added.

### Partition-hash

If neither relation is ordered and partitions fit in memory:

$$
3(500+8{,}000)=25{,}500
$$

This beats the calculated block nested-loop plan, but not the already-sorted merge plan. It also avoids 800,000 separate index probes.

:::info Change the inputs, change the winner
There is no permanent “best join algorithm.” A selective predicate, a new index, an existing sort order, more buffer memory, or skewed data can reverse the comparison.
:::

## Multiway Joins and Intermediate Results

A query joining three or more relations is normally decomposed into a sequence of two-way joins:

$$
(R \bowtie S) \bowtie T
$$

or:

$$
R \bowtie (S \bowtie T)
$$

These expressions may be logically equivalent for inner joins, but the intermediate results can have very different sizes. The optimizer must choose both:

- the <mark>**join order**</mark>;
- the physical algorithm for each join step.

Selections should commonly be applied before joins when semantics permit, so fewer records enter the join. Small intermediate results can then be pipelined into later operators instead of written as temporary files.

Outer joins, duplicate-sensitive operations, and other non-inner-join semantics restrict which reorderings are valid; their implementation is handled separately.

## Join Algorithm Checklist

For a two-way join, ask:

1. Is the condition equality or a more general comparison?
2. How many blocks and records remain after local selections?
3. Which input should be outer, inner, build, or probe?
4. Does the inner join attribute have a useful index or hash path?
5. Are either or both inputs already ordered on the join attributes?
6. How many buffer blocks are available?
7. Are join values unique, duplicated, clustered, or skewed?
8. How large is the expected result?
9. Can the output order help a later operator?
10. Can an intermediate result be pipelined instead of materialized?

## JOIN Operation — Summary

- Nested-loop join is the general fallback; block buffering reduces repeated inner scans.
- For block nested loop, keeping the smaller input as outer usually reduces the number of inner scans.
- Index nested loop replaces each inner scan with an index or hash probe and works best with a small outer input.
- Sort-merge scans ordered inputs together; unsorted inputs must first pay a sorting cost.
- Duplicate join values require the cross product of matching groups, not one output pair.
- Partition-hash join sends equal keys to corresponding partitions and commonly costs about $3(b_R+b_S)$ block transfers.
- Hybrid hashing retains partitions in memory to avoid some temporary writes and rereads.
- Buffer space, selectivity, clustering, existing order, output size, and skew determine the winning plan.
