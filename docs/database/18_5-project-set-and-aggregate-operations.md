---
outline: deep
---

## Algorithms for PROJECT and Set Operations

Selection and join decide which records participate in a query. <mark>**Projection**</mark> decides which attributes remain, while set operations combine complete compatible results. These operations appear simple at the logical level but may require sorting, hashing, duplicate elimination, and large intermediate files.

## Implementing PROJECT

The relational PROJECT operation keeps a specified attribute list:

$$
\pi_{A_1,A_2,\ldots,A_k}(R)
$$

For example:

```sql
SELECT customer_id, status
FROM Orders;
```

The physical projection step reads each input record and copies only the requested fields into an output record.

```text
(order_id, customer_id, status, ordered_at, total_amount)
                         ↓ project
             (customer_id, status)
```

Projection makes records narrower. Narrower records increase the blocking factor, so later sorting, hashing, joins, and temporary results may require fewer blocks.

### Set semantics versus SQL bag semantics

Traditional relational algebra treats a relation as a set, so:

$$
\pi_{customer\_id}(Orders)
$$

contains each customer ID once. SQL uses bag semantics by default:

```sql
SELECT customer_id
FROM Orders;
```

returns one value per order and can contain duplicates. SQL requests set-style projection explicitly:

```sql
SELECT DISTINCT customer_id
FROM Orders;
```

:::warning Projection and duplicate elimination are separate physical tasks
Discarding columns is cheap and can stream record by record. Proving that no duplicate output remains requires an access property, sorting, hashing, or uniqueness information.
:::

## Projection without Duplicate Elimination

For ordinary SQL projection, the DBMS can scan $R$, evaluate projected expressions, and emit each result immediately:

```text
scan R → evaluate expressions → emit projected tuple
```

Ignoring output writes, the input cost is approximately:

$$
b_R
$$

The operator is naturally pipelineable because it does not need to see future records before returning the current result.

If projection contains computed expressions, they are evaluated for each record:

```sql
SELECT order_id,
       total_amount * 1.08 AS amount_with_tax
FROM Orders;
```

The result still streams unless another requirement—such as `DISTINCT` or `ORDER BY`—introduces blocking.

## Sort-Based PROJECT DISTINCT

A sort-based implementation performs these steps:

1. Scan the input and form the narrower projected records.
2. Sort the projected records on all projected attributes.
3. During the sorted scan or final merge, emit the first record from each equal group.

```text
Projected values:  (42, paid) (7, pending) (42, paid)
Sorted values:     (7, pending) (42, paid) (42, paid)
Distinct output:   (7, pending) (42, paid)
```

Projecting before sorting is important: it removes unneeded bytes before temporary runs are created.

Let $b_P$ be the number of blocks occupied by projected records before duplicate elimination. The approximate work is:

$$
b_R + \operatorname{Sort}(b_P)
$$

plus any materialization cost that is not already included in the sorting implementation. Duplicate elimination can occur during run generation and merge passes as long as equal values are handled correctly across run boundaries.

## Hash-Based PROJECT DISTINCT

A hash-based implementation uses all projected attributes as the hash key:

$$
h(A_1,A_2,\ldots,A_k)
$$

For an in-memory result:

1. Project one input record.
2. Compute its hash bucket.
3. Compare it with existing bucket entries.
4. Insert and emit it only if no equal projected record has appeared.

If the distinct projected values do not fit in memory, the DBMS first partitions the projected records. Identical projected values use the same hash function and therefore enter the same partition. Each partition is then deduplicated separately.

Hashing does not provide sorted output. It is attractive when only uniqueness is required and the hash partitions remain balanced.

## Index-Only Projection

An index can supply projected attributes without reading the data file when it contains every required value.

```sql
CREATE INDEX orders_customer_date_idx
ON Orders (customer_id, ordered_at);
```

The query:

```sql
SELECT customer_id, ordered_at
FROM Orders;
```

can potentially scan only index leaf entries. If `DISTINCT customer_id` is requested, equal leading keys are adjacent in this B⁺-tree and can be collapsed during the leaf scan.

Whether this is cheaper depends on index density, leaf-page count, required visibility checks, and whether data-page access is still necessary in the target DBMS.

## Set Operations

The main binary set operations are:

$$
R \cup S,\qquad R \cap S,\qquad R-S,\qquad R \times S
$$

`UNION`, `INTERSECTION`, and `SET DIFFERENCE` require <mark>**union-compatible**</mark> inputs:

- both inputs have the same number of attributes;
- corresponding attributes have compatible domains.

SQL names set difference `EXCEPT` or, in some products, `MINUS`.

```sql
SELECT customer_id FROM Customers_2025
UNION
SELECT customer_id FROM Customers_2026;
```

Under set semantics, the result contains no duplicates. SQL provides `UNION ALL` to concatenate both bags without set duplicate elimination.

## Sort-Merge Set Operations

Sort both relations on the same complete tuple order, then scan them concurrently. Let $r$ and $s$ be the current records.

### UNION

For $R \cup S$:

- if $r<s$, emit $r$ and advance $R$;
- if $r>s$, emit $s$ and advance $S$;
- if $r=s$, emit one copy and advance past all copies on both sides;
- after one input ends, emit the remaining distinct records from the other.

```text
R:  1  2  2  5
S:  2  3  5  5
        ↓
∪:  1  2  3  5
```

### INTERSECTION

For $R \cap S$:

- advance the side with the smaller record;
- when $r=s$, emit one copy and advance both equal groups.

```text
R:  1  2  2  5
S:  2  3  5  5
        ↓
∩:     2     5
```

### SET DIFFERENCE

For $R-S$:

- if $r<s$, emit $r$ and advance $R$;
- if $r>s$, advance $S$;
- if $r=s$, discard that value from $R$ and advance both equal groups;
- when $S$ ends, emit the remaining distinct records of $R$.

```text
R:  1  2  2  5
S:  2  3  5  5
        ↓
R-S: 1
```

Set difference is not commutative:

$$
R-S \ne S-R
$$

### Cost

If both inputs are already compatibly sorted, the merge phase costs approximately:

$$
b_R+b_S
$$

Otherwise:

$$
\operatorname{Sort}(R)
+\operatorname{Sort}(S)
+b_R+b_S
$$

The final sorting merges can sometimes be combined with the set-operation merge, avoiding fully materialized sorted inputs.

## Hash-Based Set Operations

Hashing partitions complete tuples, not just one attribute. Equal tuples must use the same hash value and enter corresponding buckets or partitions.

### Hash UNION

1. Hash records from $R$ and retain one copy of each tuple.
2. Hash records from $S$ into the same structure.
3. Insert only tuples not already present.
4. Emit all retained tuples.

### Hash INTERSECTION

1. Build a deduplicated hash structure for one input.
2. Probe it with records from the other input.
3. Emit a tuple once when an identical tuple is found.

An emitted flag or removal step prevents duplicate probe records from producing repeated output.

### Hash SET DIFFERENCE

For $R-S$:

1. Build a deduplicated hash structure containing $R$.
2. Probe it with every tuple from $S$.
3. Remove or mark any matching $R$ entry.
4. Emit the unmarked entries that remain.

If the structure does not fit in memory, partition both inputs using the same hash function and perform the set operation independently on corresponding partition pairs.

:::info Sort or hash?
Sort-merge produces useful order and handles already sorted inputs efficiently. Hashing avoids ordering work but depends on memory and balanced partitions. Both must compare full tuples to resolve equal keys or hash collisions.
:::

## Cartesian Product

The Cartesian product combines every record of $R$ with every record of $S$:

$$
R \times S
$$

If $R$ has $r_R$ records and $j$ attributes, while $S$ has $r_S$ records and $k$ attributes, the result has:

$$
r_Rr_S \text{ records}
$$

with:

$$
j+k \text{ attributes per record}
$$

A block nested-loop algorithm can generate it, but it cannot avoid the output size because every pair belongs in the result.

```text
for each r in R:
    for each s in S:
        emit concatenate(r, s)
```

Query processing tries to avoid materializing a product followed by a join selection:

$$
\sigma_{R.A=S.B}(R\times S)
$$

and instead implements it directly as:

$$
R\bowtie_{R.A=S.B}S
$$

The direct join generates only matching pairs.

## Anti-Join for Set Difference

Set difference between projected keys can be expressed as an antijoin. To find customers with no orders:

```sql
SELECT C.customer_id
FROM Customers AS C
WHERE NOT EXISTS (
  SELECT 1
  FROM Orders AS O
  WHERE O.customer_id = C.customer_id
);
```

Conceptually:

$$
Customers \triangleright Orders
$$

where the result contains only `Customers` records having no matching `Orders` record.

An antijoin can be implemented by:

- index probes that retain outer records with no inner match;
- sort-merge that emits keys present only on the preserved side;
- hash probing that emits preserved records whose key is absent from the build table.

:::danger `NOT IN` and `NULL` are not a simple set difference
SQL uses three-valued logic. If a `NOT IN` subquery contains `NULL`, comparisons can become `UNKNOWN` and produce a different result from `NOT EXISTS`. An antijoin rewrite must preserve the original query's null semantics.
:::

## PROJECT and Set Operations — Summary

- Projection narrows records; SQL keeps duplicates unless `DISTINCT` is requested.
- `PROJECT DISTINCT` can sort and collapse equal projected records or hash them into unique groups.
- Projecting early can reduce the block size of later intermediate results.
- `UNION`, `INTERSECTION`, and `SET DIFFERENCE` require union-compatible inputs and set duplicate semantics.
- Sort-merge set algorithms scan compatible orders together; hash algorithms compare corresponding tuple partitions.
- Cartesian product has $r_Rr_S$ output records and should not be materialized when a direct join expresses the intended condition.
- Set difference can often be implemented as an antijoin, subject to SQL duplicate and `NULL` semantics.

## Implementing Aggregate Operations

Aggregate functions summarize many input records into one value or one value per group. Common SQL aggregates include:

$$
MIN,\quad MAX,\quad SUM,\quad AVG,\quad COUNT
$$

Without `GROUP BY`, the entire qualifying input forms one group:

```sql
SELECT COUNT(*) AS order_count,
       SUM(total_amount) AS revenue,
       AVG(total_amount) AS average_order
FROM Orders
WHERE status = 'paid';
```

## Aggregate by Table Scan

A single scan can maintain small aggregate state:

```text
count = 0
sum = 0
min = unset
max = unset

for each qualifying value v:
    count += 1
    sum += v
    min = smaller(min, v)
    max = larger(max, v)

average = sum / count
```

Ignoring the selection access path and output write, a full scan costs approximately:

$$
b_R
$$

`AVG` should be computed from a running sum and count rather than by storing every value:

$$
AVG(A)=\frac{SUM(A)}{COUNT(A)}
$$

The state is constant-size, so an ungrouped aggregate can stream through its input. It is still a blocking operator from the consumer's perspective because the final value is not known until the input ends.

### SQL `NULL` behavior

`COUNT(*)` counts input records. `COUNT(A)`, `SUM(A)`, `AVG(A)`, `MIN(A)`, and `MAX(A)` ignore records where $A$ is `NULL`.

```sql
SELECT COUNT(*) AS rows,
       COUNT(total_amount) AS known_amounts
FROM Orders;
```

These counts can differ. Physical implementations and algebraic rewrites must preserve that distinction.

## Using Indexes for Aggregates

### MIN and MAX

With an ascending B⁺-tree on attribute $A$:

- `MIN(A)` follows the leftmost search path to the first valid leaf entry;
- `MAX(A)` follows the rightmost search path to the last valid leaf entry.

The cost is approximately the tree height:

$$
x
$$

plus any access needed to verify visibility or retrieve the value. No full table scan is required when the index entry contains the needed value.

### SUM and AVG

A dense index has an entry for every indexed record, so the DBMS can scan index values instead of wider data records. This is useful only if each occurrence is represented or its multiplicity is known.

For a nondense index, adding one copy of each search-key value is incorrect. If an index entry represents $m_i$ records with value $v_i$, the contribution is:

$$
m_i v_i
$$

and:

$$
SUM(A)=\sum_i m_i v_i,
\qquad
COUNT(A)=\sum_i m_i
$$

### COUNT

An index can count represented entries when its null behavior and multiplicities match the query. A whole-relation `COUNT(*)` may use catalog-maintained row counts when the DBMS can return a transactionally correct value; otherwise it scans an appropriate table or index structure.

:::warning An index is not automatically a correct aggregate summary
Sparse entries, duplicate compression, `NULL` omission, record visibility, and stale catalog estimates can all make a naïve index count or sum incorrect. The optimizer may use only metadata that preserves the query's exact semantics.
:::

## GROUP BY

With grouping attributes $G$:

```sql
SELECT customer_id,
       COUNT(*) AS order_count,
       SUM(total_amount) AS total_spent
FROM Orders
GROUP BY customer_id;
```

the DBMS must maintain separate aggregate state for every distinct group.

### Sort-based grouping

1. Sort the input on the grouping attributes.
2. Scan equal-key records together.
3. Maintain aggregate state for the current group.
4. Emit the group result when the key changes.

```text
customer 7:  order, order, order → count/sum → emit group 7
customer 9:  order, order        → count/sum → emit group 9
```

Aggregation can occur during sorting merges, reducing duplicate grouping records before the final run is complete.

### Hash-based grouping

1. Hash each input record on the grouping attributes.
2. Find or create that group's hash-table entry.
3. Update its count, sum, min, max, or other state.
4. Emit all group states after the input ends.

If all groups do not fit in memory, partition the input on the grouping key, write partitions to disk, and aggregate each partition separately. Equal group keys always enter the same partition.

### Existing clustering or order

If records are physically clustered or already sorted on the grouping attributes, each group arrives together. The DBMS can aggregate with a sequential scan and little memory.

A compatible index can also provide group-key order, but a nonclustered index may cause scattered record retrieval when aggregate values are stored only in the data records.

## DISTINCT Aggregates

An aggregate can request duplicate elimination inside each group:

```sql
SELECT customer_id,
       COUNT(DISTINCT status)
FROM Orders
GROUP BY customer_id;
```

This is not the same as ordinary `COUNT(status)`. The grouping operator must track distinct `status` values for each customer, for example by:

- sorting on `(customer_id, status)` and collapsing equal pairs;
- maintaining a per-group hash set;
- performing a preliminary distinct projection on the grouped value pair.

Distinct aggregate state can be much larger than a simple counter and may spill even when ordinary aggregation fits in memory.

## HAVING

`WHERE` filters input records before grouping. `HAVING` filters completed groups after their aggregate values are known:

```sql
SELECT customer_id, SUM(total_amount) AS total_spent
FROM Orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING SUM(total_amount) >= 10000000;
```

The physical order is conceptually:

```text
scan/access Orders
        ↓
WHERE status = 'paid'
        ↓
group and SUM by customer_id
        ↓
HAVING SUM(...) >= 10000000
        ↓
result
```

A `HAVING` condition that does not depend on aggregates may sometimes be moved earlier, but only when the transformation preserves grouping and `NULL` semantics.

## Comparing Aggregate Implementations

| Situation | Useful implementation |
|---|---|
| One aggregate over all qualifying records | scan with constant-size state |
| `MIN`/`MAX` on indexed field | B⁺-tree endpoint lookup |
| Many groups fitting in memory | hash aggregation |
| Input already ordered by group key | streaming ordered aggregation |
| Output also needs group-key order | sort-based aggregation |
| Too many groups for memory | external sort or partitioned hash aggregation |
| `DISTINCT` aggregate | sort/hash distinct values within each group |

## Implementing Different Types of JOINs

Section 18.4 covered inner equijoins. Query processing must also implement joins that preserve unmatched records or return records from only one input.

## Outer Joins

An inner join emits matching pairs only. Outer joins additionally preserve unmatched records and extend the missing side with `NULL` values.

### Left outer join

```sql
SELECT C.customer_id, C.name, O.order_id
FROM Customers AS C
LEFT JOIN Orders AS O
  ON C.customer_id = O.customer_id;
```

Every customer appears. A customer with no order produces:

```text
(customer_id, name, NULL)
```

### Right and full outer joins

- A right outer join preserves every record from the right input.
- A full outer join preserves unmatched records from both inputs.

### Outer nested-loop join

Modify nested-loop join by keeping a `matched` flag for each preserved outer record:

```text
for each customer c:
    matched = false
    for each matching order o:
        emit combine(c, o)
        matched = true
    if not matched:
        emit combine(c, NULL-order)
```

For a full outer join, the algorithm must also remember which inner records matched and emit the unmatched inner records afterward.

### Outer sort-merge join

While scanning ordered inputs:

- equal-key groups produce their normal matching cross product;
- a left-side key smaller than the current right key has no match and is emitted with `NULL` on the right when the left side is preserved;
- a right-side key smaller than the current left key is handled symmetrically when the right side is preserved;
- remaining records are emitted with `NULL` after the other input ends if their side is preserved.

### Outer hash join

A hash implementation tracks matched records in the preserved build or probe side. After probing, it emits the unmatched preserved records with `NULL` values for the missing side.

:::warning Outer joins restrict reordering
An inner join can often be reordered using commutativity and associativity. Outer joins encode preservation and `NULL` introduction, so changing join order or pushing predicates across them can change the result.
:::

## Semijoin

A left semijoin returns each left record that has at least one right match, but does not append right-side attributes:

$$
R \ltimes S
$$

```sql
SELECT C.customer_id, C.name
FROM Customers AS C
WHERE EXISTS (
  SELECT 1
  FROM Orders AS O
  WHERE O.customer_id = C.customer_id
);
```

The implementation needs only an existence test:

- an index nested loop stops after the first inner match;
- a hash semijoin builds the set of right join keys and probes each left record;
- a sort-merge semijoin emits a left record once when its key has any right match.

A semijoin can be cheaper than a full join followed by projection because it avoids constructing all matching pairs and then removing repeated left records.

## Antijoin

A left antijoin returns left records with no right match:

$$
R \triangleright S
$$

```sql
SELECT C.customer_id, C.name
FROM Customers AS C
WHERE NOT EXISTS (
  SELECT 1
  FROM Orders AS O
  WHERE O.customer_id = C.customer_id
);
```

Its physical implementations invert the semijoin existence test:

- emit an outer record when an index probe finds no inner record;
- emit a left key skipped by a sort-merge comparison;
- emit a probe record when its key is absent from the build hash table.

Anti-join output depends on which input is preserved and on SQL `NULL` semantics. It should not be treated as a symmetric operation.

## Worked Combined Example

Find customers who placed paid orders, report their paid totals, and retain customers whose total exceeds ten million:

```sql
SELECT C.customer_id,
       C.name,
       SUM(O.total_amount) AS total_spent
FROM Customers AS C
JOIN Orders AS O
  ON C.customer_id = O.customer_id
WHERE O.status = 'paid'
GROUP BY C.customer_id, C.name
HAVING SUM(O.total_amount) >= 10000000;
```

A physical plan can:

1. Filter `Orders` on `status = 'paid'`.
2. Project only `customer_id` and `total_amount` from the filtered orders.
3. Aggregate `SUM(total_amount)` by `customer_id`.
4. Apply the `HAVING` threshold to the smaller grouped result.
5. Join the surviving customer IDs with `Customers` through its primary-key index or another suitable join algorithm.
6. Project the final columns.

```text
Orders
  ↓ select paid
  ↓ project customer_id, total_amount
  ↓ group + sum
  ↓ having total >= 10,000,000
  ↓ join Customers
  ↓ final projection
result
```

Aggregating before the customer join can greatly reduce the join input because many orders become one record per customer. The transformation is valid here because the join is many-to-one on the customer primary key and the required aggregate uses only order values; a different join multiplicity could change the aggregate result.

## Operation Checklist

When choosing implementations for projection, sets, aggregation, or special joins, ask:

1. Does SQL require bag semantics or duplicate elimination?
2. How wide is the result after projection?
3. Are inputs already sorted, clustered, indexed, or hash-partitioned on useful attributes?
4. Do distinct values or aggregate groups fit in memory?
5. Are set-operation inputs union-compatible?
6. Is a Cartesian product accidental and replaceable by a direct join?
7. Can an index answer `MIN`, `MAX`, projection, or grouping without data access?
8. How do `NULL` values affect aggregates, set predicates, or antijoins?
9. Which side of an outer, semi-, or antijoin must be preserved?
10. Can early projection, selection, or aggregation shrink a later join?

## PROJECT, Set, Aggregate, and JOIN — Summary

- Ordinary SQL projection streams and preserves duplicates; `DISTINCT` requires duplicate elimination.
- Sorting and hashing are the main implementations for distinct projection, set operations, and grouping.
- `UNION`, `INTERSECTION`, and `SET DIFFERENCE` operate on compatible tuples; `UNION ALL` avoids set deduplication.
- Table scans compute aggregates in one pass, while compatible indexes can accelerate or cover specific aggregates.
- Grouping partitions records by grouping keys through sorting, hashing, clustering, or an existing order.
- `WHERE` filters before aggregation; `HAVING` filters completed groups.
- Outer joins preserve unmatched records with `NULL`; semijoins test existence; antijoins test nonexistence.
- Duplicate and `NULL` semantics determine which rewrites and physical algorithms are valid.
