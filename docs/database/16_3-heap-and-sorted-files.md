---
outline: deep
---

## Introduction

There are two elementary ways to place records in a file, and they sit at opposite ends of the same trade-off: **heap files** make insertion trivial and search expensive, **sorted files** make search (and ordered retrieval) cheap and insertion expensive.

Throughout, the cost measure is the number of **block accesses**, since disk I/O dominates. Notation follows the previous note: **b** blocks, **r** records, **bfr** records per block.

## Files of Unordered Records (Heap Files)

:::tip Definition
In a <mark>**heap** (or **pile**) file</mark>, records are placed in the file **in the order they are inserted** — new records go at the **end** of the file. No ordering is maintained at all.
:::

This organization is what a DBMS uses when a table is created with no clustering or index specified — the plain, unadorned table.

### Insertion — the cheap case

Inserting is very efficient:

1. Read the **last block** of the file into a buffer (its address is kept in the **file header**).
2. Append the new record to that buffer.
3. Write the block back to disk.

$$
\text{cost of insert} = 1 \text{ read} + 1 \text{ write} = 2 \text{ block accesses}
$$

### Searching — the expensive case

There is no structure to exploit, so retrieval uses a <mark>**linear search**</mark>: read block 0, scan its records, read block 1, scan, … until a match is found or the file is exhausted.

| Case | Block accesses |
|---|---|
| Record found, on average | $b/2$ |
| Record not present (or searching for **all** matches) | $b$ |
| Search on a **key** field with the record present | $b/2$ on average |

For a file of 100 000 blocks, that averages **50 000 block accesses** for a single record — which is precisely why indexes exist.

### Deletion

Deleting a record means: find its block, read it into a buffer, remove the record from the buffer, and write the block back. This leaves a **hole**.

:::info Deletion markers
Rather than physically compacting the block on every delete, each record carries an extra bit — a <mark>**deletion marker**</mark>. Deleting sets the marker; search routines simply ignore marked records.

- **Cheaper deletes**, and the space can be reused by a later insert into the same block.
- But the file keeps growing with dead records, so it must be **reorganized periodically** — the file is rewritten with all marked records dropped, reclaiming the space and shrinking `b`.
:::

### Reading in order

Retrieving heap records **sorted by some field** requires physically sorting the file. Because the file is far larger than main memory, this uses <mark>**external sorting**</mark> (a sort–merge that repeatedly sorts memory-sized runs and merges them) — expensive, and a strong argument for keeping the file ordered in the first place if ordered access is frequent.

:::tip Relative (direct) files
If the heap file uses **fixed-length, unspanned** records over **contiguously allocated** blocks, then record *i* sits at a computable position:

$$
i \text{ is in block } \left\lfloor \frac{i}{bfr} \right\rfloor
\text{, at offset } (i \bmod bfr) \times R
$$

This gives **direct access by record number** in a single block access — a *relative* or *direct* file. It doesn't help searching **by field value**, only by ordinal position.
:::

## Files of Ordered Records (Sorted Files)

:::tip Definition
In an <mark>**ordered** (or **sequential**) file</mark>, records are kept physically sorted on the values of one field, the <mark>**ordering field**</mark>. If that field is also a key (unique per record) it is called the <mark>**ordering key**</mark>.
:::

### What ordering buys you

| Advantage | Why |
|---|---|
| **Ordered retrieval is nearly free** | Reading records in order of the ordering field just means reading the blocks in sequence — no sort needed |
| **`FindNext` costs nothing extra** | The next record in order is the next one in the same buffer; a new block access is needed only when the block runs out |
| <mark>**Binary search on the ordering field**</mark> | Instead of scanning, halve the block range each step |

$$
\text{binary search cost} = \left\lceil \log_2 b \right\rceil \text{ block accesses}
$$

For the same 100 000-block file: **17** block accesses instead of 50 000.

:::warning The advantage is narrow
Binary search only works on the **ordering field**. A search on any *other* field is back to a linear scan — `b/2` on average, exactly like a heap file. Ordering also does nothing for **range queries on other fields**.
:::

### What ordering costs you

Insertion and deletion are expensive, because the sorted order must be preserved: inserting into the middle means **shifting on average half the file's records** to make room. Naively that is *O(b)* block accesses per insert.

The standard remedy is to stop keeping the whole file sorted at all times:

:::info Overflow (transaction) file
Keep two files:

- the **main file**, sorted;
- an <mark>**overflow / transaction file**</mark>, an **unordered heap** holding recently inserted records.

New records go straight into the overflow file — insertion is back to ~2 block accesses. Periodically the overflow file is **sorted and merged** into the main file (a *reorganization*), after which the overflow file is emptied.

The price: a search must now check **both** files — binary search on the main file *plus* a linear search of the (deliberately small) overflow file. Retrieval **in order** also requires merging the two.
:::

- **Deletion** uses the same **deletion markers** as heap files, with periodic reorganization to reclaim space.
- **Modification**: changing a **non-ordering** field is simple — read block, change value, write back. Changing the **ordering field** may move the record's correct position, so it is implemented as a **delete followed by an insert**.

### Cost comparison

Average block accesses for the basic operations:

| Operation | Heap (unordered) | Sorted, on **ordering** field | Sorted, on **other** field |
|---|---|---|---|
| Fetch one record | $b/2$ | $\log_2 b$ | $b/2$ |
| Insert | $2$ | $\log_2 b + b$ (shift records) — or $2$ with overflow | same |
| Delete (with marker) | $b/2 + 1$ | $\log_2 b + 1$ | $b/2 + 1$ |
| Read all records in order of the field | sort the file (external sort) | $b$ (sequential read) | sort the file |
| Range query on the field | $b$ | $\log_2 b$ + sequential scan of the range | $b$ |

:::tip Why ordered files are rare in practice
An ordered file alone is seldom used in a database — the insertion cost is too high and the benefit applies to only one field. What *is* extremely common is an ordered file **plus a primary index** on the ordering key: the index replaces the binary search with a couple of block accesses and makes the organization genuinely fast. That combination is the subject of the indexing chapter.

For the same reason, when access is dominated by **equality search on one field** rather than ordered/range access, **hashing** is the better organization — covered next.
:::
