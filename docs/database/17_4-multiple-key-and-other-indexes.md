---
outline: deep
---

## Introduction

Every index so far answered a question about **one** search field. Real queries rarely stay that simple:

```sql
SELECT *
FROM EMPLOYEE
WHERE Dno = 4 AND Age = 59;
```

An index on `Dno` can retrieve every employee in department 4 and filter their ages afterward. An index on `Age` can do the reverse. If both indexes exist, the DBMS can intersect their record-pointer sets. All three plans are correct, but all may do far more work than necessary when each individual condition matches many rows and their conjunction matches only a few.

This note studies access structures designed for that gap. It first treats several attributes as one <mark>**composite search key**</mark>, then turns to hash, bitmap, and function-based indexes that serve different query shapes.

## Indexes on Multiple Keys

### The three single-index alternatives

For a predicate $A=a \land B=b$, separate single-column indexes give the optimizer three basic choices:

| Plan | Work |
|---|---|
| Use index on $A$ | Fetch rows matching $A=a$, then test $B=b$ |
| Use index on $B$ | Fetch rows matching $B=b$, then test $A=a$ |
| Use both | Obtain two sets of row pointers and intersect them |

Let $s_A$ and $s_B$ be the fractions of the file selected by the two predicates. Under an independence and uniformity approximation, their conjunction selects

$$
s_{A \land B} \approx s_A s_B
$$

If each predicate selects 10% of a million-row table, each individual index identifies about 100,000 rows, while the conjunction is expected to identify only 10,000. A composite access path can navigate directly to that smaller region.

:::warning Independence is only an estimate
Real attributes may be correlated. `City` and `Zip_code`, for example, are far from independent. A query optimizer needs collected statistics—not just the formula above—to estimate selectivity reliably.
:::

### Ordered Composite Indexes

:::tip Definition
An <mark>**ordered composite index**</mark> is an ordered index whose search key is a tuple of two or more attributes:

$$
K = \langle A_1, A_2, \dots, A_n \rangle
$$
:::

Tuple keys are sorted <mark>**lexicographically**</mark>: compare $A_1$ first; only when two values of $A_1$ are equal is $A_2$ compared, and so on. For an index on `(Dno, Age)`, the order begins like this:

```text
(3, 58), (3, 59), (3, 60), (4, 18), (4, 19), ...
```

This makes attribute order a design decision, not cosmetic syntax.

| Predicate | Can `(Dno, Age)` navigate directly? | Reason |
|---|---:|---|
| `Dno = 4` | Yes | The first component fixes one contiguous key range |
| `Dno = 4 AND Age = 59` | Yes | The complete tuple is known |
| `Dno = 4 AND Age BETWEEN 40 AND 59` | Yes | A contiguous interval from `(4,40)` to `(4,59)` |
| `Age = 59` | Usually no | Matching tuples are scattered across every `Dno` group |
| `Age = 59 AND Dno = 4` | Yes | SQL predicate order does not matter; index-column order does |

This behavior is commonly called the <mark>**leftmost-prefix rule**</mark>: an ordered index on $(A_1,A_2,\dots,A_n)$ efficiently supports predicates that constrain a continuous prefix starting at $A_1$.

:::info Covering a query
The ordered keys themselves can sometimes answer a query without reading the data file. With an index on `(Dno, Age)`, finding the minimum age in department 4 is a lookup of the first entry in the `Dno = 4` range. This is an <mark>**index-only scan**</mark>; implementations often add selected non-key columns to make an index cover important queries.
:::

The trade-off is width. If a block has $B$ bytes, a block pointer has $P$ bytes, and the composite key occupies $V_1 + \dots + V_n$ bytes, the internal fan-out is approximately

$$
fo = \left\lfloor \frac{B}{P + \sum_{i=1}^{n} V_i} \right\rfloor
$$

Adding columns makes an index useful to more queries but lowers its fan-out, increases its storage, and makes every update more expensive.

### Partitioned Hashing

An ordinary hash function consumes the whole key and produces one bucket address. <mark>**Partitioned hashing**</mark> instead assigns part of the address to each component:

$$
h(\langle A,B\rangle) = h_A(A) \; || \; h_B(B)
$$

Suppose `Dno` contributes 3 bits and `Age` contributes 5 bits. If

$$
h_D(4)=100, \qquad h_A(59)=10101,
$$

then the exact pair `(4,59)` maps directly to bucket `10010101`.

If only `Age = 59` is known, its five bits are fixed but the three department bits are unknown. The search visits

$$
2^3 = 8
$$

buckets: `00010101`, `00110101`, through `11110101`. More generally, if $u$ address bits belong to unspecified attributes, a partial-match query examines $2^u$ candidate buckets.

<Mermaid
  code="
flowchart LR
D[Dno = 4] --> HD[hD = 100]
A[Age = 59] --> HA[hA = 10101]
HD --> C[Concatenate: 10010101]
HA --> C
C --> B[(Target bucket)]
"
/>

| Strength | Limitation |
|---|---|
| Exact equality on the complete composite key is direct | Hashing destroys order, so range queries are poor |
| Partial matches are possible by enumerating unknown address parts | Cost grows exponentially with unspecified bits |
| One structure serves several attribute combinations | Bit allocation must reflect the expected workload |

Put more high-order address bits on frequently specified attributes, but remember that no allocation makes hashing good at `Age BETWEEN 40 AND 50`.

### Grid Files

A <mark>**grid file**</mark> divides the domain of every search attribute into intervals. The Cartesian product of those intervals forms a multidimensional grid; each cell points to a bucket containing the records in that region.

For `(Dno, Age)`, one dimension might partition departments into `{1–2}`, `{3–4}`, `{5–7}`, and `{8–10}`, while another partitions ages into `<20`, `20–39`, `40–59`, and `≥60`.

<Mermaid
  code="
flowchart LR
Q[Query: Dno 3..5 and Age 40..59] --> S[Map conditions to scale intervals]
S --> C[Select intersecting grid cells]
C --> B[Read their buckets]
B --> F[Check boundary values]
"
/>

Unlike partitioned hashing, a grid preserves spatial adjacency in each dimension, so equality, partial-match, and range predicates can all identify a set of cells. The scales should be chosen so records are distributed reasonably evenly rather than so numeric intervals have equal width.

For $n$ attributes with $d_i$ intervals on dimension $i$, the logical grid contains

$$
\prod_{i=1}^{n} d_i
$$

cells. This is the <mark>**curse of dimensionality**</mark>: ten intervals on each of five attributes already produce $10^5$ cells. Several cells may share a physical bucket, but the directory still costs space and changing distributions may force splits and directory reorganization.

| Structure | Equality | Range | Partial key | Main cost |
|---|---:|---:|---:|---|
| Ordered composite index | Excellent | Excellent on a leftmost prefix | Prefix only | Wider keys; order-sensitive |
| Partitioned hashing | Excellent | Poor | Yes, by bucket enumeration | Exponential bucket combinations |
| Grid file | Good | Good across dimensions | Yes | Large directory; reorganization |

## Other Types of Indexes

### Hash Indexes

A <mark>**hash index**</mark> is a secondary access structure organized by hashing an indexed value $K$. Its entries have the familiar form

$$
\langle K, Pr \rangle \quad \text{or} \quad \langle K, P \rangle,
$$

where $Pr$ points to a record and $P$ points to a data block. The underlying data file may be a heap, sorted file, or another hash organization; the hash index is independent of that primary layout.

For `WHERE Emp_id = 51024`, the system hashes `51024`, reads the corresponding index bucket, finds the matching entry, then follows its pointer into the data file.

$$
\text{typical equality cost} \approx 1 \text{ index-bucket I/O} + 1 \text{ data I/O}
$$

This assumes limited overflow and that the hash directory is memory-resident. A dynamic scheme such as extendible or linear hashing lets the index grow without periodic full reorganization.

:::warning Hash index or hashed file?
A **hashed file** stores the actual data records in hash buckets and is the file's primary organization. A **hash index** stores small key–pointer entries in buckets and leads to records stored elsewhere. They use the same search idea but are not the same object.
:::

Hash indexes excel at `=` and `IN` predicates. They cannot support ordered scans, `MIN`/`MAX`, prefix matching, or range predicates efficiently because neighboring key values need not hash to neighboring buckets.

### Bitmap Indexes

:::tip Definition
For a table with $r$ rows, the <mark>**bitmap index**</mark> for column value $v$ is a vector of $r$ bits. Bit $i$ is `1` exactly when row $i$ has value $v$.
:::

For eight employees:

```text
row id:        0 1 2 3 4 5 6 7
Sex = M:       1 0 1 0 0 1 1 0
Sex = F:       0 1 0 1 1 0 0 1
Zip = 30022:   0 1 0 1 0 0 1 0
```

Boolean query logic becomes machine-word logic:

```text
Sex = F AND Zip = 30022
01011001
01010010
-------- AND
01010000  → rows 1 and 3
```

| SQL shape | Bitmap operation |
|---|---|
| `C = v` | Read bitmap $B_{C=v}$ |
| `C1 = v1 AND C2 = v2` | $B_1 \land B_2$ |
| `C1 = v1 OR C2 = v2` | $B_1 \lor B_2$ |
| `C <> v` | $\neg B_{C=v}$, masked by the existence bitmap |
| `COUNT(*) WHERE C = v` | Population count: number of `1` bits |

Processors apply AND, OR, NOT, and population-count instructions to 32-, 64-, or wider vectors at a time. Compressed bitmap formats make operations efficient even when the table has millions of rows.

If column $C$ has $m$ distinct values and the table has $r$ rows, the uncompressed bitmap collection needs

$$
m \times r \text{ bits} = \frac{mr}{8} \text{ bytes}.
$$

For one million rows and 200 ZIP codes, that is 25 MB—25 bytes per row. Whether this is small depends on record width and compressibility.

Bitmap indexes are strongest when:

- the table is large and mostly read-only;
- the indexed columns have low or moderate cardinality;
- queries combine several conditions;
- analytical scans and counts dominate.

They are awkward under heavy row-by-row updates. Inserting a row affects every indexed bitmap, and physically removing a row would shift later bits. An <mark>**existence bitmap**</mark> avoids immediate renumbering: deleted positions remain present but have existence bit `0` until compaction.

:::info Bitmap instead of a pointer list
In a B⁺-tree on a non-key field, a frequent value may require a long list of record pointers. With $r$ rows, a bitmap costs $r/8$ bytes. If each pointer costs $P_r$ bytes and the value occurs $f$ times, the bitmap is smaller when

$$
\frac{r}{8} < fP_r
\quad\Longleftrightarrow\quad
\frac{f}{r} > \frac{1}{8P_r}.
$$

For a 4-byte pointer, the crossover is roughly $1/32$ of the table.
:::

### Function-Based Indexes

A normal index on `Lname` contains the stored value, so a predicate that transforms it may not be able to navigate that index:

```sql
WHERE UPPER(Lname) = 'SMITH'
```

A <mark>**function-based index**</mark> indexes the result of a deterministic expression instead:

```sql
CREATE INDEX employee_upper_lname_ix
ON EMPLOYEE (UPPER(Lname));
```

Conceptually, each entry is

$$
\langle f(\text{row}), Pr \rangle.
$$

The query expression must match the indexed expression closely enough for the optimizer to recognize it. Every insert or update must recompute $f$, so expensive or unstable functions are bad candidates.

Useful cases include:

- normalized case-insensitive lookup with `UPPER(email)`;
- indexing a date bucket such as `DATE_TRUNC('month', created_at)` where supported;
- indexing computed income or price expressions used repeatedly;
- conditional uniqueness, where rows outside a condition map to `NULL` and only qualifying rows participate in a unique index.

:::warning Product-specific syntax
Expression indexes are widely available, but syntax, allowed functions, `NULL` handling, and optimizer matching rules vary by DBMS. Treat the SQL above as a design example and verify it against the target system.
:::

## Choosing the Structure

Start from the query operator, not from the data type:

| Workload need | Natural candidate |
|---|---|
| Equality on one high-cardinality attribute | Hash index or B⁺-tree |
| Equality plus ordered/range access | B⁺-tree |
| Repeated predicates on the same attribute tuple | Ordered composite B⁺-tree |
| Equality on varying subsets of a composite key | Partitioned hashing |
| Multidimensional range lookup | Grid-like/multidimensional structure |
| Many combined filters on a read-mostly table | Bitmap indexes |
| Predicate repeatedly applies the same expression | Function-based index |

No index is free: each one consumes storage, competes for buffer space, and turns one table update into multiple structure updates. The next note moves from individual structures to the larger question: **which indexes should a database actually maintain?**
