---
outline: deep
---

## Introduction

The index structures discussed so far describe how keys and pointers are organized. A real DBMS must also decide **what a pointer identifies**, how an index is built and maintained, and whether the index remains useful as the workload changes.

This section connects the abstract structures to those implementation decisions.

## Logical versus Physical Indexes

Suppose a secondary index is built on an indexing field $K$. The leaf entry must somehow identify the matching data record.

### Physical index

A <mark>**physical index**</mark> stores the physical record address directly:

$$
\langle K, P_r \rangle
$$

where $P_r$ may contain a disk block number and an offset inside that block.

The lookup is direct:

$$
K \rightarrow P_r \rightarrow \text{record}
$$

The weakness is that $P_r$ is tied to the current location of the record. If the primary file organization moves records—for example, after a bucket split in linear or extendible hashing—every affected secondary-index pointer must also be found and updated.

### Logical index

A <mark>**logical index**</mark> stores the primary-file key $K_p$ instead of a physical address:

$$
\langle K, K_p \rangle
$$

The lookup now has one extra step:

$$
K \rightarrow K_p \rightarrow \text{primary access path} \rightarrow \text{record}
$$

For example, an index on `Employee.email` could store:

$$
\langle \texttt{email}, \texttt{employee\_id} \rangle
$$

Moving the employee record does not change `employee_id`, so the secondary index remains valid. The price is an additional lookup through the primary organization.

| Property | Physical index | Logical index |
|---|---|---|
| Leaf target | Record address | Primary key |
| Record access | More direct | Extra indirection |
| Record movement | Pointers may need updates | Usually unaffected |
| Best fit | Stable physical placement | Records frequently move |

:::info Core trade-off
A physical pointer saves one lookup but couples the index to record placement. A logical pointer adds indirection but decouples the secondary index from physical movement.
:::

## Index Creation

An index is normally an <mark>**access structure**</mark>, separate from the data file. It can therefore be created when a new access pattern becomes important and dropped when its maintenance cost is no longer justified.

A representative index definition has the following shape:

```sql
CREATE [UNIQUE] INDEX index_name
ON table_name (column_name [ASC | DESC], ...);
```

The exact syntax for clustering is product-specific. Conceptually:

- `UNIQUE` asks the DBMS to reject duplicate index keys;
- `ASC` or `DESC` specifies key order;
- a clustered choice also arranges the data records according to the indexing field;
- a nonclustered secondary index leaves the data file in its existing organization.

### Building a secondary B⁺-tree index

Inserting millions of existing records into an empty B⁺-tree one by one would repeatedly search and split nodes. A DBMS instead commonly uses <mark>**bulk loading**</mark>:

1. Scan the data file and produce one index entry per record.
2. Sort the entries by search-key value.
3. Pack leaf pages according to a chosen **fill factor**.
4. Build the upper levels from the leaf-page separators.

The fill factor leaves some free space for future insertions. A high initial occupancy uses less storage but may cause earlier splits; more reserved space delays splits but makes the initial index larger.

Creating a primary or clustering index is more expensive because the data file itself must be physically sorted or reorganized on the indexing field.

### Indexing strings

String search keys introduce two related problems:

- they may be variable-length;
- long values make each index entry larger and reduce the fan-out.

With variable-length keys, different B⁺-tree nodes can hold different numbers of entries. A node may run out of bytes even when its number of keys looks small.

<mark>**Prefix compression**</mark> reduces the cost in nonleaf nodes. An internal separator does not always need the complete key; it only needs the shortest prefix that distinguishes the adjacent subtrees.

> If one subtree ends around `Nachamkin` and the next starts around `Nayuddin`, a separator close to `Nay` can be sufficient. The full last name is still kept where needed at the leaf/data level.

Shorter separators increase fan-out, which can reduce the height of the tree and the number of block accesses per search.

## Tuning Indexes

The first index design is only a hypothesis about the workload. It may need revision when:

- an important query is slow because it lacks a suitable access path;
- an existing index is never selected by the query processor;
- an index is expensive to maintain because its key changes frequently;
- the job mix changes by time of day, week, month, or season;
- deletions and insertions leave the index poorly packed.

### Use execution plans as evidence

A DBMS can expose the <mark>**execution plan**</mark> used for a query. The plan shows the operations and their order, including whether the system chose a file scan or a particular index.

```sql
EXPLAIN
SELECT *
FROM Employee
WHERE department_no = 5;
```

The syntax and displayed costs vary across products, but the tuning loop is general:

1. Observe the real workload and identify expensive operations.
2. Inspect the chosen execution plans.
3. Determine whether a missing, unused, or costly index is involved.
4. Create, drop, change, or rebuild an index.
5. Measure again under a representative workload.

:::warning Do not tune from one query alone
An index that accelerates one retrieval can slow every insertion and update on the table. The objective is the best **overall** performance for the job mix, not the smallest time for one isolated query.
:::

### Rebuilding and reorganizing

Many deletions can leave underfilled B⁺-tree pages. Many insertions can cause splits and overflow areas, especially around clustered data. Rebuilding an index can reclaim wasted space and restore a better page layout.

Rebuilding a clustered index is more disruptive than rebuilding a secondary index because it can mean reorganizing the entire table in index order. Index creation, dropping, and rebuilding also consume resources and may restrict concurrent updates, depending on the DBMS.

## Additional Storage and Indexing Issues

### Enforcing constraints and handling duplicates

A unique index provides both an access path and a way to enforce a key constraint. During insertion, the same search needed to locate the insertion point reveals whether the key already exists.

For an index on a nonkey field, duplicate values must be represented. Common conceptual alternatives include:

- one key entry pointing to a list or bucket of record pointers;
- one leaf entry for every record;
- treating $\langle K, \text{row-id} \rangle$ as the unique internal index key.

Using a row identifier gives every occurrence a unique position even when many records share $K$. It also means deletion must distinguish “delete this record” from “delete all records having key $K$.”

Some systems mark records and index entries as deleted first, then reclaim the space later through garbage collection or an index rebuild. This reduces the work on the foreground deletion path but leaves cleanup for a later process.

### Fully inverted files

A file with a secondary index on every field is called a <mark>**fully inverted file**</mark>. The data file itself can remain an unordered heap, while the secondary indexes provide access through each indexed field.

This makes retrieval flexible but gives every insertion, deletion, and indexed-field update many structures to maintain. “Index everything” therefore exchanges read flexibility for storage and write overhead.

### Index hints

Some DBMSs let a query suggest or force a particular index through an optimizer hint. A hint can help when the optimizer lacks accurate information, but it also hard-codes an assumption about data distribution and system behavior.

:::warning Hints are not portable design rules
Hint syntax is DBMS-specific, and a good hint today may become harmful after the data or optimizer changes. Prefer accurate statistics and sound physical design; use hints only with measured evidence.
:::

### Column-based storage

Row storage keeps all fields of a record together. Column-based storage instead stores values from the same attribute together, effectively applying vertical partitioning.

This organization can benefit read-heavy analytical workloads because it can:

- read only the columns referenced by a query;
- use column-oriented and bitmap-like indexes;
- compress repeated values using dictionary or run-length encoding;
- combine projections and materialized results for common queries.

It is less naturally suited to reconstructing and updating complete rows, so systems may use different row- and column-oriented techniques depending on the workload.

## General Indexing Issues — Summary

- Physical indexes point directly to records; logical indexes point through a stable primary key.
- Secondary indexes can be bulk-loaded without physically ordering the data file.
- Long string keys reduce fan-out; prefix compression shortens internal separators.
- Indexes must be tuned using actual workloads and execution plans.
- Constraints, duplicate keys, deferred deletion, hints, and column storage all affect how index ideas become real DBMS implementations.
