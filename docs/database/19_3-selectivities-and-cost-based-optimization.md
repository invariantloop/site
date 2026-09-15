---
outline: deep
---

## Use of Selectivities in Cost-Based Optimization

Heuristic transformations alone do not determine the best way to execute a query. A <mark>**cost-based query optimizer**</mark> estimates the costs of alternative execution strategies and chooses the plan with the lowest estimated cost.

The estimates must be accurate enough to compare alternatives fairly, but the optimizer must also limit how many alternatives it considers. Spending too long optimizing can outweigh the runtime saved by the selected plan.

This tradeoff affects different query-processing modes:

- a compiled query can justify more elaborate optimization because its chosen strategy is stored and reused;
- an interpreted or ad hoc query is optimized at runtime, so a smaller and faster optimization effort may give better response time.

The cost functions are estimates rather than exact measurements. Consequently, the plan with the lowest estimated cost is not guaranteed to be the absolute best plan at execution time.

Cost-based optimization faces several related problems:

- many equivalence rules may apply repeatedly to the same query expression;
- time and space requirements must be reduced to a comparable cost metric;
- search strategies must retain promising alternatives and prune expensive ones;
- within a query block, alternatives include table and index access paths, join orders, join methods, and grouping methods;
- global optimization can consider multiple query blocks rather than optimizing each block independently.

## 19.3.1 Cost Components for Query Execution

The textbook identifies five components of query-execution cost:

| Cost component | What it measures |
|---|---|
| Access cost to secondary storage | Reading and writing blocks between secondary storage and main-memory buffers; also called disk I/O cost |
| Disk storage cost | Space used by temporary intermediate files |
| Computation cost | In-memory work such as searching, sorting, merging records, and evaluating expressions; also called CPU cost |
| Memory usage cost | Number of main-memory buffers required during execution |
| Communication cost | Transferring queries, base data, intermediate results, or final results between sites |

Which component matters most depends on the environment:

- for a large database, minimizing secondary-storage access is often the main concern;
- when the relevant data fits in memory, computation cost becomes more important;
- in a distributed database, communication cost may dominate.

Combining every component into one weighted formula is difficult because appropriate weights are hard to assign. Simplified cost functions therefore often compare plans using only the number of block transfers between disk and memory.

## 19.3.2 Catalog Information Used in Cost Functions

The optimizer obtains the statistics required by its cost functions from the <mark>**DBMS catalog**</mark>. For a relation $X$ whose records share one type, important statistics include:

| Symbol | Catalog information |
|---|---|
| $r_X$ | Number of records or tuples in $X$ |
| $R_X$ | Average record size |
| $b_X$ | Number of file blocks occupied by $X$ |
| $bfr_X$ | Blocking factor: records stored per block |

The catalog also describes the relation's primary file organization, such as:

- unordered records;
- records ordered by an attribute, with or without a primary or clustering index;
- static or dynamic hashing on a key attribute.

For every primary, clustering, or secondary index, the optimizer needs the indexed attributes and relevant structural statistics:

| Symbol | Index information |
|---|---|
| $x_A$ | Number of levels in the multilevel index on attribute $A$ |
| $b_{I1A}$ | Number of first-level blocks in that index |

Two additional statistics estimate how many tuples satisfy a condition:

- $NDV(A,X)$ is the <mark>**number of distinct values**</mark> of attribute $A$ in relation $X$;
- $sl_A$ is the <mark>**attribute selectivity**</mark>, the fraction of records expected to satisfy an equality condition on $A$.

The <mark>**selection cardinality**</mark> $s_A$ is the expected number of qualifying records:

$$
s_A=sl_A\times r_X
$$

Some catalog values change slowly. For example, the number of index levels usually remains stable for long periods. Other values, such as the number of records, change whenever tuples are inserted or deleted.

The optimizer needs reasonably current estimates, but they do not have to reflect every change immediately. Because a single distinct-value count does not describe skewed data well, DBMSs also maintain histograms for important attributes.

## 19.3.3 Histograms

A <mark>**histogram**</mark> is a catalog table or data structure that records the distribution of an attribute's values. Without one, the optimizer generally has to assume that values are uniformly distributed between the low and high values of the attribute.

A histogram divides the attribute domain into <mark>**buckets**</mark>. For each bucket, the DBMS stores:

- the value range represented by the bucket;
- the number of relation records whose attribute value falls in that range;
- optionally, the number of distinct values in the bucket.

The optimizer may still assume a uniform distribution among the distinct values inside an individual bucket. This is an approximation, but it is usually more accurate than assuming uniformity over the attribute's entire domain. More buckets provide finer granularity and can improve the estimate.

The textbook describes two common histogram organizations:

| Histogram | How buckets are constructed | Consequence |
|---|---|---|
| <mark>**Equi-width**</mark> | Divide the value range into equal-sized subranges | Bucket populations may differ greatly when data is skewed |
| <mark>**Equi-height**</mark> | Place approximately the same number of records in each bucket | Frequent values occupy narrower buckets and sparse values occupy wider buckets |

Equi-height histograms are generally considered better because the uniformity assumption is more plausible within buckets: frequently occurring values are grouped into narrower ranges, while less frequent values can share wider ranges.

The salary histogram in the textbook uses five application-relevant ranges:

```text
30k–40k | 40k–70k | 70k–120k | 120k–200k | 200k–500k
```

These buckets are neither equi-width nor equi-height. They illustrate that histogram boundaries may instead reflect important ranges over which queries are likely to be issued.
