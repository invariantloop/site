---
outline: deep
---

## Physical Database Design in Relational Databases

<mark>**Physical database design**</mark> chooses how logical relations are represented in storage and which access paths are maintained for them. The conceptual schema says what data exists; physical design decides how that data should be reached efficiently.

There is no single best physical design for a schema. The right choice depends on the actual mixture of queries, transactions, update rates, response-time requirements, and integrity constraints.

## Factors That Influence Physical Database Design

The expected mixture of database work is called the <mark>**job mix**</mark>. Physical design starts by describing that workload rather than choosing indexes in isolation.

### Analyzing queries and transactions

For each retrieval query, identify:

1. The relations it accesses.
2. The attributes used in selection conditions.
3. Whether each condition is equality, inequality, or a range.
4. The attributes used to join or otherwise link relations.
5. The attributes returned in the result.

Selection and join attributes are candidates for indexes, hashing, or physical ordering. The condition type matters: hashing naturally serves equality, whereas an ordered structure can also serve range access.

For each update transaction, identify:

1. The relations it changes.
2. Whether it inserts, deletes, or updates records.
3. The attributes used to locate affected records.
4. The attributes whose values are changed.

An index on item 3 can find the target records faster. An index on item 4 must itself be modified, so it adds update work.

### Analyzing expected frequency

Not every operation deserves equal weight. Let an operation $T_i$ occur with expected frequency $f_i$ and have cost $C_i(D)$ under physical design $D$. A simple way to express the workload objective is:

$$
\operatorname{Cost}(D) = \sum_i f_i C_i(D)
$$

This is not a complete DBMS cost model, but it captures the key idea: optimizing a rare report at the expense of a high-frequency transaction can make the total workload worse.

> An index that saves 100 block accesses for a report run once per day may matter less than one that saves 2 block accesses for a lookup run one million times per day.

### Analyzing timing constraints

Average cost is not the only goal. Some transactions have deadlines or strict response-time requirements:

- an interactive lookup may need subsecond response;
- checkout and payment operations may have latency limits;
- a nightly report may tolerate minutes but must finish before the next batch starts.

Such constraints can give an operation higher priority than its raw frequency suggests. Physical design must therefore consider both **how often** an operation runs and **how quickly** it must finish.

### Analyzing update frequency

Every index accelerates some reads but adds maintenance to writes. If a table has $m$ indexes, an insertion may require changes to the data file plus up to $m$ index structures.

Updates require a more precise analysis:

- changing a nonindexed attribute leaves indexes unchanged;
- changing an indexed attribute normally deletes the old entry and inserts a new one;
- moving clustered records may affect the table organization and physical pointers;
- frequent insertion into the same key range may cause page splits or overflow.

An access path is justified only when its retrieval benefit outweighs these update costs for the job mix.

### Analyzing uniqueness constraints

Candidate keys and other unique attribute sets need efficient uniqueness checks. Without an access path, verifying a new key could require scanning the relation. With a unique index, the insertion search also checks whether the value already exists.

For a composite candidate key $(A_1, A_2, \ldots, A_k)$, uniqueness applies to the complete tuple of values, so a corresponding composite access path may be appropriate.

:::info An index can serve two roles
A unique index is both a performance structure and an implementation mechanism for an integrity constraint. Its write overhead cannot be judged only by whether retrieval queries use it.
:::

## Physical Database Design Decisions

In many relational systems, each base relation has a physical data file. The designer chooses its primary organization and any additional access paths. Because a file can be physically ordered only one way, at most one index can determine its primary or clustered order; other indexes are secondary.

### Whether to index an attribute

An attribute is a reasonable index candidate when:

- it is a key or participates in a uniqueness constraint;
- queries use it in equality or range selections;
- it participates in join conditions;
- an index can cover a frequent query without reading the data records.

It is a weak candidate when the table is small, qualifying records form a large part of the file, the attribute changes frequently, or no important operation searches by it.

The existence of a predicate does not automatically justify an index. If most records satisfy the condition, scanning sequentially can cost less than following many index pointers and fetching scattered pages.

### What attribute or attributes to index

An index may use one attribute or a tuple of attributes. A composite index is useful when several attributes repeatedly appear together in conditions.

Order matters. For an ordered index on $(A, B)$, entries are sorted first by $A$ and then by $B$ within equal $A$ values. It naturally supports searches beginning with $A$, but it is generally not equivalent to an index on $(B, A)$.

> In a garment inventory, `(style_no, color)` is suitable when queries first select a style and then a color. If queries primarily search across all styles by color, the reverse order or another index may be needed.

### Whether to use clustering

A primary or clustering index determines the physical order of the records. Since a file has only one physical order, only one access path can receive this benefit.

Clustering is especially valuable when a query retrieves many neighboring records, such as:

- a range of key values;
- all records sharing a nonkey value;
- an ordered scan that consumes the data in key order.

Without clustering, matching index entries may point to records scattered across many blocks. With clustering, many results can be obtained from a small run of adjacent blocks.

Clustering contributes little to an index-only query because the data records are not fetched. It may also be costly for a key whose insertion order continually disrupts the physical layout.

### Choosing the primary file organization

The main alternatives from Chapters 16 and 17 serve different workloads:

| Organization | Strongest use | Main limitation |
|---|---|---|
| Heap file | Fast, simple insertion and full scans | Search without an index is linear |
| Sorted file | Ordered/range processing | Insertions and reorganization are costly |
| Hash organization | Equality search on the hash field | Poor for range and ordered access |
| B⁺-tree organization/index | Equality, range, ordered traversal, dynamic growth | More structure and update work |

The primary organization should reflect the most important access pattern, while secondary indexes cover additional patterns.

### Balancing retrieval and update cost

Consider a relation with these operations:

```sql
-- frequent point lookup
SELECT * FROM Orders WHERE order_id = ?;

-- frequent customer history
SELECT * FROM Orders
WHERE customer_id = ? AND ordered_at >= ?;

-- continuous insertion
INSERT INTO Orders (...) VALUES (...);
```

A plausible design is:

- a unique access path on `order_id` for lookup and constraint enforcement;
- an ordered composite index on `(customer_id, ordered_at)` for customer history;
- no indexes on attributes that are only displayed and never searched.

Adding an index on every output column would increase insertion cost without helping these access conditions. Conversely, removing the `order_id` index would make both lookup and uniqueness checking expensive.

## Worked Example — Designing the `Orders` File

Suppose an online store has the following relation:

```sql
Orders(
    order_id,
    customer_id,
    status,
    ordered_at,
    total_amount
)
```

Assume it contains 10 million records stored in 100,000 data blocks. The simplified job mix is:

| Operation | Frequency | Relevant condition | Expected result |
|---|---:|---|---:|
| Q1: find an order | 20,000/day | `order_id = ?` | 1 record |
| Q2: customer history | 5,000/day | `customer_id = ? AND ordered_at >= ?` | 10–100 records |
| Q3: daily orders | 100/day | `ordered_at BETWEEN ? AND ?` | 20,000 records |
| Q4: pending orders | 2,000/day | `status = 'pending'` | 1,500,000 records |
| T1: insert an order | 50,000/day | new record | 1 record |
| T2: change status | 40,000/day | locate by `order_id` | 1 record |

These numbers are estimates, not universal thresholds. Their purpose is to show how frequency and result size change the design decision.

### Step 1 — List candidate access paths

The query conditions suggest four candidates:

1. A unique index on `order_id` for Q1, T2, and uniqueness enforcement.
2. A composite ordered index on `(customer_id, ordered_at)` for Q2.
3. An ordered index on `ordered_at` for Q3.
4. An index on `status` for Q4.

At this stage they are only candidates. Physical design must still ask whether each saving pays for its storage and update cost.

### Step 2 — Choose between hash and B⁺-tree access

Q1 uses equality on a unique key, so hashing and a B⁺-tree can both provide efficient access. A B⁺-tree is a practical choice if the system may also request ranges of order IDs or scan them in order; hashing is attractive if equality is the only meaningful operation.

Q2 includes equality on `customer_id` followed by a range on `ordered_at`. This matches the lexicographic ordering of:

```sql
CREATE INDEX orders_customer_date_idx
ON Orders (customer_id, ordered_at);
```

The tree first locates one customer's key range, then scans that customer's dates from the lower bound onward.

Reversing the fields changes the usable ordering:

```sql
-- Poor match for Q2
CREATE INDEX orders_date_customer_idx
ON Orders (ordered_at, customer_id);
```

This index groups all customers by date first. For a wide date range, entries belonging to one customer are mixed with entries for every other customer, so it does not provide the same direct access path.

### Step 3 — Reject an index despite frequent use

Q4 runs often, but `status = 'pending'` returns roughly 15% of the table:

$$
\frac{1{,}500{,}000}{10{,}000{,}000} = 0.15
$$

If matching records are scattered, an ordinary secondary B⁺-tree may lead to a very large number of random data-page reads. A sequential scan can instead read the file block by block. In addition, T2 changes `status` 40,000 times per day, so an index on `status` would be maintained frequently.

The initial design therefore leaves `status` unindexed. This is a workload-based decision: a different distribution, clustering choice, bitmap implementation, or query requirement could change the result.

:::info Frequent does not imply indexable
Frequency makes Q4 important, but low selectivity and high update cost make this particular index unattractive. The complete access pattern matters more than the predicate alone.
:::

### Step 4 — Decide what to cluster

Clustering on `(customer_id, ordered_at)` would place one customer's orders close together, reducing data-block reads for Q2. Clustering on `ordered_at` would instead help Q3 retrieve a day's records sequentially.

Only one physical ordering is available, so compare the workload:

- Q2 runs 5,000 times per day and returns relatively small customer-specific ranges.
- Q3 runs only 100 times per day but reads a much larger date range.
- T1 continuously adds new orders in increasing `ordered_at` order.

There is no automatic winner. If customer-history latency is critical, clustering by customer and date may be justified. If ingestion locality and daily batch scans dominate, ordering by date may be better. The decision requires measured block-access cost and timing constraints, not just query counts.

### Step 5 — Estimate the workload, not one query

Suppose measurements produce these illustrative block-access costs:

| Operation | No extra index | Candidate design |
|---|---:|---:|
| Q1 | 100,000 | 4 |
| Q2 | 100,000 | 15 |
| Q3 | 100,000 | 300 |
| T1 | 1 data write | 1 data write + 3 index updates |
| T2 | scan + data write | 4 reads + data write + index maintenance |

The daily contribution of Q2 under each design would be approximately:

$$
\begin{aligned}
\text{without index} &= 5{,}000 \times 100{,}000 \\
\text{with index} &= 5{,}000 \times 15
\end{aligned}
$$

This large retrieval saving can justify maintaining `(customer_id, ordered_at)`. However, the numbers must come from the target DBMS and data distribution; they are not fixed costs of a B⁺-tree.

### Step 6 — Arrive at an initial design

A defensible first design is:

```sql
CREATE UNIQUE INDEX orders_pk_idx
ON Orders (order_id);

CREATE INDEX orders_customer_date_idx
ON Orders (customer_id, ordered_at);

CREATE INDEX orders_date_idx
ON Orders (ordered_at);
```

Do not create `Orders(status)` initially. After deployment, inspect execution plans and measured I/O to verify that all three indexes are used and that their write cost is acceptable.

The date index may overlap partially with other physical choices, so it should also be tested rather than kept automatically. Physical design produces an evidence-backed starting point, not a permanent answer.

### Iterative design

Physical design is not a one-time mapping from schema to storage:

1. Describe the queries and updates in the job mix.
2. Estimate their frequencies and timing requirements.
3. Identify candidate primary organizations and access paths.
4. Evaluate retrieval, storage, and maintenance costs together.
5. Implement the most promising design.
6. Observe execution plans and real measurements.
7. Tune as the data distribution and workload change.

This connects physical design directly to index tuning: the initial choices come from workload analysis, while later choices are revised using observed system behavior.

## Design Checklist

For each proposed index, ask:

- Which query, transaction, or constraint needs it?
- Is the condition equality, range, ordering, or join access?
- How frequently is that operation executed?
- How many records are expected to qualify?
- Can the index cover the query, or must it fetch data pages?
- How often are its key attributes inserted, deleted, or changed?
- Should it determine the one clustered order of the file?
- Does another index already provide the same useful prefix?
- Does its measured benefit justify its storage and maintenance cost?

## Physical Database Design — Summary

- Physical database design chooses storage structures and access paths for a known job mix.
- Query analysis identifies relations, selection fields, condition types, joins, and projected attributes.
- Update analysis identifies both the attributes used to find records and those whose values change.
- Frequency, timing constraints, update cost, and uniqueness constraints all influence the design.
- Index selection includes whether to index, which attributes and order to use, and which single access path—if any—should cluster the data.
- The best design minimizes the important workload as a whole and must be retuned when that workload changes.
