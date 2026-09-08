---
outline: deep
---

## Algorithms for the SELECT Operation

The relational <mark>**SELECT operation**</mark> chooses tuples that satisfy a Boolean condition:

$$
\sigma_{condition}(R)
$$

In SQL, this is the filtering work performed by a `WHERE` predicate:

```sql
SELECT *
FROM Orders
WHERE customer_id = 42;
```

Selection does not mean the SQL `SELECT` list; the relational operation corresponds specifically to filtering rows. The DBMS can implement the same selection using a scan, the physical ordering of the file, hashing, or one or more indexes.

## Implementation Options for the SELECT Operation

### Cost notation

Let:

- $b$ be the number of blocks in the relation file;
- $r$ be the number of records;
- $bfr$ be the blocking factor, or records per block;
- $x$ be the number of index levels traversed;
- $s$ be the number of records satisfying the selection;
- $b_s$ be the number of data blocks containing those records.

The formulas below emphasize block accesses. Exact cost also depends on buffering, cached pages, index layout, overflow blocks, and whether the output must be written to disk.

### Simple selection conditions

A simple condition compares one attribute with a constant:

$$
A\ \theta\ c
$$

where $\theta$ may be $=$, $\ne$, $<$, $\le$, $>$, or $\ge$.

The available algorithm depends on four questions:

1. Is $A$ a key or a nonkey attribute?
2. Is the file physically ordered or hashed on $A$?
3. Is a primary, clustering, or secondary index available on $A$?
4. Does the predicate use equality or a range comparison?

### S1 — Linear Search

A <mark>**linear search**</mark> scans the file block by block and tests every record.

```text
for each block B of R:
    read B
    for each record t in B:
        if condition(t):
            emit t
```

Linear search works for every selection condition and every file organization.

#### Cost

For a nonkey condition or a query that may return many records, the scan must inspect the whole file:

$$
\operatorname{Cost}_{S1} = b
$$

For equality on a key, the scan can stop after finding the unique record. If the record is present and positions are approximately uniform, the average is about:

$$
\frac{b}{2}
$$

The worst case remains $b$ blocks when the record is near the end or does not exist.

:::info A scan is not automatically a bad plan
If a predicate returns a large fraction of the relation, reading the file sequentially can be cheaper than following many index pointers to scattered blocks. A scan is also the only general fallback when no usable access path exists.
:::

### S2 — Binary Search on an Ordered File

If the data file is physically ordered on attribute $A$, binary search can locate a block containing a target value:

```sql
SELECT *
FROM Orders
WHERE order_id = 700042;
```

At each step, the algorithm reads a middle block and compares the target with its key range. The search interval is halved until a candidate block is found.

For equality on a unique ordering key, the cost is approximately:

$$
\operatorname{Cost}_{S2} = \left\lceil \log_2 b \right\rceil
$$

If $A$ is a nonkey ordering field, equal values can occupy several consecutive blocks. Binary search locates one matching block, but the algorithm must move to the first matching block and scan the remaining matching run.

#### Limitations

- Binary search requires physical ordering on the search attribute.
- Accessing the middle block repeatedly is random I/O.
- Insertions are expensive to maintain in a sorted file.
- A sparse primary or clustering index normally reaches the target with fewer accesses than binary-searching a large data file.

### S3a — Using a Primary Index

For equality on a key attribute, a primary index can retrieve at most one record.

```sql
SELECT *
FROM Orders
WHERE order_id = 700042;
```

With a multilevel primary index of height $x$, the algorithm traverses the index and then reads the target data block:

$$
\operatorname{Cost}_{S3a} \approx x + 1
$$

The data-block access may already be cached, but the formula counts it explicitly.

### S3b — Using a Hash Key

If the file is hashed on `order_id`, the hash function computes the bucket directly:

$$
h(order\_id) \rightarrow bucket
$$

Equality access is usually very efficient, though collisions and overflow blocks can add I/O. Hash access does not naturally support range conditions such as `order_id > 700000`.

### S4 — Using a Primary Index to Retrieve Multiple Records

An ordered primary index supports range predicates on the ordering key:

```sql
SELECT *
FROM Orders
WHERE order_id >= 700000;
```

The index locates the first qualifying data block. Because the file itself is ordered, the algorithm then scans sequentially until the range ends:

$$
\operatorname{Cost}_{S4} \approx x + b_s
$$

For a lower-bound condition such as $A \ge c$, the index identifies the starting point. For an upper-bound condition such as $A \le c$, qualifying records begin at the start of the file, so a sequential scan from the beginning may already be sufficient.

The important property is clustering: records with neighboring key values occupy neighboring data blocks.

### S5 — Using a Clustering Index to Retrieve Multiple Records

A clustering index is built on a nonkey ordering field. All records having the same field value are stored together.

```sql
SELECT *
FROM Orders
WHERE status = 'pending';
```

The index entry identifies the first data block—or a block cluster—for the requested value. The matching blocks can then be read sequentially:

$$
\operatorname{Cost}_{S5} \approx x + b_s
$$

If the $s$ matching records are packed densely, then approximately:

$$
b_s \approx \left\lceil \frac{s}{bfr} \right\rceil
$$

Overflow blocks or variable-length records can make the actual value larger.

:::tip Why clustering matters
An index finds record references. Clustering determines whether following those references touches a short sequential range or many unrelated data blocks.
:::

### S6 — Using a Secondary B⁺-Tree Index

A secondary index provides an access path on an attribute that does not determine the physical order of the data file.

#### Equality on a key

For a secondary index on a unique key, index traversal returns one record pointer:

$$
\operatorname{Cost}_{S6,key} \approx x + 1
$$

#### Equality on a nonkey

For a nonkey field, one value may identify many records. The leaf entry may contain a pointer list, or several leaf entries may repeat the search-key value.

Because the file is not ordered on this attribute, matching records can be scattered. The cost is approximately:

$$
\operatorname{Cost}_{S6,nonkey} \approx x + b_s
$$

In the worst case, each of the $s$ records is in a different block:

$$
b_s = s
$$

#### Range through a secondary B⁺-tree

The tree can locate the first qualifying leaf entry and scan leaf pages in order. This is excellent when the range is selective or when the query is covered by the index.

If full records are required and many qualify, the record pointers may cause many random data-block reads. Beyond some point, a sequential scan becomes cheaper even though the index can answer the predicate logically.

:::warning Usable does not mean economical
An optimizer can reject an available index. The correct comparison includes both index traversal and data-page retrieval, not merely the cost of finding leaf entries.
:::

### S7a — Using a Bitmap Index

A bitmap index stores one bit vector for each indexed value. Bit position $i$ is 1 when record $i$ has that value and 0 otherwise.

For an enumerated predicate:

```sql
SELECT *
FROM Orders
WHERE status IN ('paid', 'pending', 'refunded');
```

the qualifying record IDs are found by OR-ing the three value bitmaps:

$$
B_{paid}\ \lor\ B_{pending}\ \lor\ B_{refunded}
$$

The resulting 1-bits identify records satisfying at least one listed value. Bitmap operations are also useful for conjunctive predicates: bitmaps from different conditions can be combined with bitwise `AND`.

### S7b — Using a Functional Index

A functional index stores the result of an expression over one or more attributes. It can support a selection whose predicate applies the corresponding expression.

```sql
CREATE INDEX orders_adjusted_total_idx
ON Orders (total_amount + total_amount * tax_rate);
```

The index can serve a query such as:

```sql
SELECT order_id
FROM Orders
WHERE total_amount + total_amount * tax_rate > 1000000;
```

Without the functional index, an ordinary index on `total_amount` does not directly order records by the computed adjusted total. Expression-index syntax is DBMS-specific, but the access-path idea is the same.

### Comparing the simple-selection methods

| Method | Required organization | Good predicate | Approximate block cost |
|---|---|---|---:|
| S1 linear search | none | any; especially low selectivity | $b$ |
| S2 binary search | file ordered on $A$ | equality on ordering field | $\lceil\log_2 b\rceil + b_s$ |
| S3a primary index | primary index on key | key equality | $x+1$ |
| S3b hash access | hashed on key | key equality | bucket access + overflow |
| S4 primary-index range | file ordered on key | range on ordering key | $x+b_s$ |
| S5 clustering index | clustered on nonkey | equality returning multiple records | $x+b_s$ |
| S6 secondary index | secondary access path | selective equality/range | $x+b_s$ |
| S7a bitmap index | bitmap per indexed value | enumerated set or bitmap combination | bitmap reads + record fetches |
| S7b functional index | index on matching expression | predicate on a computed value | index traversal + record fetches |

These are simplified estimates. The actual plan decision uses catalog statistics and a more detailed cost model.

## Search Methods for Conjunctive Selection

A conjunctive condition requires all simple predicates to be true:

$$
C_1 \land C_2 \land \cdots \land C_n
$$

For example:

```sql
SELECT *
FROM Orders
WHERE customer_id = 42
  AND ordered_at >= DATE '2026-01-01'
  AND status = 'paid';
```

The DBMS has several strategies.

### S8 — Conjunctive Selection Using an Individual Index

Choose one predicate with a usable access path, retrieve its candidate records, and evaluate every remaining predicate in memory.

If an index on `customer_id` is expected to return few rows:

```text
use customer_id index to get candidates
             ↓
test ordered_at and status on each candidate
             ↓
emit records satisfying all conditions
```

The best single access path is normally the one expected to produce the fewest or cheapest-to-fetch candidates, not necessarily the first predicate written in SQL.

:::info SQL predicate order is not execution order
Writing `customer_id = 42` before `status = 'paid'` does not force the DBMS to evaluate it first. For deterministic predicates joined by `AND`, the optimizer can choose an economical evaluation order.
:::

### S9 — Conjunctive Selection Using a Composite Index

A composite index can satisfy several predicates together. The textbook's S9 case uses equality conditions on two or more attributes and a matching composite index or hash structure:

```sql
CREATE INDEX orders_customer_status_idx
ON Orders (customer_id, status);
```

This matches:

```sql
WHERE customer_id = 42
  AND status = 'paid'
```

The composite access path retrieves records satisfying both equality conditions directly.

For a B⁺-tree, attribute order still matters. An index on `(status, customer_id)` has a different lexicographic order, although both equality predicates can constrain this particular lookup. Practical B⁺-tree implementations can also use an equality prefix followed by a range on the next field, but that is broader than the equality case used to define S9 in the textbook.

If all columns required by the query are stored in the index, an <mark>**index-only**</mark> plan may avoid reading data blocks entirely.

### S10 — Conjunctive Selection by Intersection of Record Pointers

If separate indexes exist on several attributes, the DBMS can retrieve record-pointer sets and intersect them:

$$
P(C_1) \cap P(C_2) \cap \cdots \cap P(C_k)
$$

Only records whose pointers survive the intersection need to be fetched and tested.

For example:

```text
index(customer_id = 42)  → {p2, p8, p9, p20}
index(status = 'paid')   → {p1, p8, p20, p31}
intersection             → {p8, p20}
```

Pointer intersection is attractive when each index is moderately selective and their combination is highly selective. Bitmap indexes make intersection especially efficient through bitwise `AND`.

It is less useful when one index alone already returns very few records or when producing large pointer sets costs more than scanning the file.

## Search Methods for Disjunctive Selection

A disjunctive condition accepts a record when at least one predicate is true:

$$
C_1 \lor C_2 \lor \cdots \lor C_n
$$

```sql
SELECT *
FROM Orders
WHERE customer_id = 42
   OR status = 'pending';
```

If every disjunct has a usable access path, the DBMS can union their record-pointer sets:

$$
P(C_1) \cup P(C_2) \cup \cdots \cup P(C_n)
$$

Duplicate pointers must be removed because one record may satisfy several predicates.

If even one disjunct lacks an access path, retrieving only the indexed disjuncts is not enough: the unindexed condition may match records anywhere in the file. A linear scan is then commonly required for the whole selection.

:::warning `OR` and `AND` behave differently
For `AND`, one selective index can produce candidates and the remaining conditions can be tested on those candidates. For `OR`, an unindexed branch can contribute records outside every indexed candidate set, so scanning may be unavoidable.
:::

## Estimating the Selectivity of a Condition

The system catalog normally stores statistics such as:

- the number of records $r_R$, record size, number of blocks $b_R$, and blocking factor for relation $R$;
- the number of distinct values $d_A$ for an attribute $A$;
- the minimum and maximum values of an ordered attribute;
- histograms that describe nonuniform value distributions.

The <mark>**selectivity**</mark> of a predicate is the fraction of relation records it is expected to return:

$$
sl = \frac{s}{r_R}
$$

For equality on a key, the expected selection cardinality is one record, so:

$$
sl(A=c)=\frac{1}{r_R}
$$

For equality on a nonkey attribute, assuming values are uniformly distributed:

$$
s \approx \frac{r_R}{d_A},
\qquad
sl(A=c) \approx \frac{1}{d_A}
$$

For a range $A \ge c$, assuming a uniform distribution between $min(A)$ and $max(A)$:

$$
sl(A \ge c) \approx
\frac{max(A)-c}{max(A)-min(A)}
$$

The estimate is 1 when $c \le min(A)$ and 0 when $c > max(A)$. Histograms give better estimates when data is skewed, because uniform-distribution formulas can be badly misleading for popular values.

Suppose `Orders` contains 10 million records:

- `order_id = 700042` returns one record: extremely selective;
- `customer_id = 42` returns 30 records: selective;
- `status = 'pending'` returns 1.5 million records: much less selective.

A secondary index is compelling for the first two cases. For the third, 1.5 million pointers may lead to a very large number of data-page accesses. If the records are not clustered, reading all blocks sequentially may be cheaper.

The optimizer therefore estimates:

- how many records qualify;
- how many distinct data blocks contain them;
- whether the index covers the query;
- whether reads are sequential or random;
- whether useful pages are already buffered.

## Worked Access-Path Choice

Assume `Orders` occupies 100,000 blocks and has these access paths:

```sql
CREATE UNIQUE INDEX orders_id_idx
ON Orders (order_id);

CREATE INDEX orders_customer_status_idx
ON Orders (customer_id, status);
```

Consider three queries.

### Query A — Unique equality

```sql
SELECT *
FROM Orders
WHERE order_id = 700042;
```

Use S3a with the unique index. A short index traversal plus one data-block access is far cheaper than scanning up to 100,000 blocks.

### Query B — Multiple equality conditions

```sql
SELECT order_id, total_amount
FROM Orders
WHERE customer_id = 42
  AND status = 'paid';
```

Use S9 with `(customer_id, status)`. The composite access path matches both equality conditions. If `order_id` and `total_amount` are not included in the index, qualifying records must still be fetched from the data file.

### Query C — Large nonclustered result

```sql
SELECT *
FROM Orders
WHERE status <> 'cancelled';
```

If most orders satisfy the predicate, use S1. Even if a secondary index on `status` exists, following pointers for most of the table is unlikely to beat a sequential scan.

## Selection Algorithm Checklist

For a selection predicate, ask:

1. Is it equality, range, conjunction, or disjunction?
2. Is the search field a key?
3. Is the file ordered, clustered, or hashed on that field?
4. Which primary, clustering, secondary, or composite indexes exist?
5. How many records and data blocks are expected to qualify?
6. Can one access path handle multiple conjuncts?
7. Can pointer sets be intersected or unioned economically?
8. Does the index cover the requested output?
9. Would a sequential scan read fewer or more predictable blocks?

## SELECT Algorithms — Summary

- Linear search works for all predicates and remains competitive for large result sets.
- Binary search requires a physically ordered file; a primary index generally gives a shorter search path.
- S3a uses a primary index for key equality, while S3b uses hashing on a key.
- S7a uses bitmap indexes; S7b uses functional indexes for computed expressions.
- Clustering keeps matching records together, while secondary-index results may be scattered across many blocks.
- Conjunctions use S8 with one individual index, S9 with a composite index, or S10 with pointer intersection.
- Disjunctions can use pointer union only when every branch has a usable access path; otherwise a scan may be required.
- The cheapest plan depends on block-level selectivity and locality, not merely on whether an index exists.
