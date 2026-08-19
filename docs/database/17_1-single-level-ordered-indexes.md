---
outline: deep
---

## Introduction

The previous chapter ended with an uncomfortable number: finding one record in a 3 000-block heap file costs about 1 500 block accesses, and even a sorted file only gets that down to 12 — and only when the search is on the ordering field.

<mark>**Indexes**</mark> are *additional* access structures built on top of a file to speed up retrieval on fields that the file's own organization does not help with.

:::tip Definition
An <mark>**index**</mark> is an auxiliary file whose entries are pairs

$$
\langle \text{field value},\ \text{pointer} \rangle
$$

sorted on the field value, so that a search on that field can be answered by searching the (much smaller) index instead of the data file.
:::

The analogy is the index at the back of a book: it is much thinner than the book, it is sorted, and each entry tells you which page to turn to. Two properties make it work, and both matter for database indexes too:

- the index is **smaller** than the data — an entry holds one field value and a pointer, not a whole record, so far more entries fit in a block;
- the index is **ordered**, so binary search applies even when the data file is unordered.

An index is defined on a single field of the file, called the <mark>**indexing field**</mark> (or indexing attribute). A file can have **several indexes**, on different fields, all at the same time.

### Dense vs. sparse

Every index in this note is one of two kinds, and the distinction decides its size:

:::tip Definition
A <mark>**dense index**</mark> has an index entry for **every record** (every search key value) in the data file.

A <mark>**sparse index**</mark> has entries for only **some** of the values — typically one per *block* of the data file.
:::

A sparse index is only possible when the data file is **physically ordered** on the indexing field: if the file is sorted, an entry pointing at a block is enough, because everything between two consecutive index entries must live in the blocks between their pointers. On an unordered field, the records with a given value are scattered, so nothing but a dense index will do.

### The running example

All the cost numbers in this note come from one file, so the index types can be compared directly.

| Parameter | Value |
|---|---|
| Records $r$ | 30 000 |
| Block size $B$ | 1 024 bytes |
| Record size $R$ | 100 bytes, fixed length, unspanned |
| Blocking factor $bfr = \lfloor B/R \rfloor$ | 10 records/block |
| File size $b = \lceil r/bfr \rceil$ | **3 000 blocks** |

The file is ordered on the key field `Ssn` (9 bytes). A block pointer $P$ is 6 bytes, a record pointer $P_r$ is 7 bytes.

Without any index: linear search averages $b/2 = 1500$ block accesses, binary search on `Ssn` costs $\lceil \log_2 3000 \rceil = 12$.

## Primary Index

:::tip Definition
A <mark>**primary index**</mark> is an ordered file whose records are of fixed length with two fields: the value of the **ordering key field** of the data file, and a pointer to a disk **block**. There is **one index entry per block** of the data file.
:::

The value stored in entry $i$ is the ordering key value of the **first record** in block $i$ — that record is called the <mark>**block anchor**</mark>.

![Primary index on the ordering key field Ssn: each index entry holds the Ssn of the first record (block anchor) of a data block together with a pointer to that block](/images/database/17_1-image.png)

A primary index is therefore:

- **sparse** — one entry per block, not per record;
- available on **at most one field per file**, since a file can be physically ordered only one way;
- dependent on the ordering field being a **key** (unique values).

### Why it is small

$$
R_i = V + P = 9 + 6 = 15 \text{ bytes} \qquad
bfr_i = \left\lfloor \frac{1024}{15} \right\rfloor = 68 \text{ entries/block}
$$

The number of entries $r_i$ equals the number of data blocks, 3 000, so

$$
b_i = \left\lceil \frac{3000}{68} \right\rceil = 45 \text{ blocks}
$$

A binary search on the index costs $\lceil \log_2 45 \rceil = 6$ accesses, plus **one** access to fetch the data block:

$$
6 + 1 = \mathbf{7} \text{ block accesses, versus } 12 \text{ for binary search on the data file}
$$

:::info Reading the entry that "isn't there"
Searching a primary index does not look for an exact match. To find record $K$, the search locates the **last** index entry whose value is $\le K$ — entry $i$ with $K_i \le K < K_{i+1}$ — and follows its pointer. The record, if it exists, is in that one block.
:::

### The insertion problem

A primary index inherits the sorted file's weakness and adds one of its own: inserting a record both shifts records in the data file **and** may change a block anchor, forcing index entries to change too.

The standard remedies are the ones from sorted files: an <mark>**overflow file**</mark> of unsorted new records merged in periodically, or a linked list of overflow records hanging off each block. Deletion again uses **deletion markers**, so the index only needs updating when a block anchor disappears.

## Clustering Index

:::tip Definition
A <mark>**clustering index**</mark> is used when the data file is physically ordered on a **non-key** field — a field with duplicate values, called the <mark>**clustering field**</mark>. It has **one entry per distinct value** of that field, pointing to the **first block** that contains a record with that value.
:::

![Clustering index on the non-key ordering field Dept_number: one index entry per distinct department value, each pointing to the first data block containing records of that department](/images/database/17_1-image1.png)

It is also **sparse** — entries exist per distinct value, not per record — and, like the primary index, a file can have at most one, because it depends on physical ordering.

Suppose the 30 000-record file is instead ordered on `Dept_number` (4 bytes) with 1 000 distinct departments:

$$
R_i = 4 + 6 = 10, \quad bfr_i = \left\lfloor \frac{1024}{10} \right\rfloor = 102, \quad b_i = \left\lceil \frac{1000}{102} \right\rceil = 10 \text{ blocks}
$$

$$
\text{search cost} = \lceil \log_2 10 \rceil + 1 = 4 + 1 = 5 \text{ block accesses}
$$

That locates the *first* block of the matching department; the remaining records of that department follow in the next blocks and are read sequentially.

:::info Blocks reserved per value
Insertion is still expensive, because records must stay grouped by value. A common fix is to give **each distinct value its own block (or chain of blocks)**, linked by pointers. Insertion then only touches the chain for that value, and the index entry never has to move — at the cost of wasting space in partially filled blocks.
:::

## Secondary Index

:::tip Definition
A <mark>**secondary index**</mark> is an ordered file on a field that is **not** the physical ordering field of the data file. The indexing field is called a <mark>**secondary key**</mark>.
:::

This is the index type that a file can have **many** of — one for every field that queries filter on. Because the data file is not ordered on the field, the index cannot be sparse.

### Case 1 — the field is a key

One entry per record, pointing to the record (or to its block): a **dense** index, sorted on the secondary key value.

![Secondary index on a non-ordering key field: a dense index file with one entry per record of the unordered data file, each entry pointing directly at its record](/images/database/17_1-image2.png)

For the running example, a secondary index on a 9-byte key field:

$$
R_i = 9 + 6 = 15, \quad bfr_i = 68, \quad r_i = r = 30\,000, \quad b_i = \left\lceil \frac{30\,000}{68} \right\rceil = 442 \text{ blocks}
$$

$$
\text{search cost} = \lceil \log_2 442 \rceil + 1 = 9 + 1 = \mathbf{10} \text{ block accesses}
$$

Compare that with $b/2 = 1500$ for a linear scan of the data file — a factor of 150 improvement, bought with 442 blocks of extra storage.

:::warning A secondary index is much bigger than a primary one
442 blocks against 45, for the *same* file and the *same* field width. The difference is entirely density: one entry per record instead of one per block. This is why a single-level secondary index is rarely enough, and why multilevel indexes matter most here.
:::

### Case 2 — the field is not a key

Now several records share a value, and the index has to point to all of them. Three options:

| Option | How it works | Cost |
|---|---|---|
| **Duplicate entries** | One index entry per *record*, with the value repeated | Index no longer has unique keys; largest of the three |
| **Variable-length entries** | One entry per distinct value, holding a list of record pointers | Variable-length records in the index — awkward to search and update |
| **Level of indirection** (usual choice) | One entry per **distinct value**, pointing to a *block of record pointers*; that block lists every record with the value | Index stays fixed-length and dense on distinct values; costs one extra block access |

![Secondary index with a level of indirection: each index entry for a distinct field value points to a block of record pointers, which in turn point at all records holding that value](/images/database/17_1-image3.png)

The indirection option also makes **retrieval of all matching records** convenient: read one pointer block, then fetch exactly the records needed — no scanning.

## Comparison

| | Ordering field? | Key field? | Dense/Sparse | Number of entries | Per file |
|---|---|---|---|---|---|
| **Primary index** | Yes | Yes | Sparse | One per **block** | At most 1 |
| **Clustering index** | Yes | No | Sparse | One per **distinct value** | At most 1 |
| **Secondary index (key)** | No | Yes | Dense | One per **record** | Many |
| **Secondary index (non-key)** | No | No | Dense on values | One per **distinct value** (with indirection) | Many |

Cost for the running example, all on the same 3 000-block file:

| Access path | Block accesses |
|---|---|
| Linear search, no index | 1 500 |
| Binary search on ordering field | 12 |
| Primary index (45 blocks) | 7 |
| Clustering index (10 blocks) | 5 |
| Secondary index on a key (442 blocks) | 10 |

:::tip What is still wrong
Every number above comes from a **binary search on the index file**, which is itself just an ordered file — so the index has exactly the problems the data file had: $\log_2 b_i$ accesses, and expensive insertion.

The obvious move is to apply the idea again and **index the index**. That is the multilevel index, and it is the subject of the next note.
:::
