---
outline: deep
---

## Introduction

A single-level index is an ordered file, and searching it means a binary search: $\lceil \log_2 b_i \rceil$ block accesses. For the secondary index of the previous note that was 9 accesses over 442 blocks — better than scanning the data, but still logarithmic in a **base of 2**.

The insight of the <mark>**multilevel index**</mark> is that the index is a *sorted file with a key field*, so it can be indexed exactly like the data file was — and each level shrinks the search by the blocking factor rather than by half.

## Multilevel Indexes

:::tip Definition
A <mark>**multilevel index**</mark> treats an index file as an ordered file and builds a **primary index** over it. The original index is the <mark>**first (base) level**</mark>; the index over it is the **second level**; the process repeats until a level fits in **one block**, the <mark>**top level**</mark>.
:::

Every level above the first is a primary index over the level below: sparse, one entry per block, using block anchors. This is possible even when the base level is a dense secondary index, because the base level *is* physically ordered on its search key and its key values *are* unique (or made unique by indirection).

![A two-level index: the second-level index has one entry per block of the first-level index, and each first-level entry points into the data file](/images/database/17_2-image.png)

### Fan-out

The number of entries per index block plays the role that "2" plays in binary search:

:::tip Definition
The <mark>**fan-out**</mark> $fo$ is the blocking factor of an index block — the number of index entries that fit in one block. Each level of a multilevel index is smaller than the level below it by a factor of $fo$.
:::

With $r_1$ entries at the base level, the number of levels is

$$
t = \lceil \log_{fo} r_1 \rceil
$$

and the search cost is

$$
t + 1 \text{ block accesses (one per level, plus the data block)}
$$

Because $fo$ is typically in the tens or hundreds while binary search's base is 2, the reduction is dramatic.

### Applying it to the running example

The 30 000-record file of the previous note, with a dense secondary index of $r_1 = 30\,000$ entries and $fo = bfr_i = 68$:

| Level | Entries | Blocks |
|---|---|---|
| 1 (base, dense) | 30 000 | $\lceil 30000/68 \rceil = 442$ |
| 2 | 442 | $\lceil 442/68 \rceil = 7$ |
| 3 (top) | 7 | $\lceil 7/68 \rceil = 1$ |

$$
t = 3, \qquad \text{search cost} = 3 + 1 = \mathbf{4} \text{ block accesses}
$$

Against 10 for the single-level version, and 1 500 for a linear scan.

The same treatment of the **primary** index (45 blocks, 3 000 base entries) gives a second level of $\lceil 45/68 \rceil = 1$ block, so $t = 2$ and the search costs **3** accesses.

| Access path | Block accesses |
|---|---|
| Linear search | 1 500 |
| Binary search on ordering field | 12 |
| Single-level secondary index | 10 |
| **Multilevel secondary index** | **4** |
| **Multilevel primary index** | **3** |

:::info Why the numbers stop shrinking
Each level costs one access and divides the remaining entries by $fo$, so the cost grows like $\log_{fo} r$. For $fo \approx 68$, three levels already address $68^3 \approx 314\,000$ entries and four levels $\approx 21$ million. Real indexes are almost never deeper than 3–4 levels, which is why "an index lookup costs a handful of I/Os" is a safe rule of thumb.
:::

## ISAM and the Problem with Static Indexes

The multilevel index described above is <mark>**static**</mark>: the levels were computed once, from a file of a known size, and every block is full.

This is the classic <mark>**ISAM**</mark> (Indexed Sequential Access Method) organization, and it breaks down as soon as the file changes:

- **Insertion** into a full index block cannot simply shift entries — shifting propagates through the whole level, and changing a block anchor propagates *upward* to every level above.
- The practical workaround is an <mark>**overflow chain**</mark> per block: new entries that do not fit go into overflow blocks linked to their home block.
- Search now costs $t + (\text{length of the overflow chain}) + 1$, and the chains grow without bound.
- Deletions leave empty space that only reorganization reclaims.

:::warning The real cost of overflow chains
An ISAM index degrades **unevenly**. A key range that receives many inserts grows a long chain while the rest of the index stays pristine, so average search cost stays deceptively good while the hot part of the file gets slow. Restoring performance requires a full **reorganization** — rebuilding every level offline.
:::

What is needed is an index that leaves **space for growth inside each block** and that grows or shrinks **one node at a time**, keeping itself balanced without reorganization. That is a *dynamic* multilevel index, and it is built on trees.

## Trees as Index Structures

### Tree terminology

A <mark>**tree**</mark> is made of <mark>**nodes**</mark>. Each node except the <mark>**root**</mark> has one <mark>**parent**</mark> and zero or more <mark>**child**</mark> nodes; a node with no children is a <mark>**leaf**</mark>, and a node with children is an <mark>**internal node**</mark>. The <mark>**level**</mark> of a node is its distance from the root (root is level 0), and the tree's <mark>**height**</mark> is the number of levels.

The mapping to indexes is direct: **one node = one disk block**, so the height of the tree *is* the number of block accesses per search, and a fat node (many children) is exactly a high fan-out.

### Search trees

:::tip Definition
A <mark>**search tree of order $p$**</mark> is a tree in which each node holds at most $p - 1$ search values and $p$ pointers, arranged as

$$
\langle P_1,\ K_1,\ P_2,\ K_2,\ \dots,\ K_{q-1},\ P_q \rangle \qquad q \le p
$$

with $K_1 < K_2 < \dots < K_{q-1}$, where $P_i$ points to the subtree holding all values $X$ with $K_{i-1} < X < K_i$.
:::

![A search tree node of order p, showing alternating tree pointers and search key values, and the range of key values reachable through each pointer](/images/database/17_2-image1.png)

Searching for value $K$ starts at the root, finds the position of $K$ among the node's values, and follows the corresponding pointer — one block access per level, exactly as in a multilevel index. Used as an index, each key value is stored alongside a **data pointer** to the record with that value.

### Why a plain search tree is not enough

Nothing in the definition controls the tree's **shape**:

| Problem | Consequence |
|---|---|
| The tree can become **unbalanced** | Some leaves sit far deeper than others, so search cost varies wildly and can degenerate toward $O(r)$ |
| Nodes may be **nearly empty** | A node is a disk block; a node holding 2 of 68 possible entries wastes most of a block access |
| **Deletion** is awkward | Removing a value from an internal node requires reorganizing subtrees, with no rule guaranteeing the result stays usable |

The fix is to impose two extra constraints — a **minimum** occupancy for every node, and the requirement that **all leaves be at the same level**. A search tree with those constraints is a **B-tree**, the subject of the next note.
