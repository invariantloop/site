---
outline: deep
---

## Introduction

The previous note ended with a search tree that was correct but unusable: nothing stopped it from becoming unbalanced, nothing stopped its nodes from sitting nearly empty, and deletion could wreck it. Two extra constraints fix all three problems at once:

- every node must be at least **half full**;
- every leaf must sit at the **same level**.

A search tree with those constraints is a <mark>**B-tree**</mark>. It is a *dynamic* multilevel index: it grows and shrinks one node at a time, stays balanced without reorganization, and never needs the overflow chains that ruined ISAM.

## B-Trees

:::tip Definition
A <mark>**B-tree of order $p$**</mark> is a search tree in which each internal node has the form

$$
\langle P_1,\ \langle K_1, Pr_1 \rangle,\ P_2,\ \langle K_2, Pr_2 \rangle,\ \dots,\ \langle K_{q-1}, Pr_{q-1} \rangle,\ P_q \rangle \qquad q \le p
$$

where each $P_i$ is a **tree pointer** (to another node) and each $Pr_i$ is a <mark>**data pointer**</mark> — a pointer to the record, or to the block, holding search key value $K_i$.
:::

The constraints that make it a B-tree rather than a plain search tree:

| # | Constraint |
|---|---|
| 1 | Within a node, $K_1 < K_2 < \dots < K_{q-1}$ |
| 2 | For every value $X$ in the subtree at $P_i$: $\;K_{i-1} < X < K_i$ (with $X < K_1$ at $i=1$ and $K_{q-1} < X$ at $i=q$) |
| 3 | Each node has **at most $p$** tree pointers |
| 4 | Each node except the root and the leaves has **at least $\lceil p/2 \rceil$** tree pointers; the root has at least 2 unless it is the only node |
| 5 | A node with $q$ tree pointers holds exactly $q - 1$ key values and $q - 1$ data pointers |
| 6 | **All leaves are at the same level**; leaves have the same structure but all their tree pointers are null |

Constraint 4 is the *minimum occupancy* rule and constraint 6 is the *balance* rule — together they are the entire difference from the previous note's search tree.

[//]: # (![Structure of a B-tree node of order p with tree pointers, key values and data pointers, and a three-level B-tree of order p = 3]&#40;/images/database/17_3-image.png&#41;)

The crucial structural fact: **a data pointer sits next to every key, at every level**. A search for a value stored in the root finds it — and its record — after a single block access.

### Choosing $p$ for a real block

A node is a disk block, so $p$ is whatever makes a node fit. With the running example's parameters ($B = 1024$ bytes, key $V = 9$ bytes, record pointer $Pr = 7$ bytes, block pointer $P = 6$ bytes):

$$
(p \times P) + \big((p-1) \times (Pr + V)\big) \le B
$$

$$
6p + 16(p - 1) \le 1024 \;\Longrightarrow\; 22p \le 1040 \;\Longrightarrow\; p \le 47.2
$$

Take $p = 46$, leaving a few bytes of each block for node overhead (entry count, node type, free-space pointer).

### How much a B-tree holds

Random insertions and deletions leave B-tree nodes about **69% full** on average, so an average node has $46 \times 0.69 \approx 32$ tree pointers and therefore 31 entries:

| Level | Nodes | Entries at this level | Tree pointers out |
|---|---|---|---|
| 0 (root) | 1 | 31 | 32 |
| 1 | 32 | 992 | 1 024 |
| 2 | 1 024 | 31 744 | 32 768 |

A three-level B-tree holds $31 + 992 + 31\,744 = \mathbf{32\,767}$ entries on average — comfortably more than the 30 000 records of the running example. A fourth level takes it past **one million**.

:::info This is the multilevel index, made dynamic
The arithmetic is the same $\log_{fo} r$ from the previous note; only the maintenance changed. The B-tree buys its dynamism with the 31% of each block it deliberately leaves empty — space for growth *inside* the node, so an insertion usually touches one block instead of triggering a reorganization.
:::

## B⁺-Trees

The B-tree wastes its most valuable resource. Data pointers occupy 7 of every 16 bytes in an internal node, yet they are useful only for the handful of searches that stop early at that node. Moving them out makes internal nodes narrower, which makes $p$ larger, which makes the tree shallower.

That is the <mark>**B⁺-tree**</mark>: **data pointers live only in the leaves**, and internal nodes hold nothing but keys and tree pointers.

:::tip Definition
In a <mark>**B⁺-tree**</mark>, an **internal node** of order $p$ has the form

$$
\langle P_1,\ K_1,\ P_2,\ K_2,\ \dots,\ K_{q-1},\ P_q \rangle \qquad q \le p
$$

with $K_{i-1} < X \le K_i$ for every value $X$ in the subtree at $P_i$, and a **leaf node** of order $p_{leaf}$ has the form

$$
\langle \langle K_1, Pr_1 \rangle,\ \langle K_2, Pr_2 \rangle,\ \dots,\ \langle K_{q-1}, Pr_{q-1} \rangle,\ P_{next} \rangle \qquad q \le p_{leaf}
$$

where $P_{next}$ points to the **next leaf in key order**.
:::

Three consequences follow, and every one of them matters in practice:

- **Every search costs the same** — it always ends at a leaf, because that is where the data pointers are. No early termination, but no variance either.
- **Every key appears in a leaf.** A key in an internal node is only a **routing separator**; it may be a duplicate of a leaf key, and it may even name a value that has since been deleted.
- **The leaves form a linked list.** A range query descends once, then walks $P_{next}$ — sequential access without touching the tree again.

[//]: # (![Internal node and leaf node of a B+-tree, showing that data pointers appear only at the leaf level and that leaves are chained by a next-leaf pointer]&#40;/images/database/17_3-image1.png&#41;)

Note the $\le$ in the internal-node rule, where the B-tree had $<$: the separator $K_i$ is the *upper bound* of the subtree at $P_i$, so the value equal to $K_i$ is reachable through $P_i$, not through $P_{i+1}$.

### Choosing $p$ and $p_{leaf}$

The two node types now have different capacities and must be sized separately. Same parameters as before:

$$
\text{internal: } (p \times P) + \big((p-1) \times V\big) \le B \;\Longrightarrow\; 15p \le 1033 \;\Longrightarrow\; p \le 68.8 \;\Longrightarrow\; \mathbf{p = 68}
$$

$$
\text{leaf: } \big(p_{leaf} \times (Pr + V)\big) + P \le B \;\Longrightarrow\; 16\,p_{leaf} \le 1018 \;\Longrightarrow\; \mathbf{p_{leaf} = 63}
$$

$p$ jumped from 46 to 68 — a 48% wider fan-out from the single change of removing $Pr$ from internal nodes.

:::info 68 is not a coincidence
A B⁺-tree internal node holds $\langle V, P \rangle$ pairs and nothing else, which is exactly an entry of the primary index from note 17.1 — where $bfr_i = \lfloor 1024/15 \rfloor = 68$. **A B⁺-tree internal node *is* a block of a multilevel index**; the only thing the tree adds is the ability to split and merge those blocks in place.
:::

At 69% fill, an internal node averages 47 tree pointers and a leaf averages 43 entries. Capacity by height, against the B-tree of the same block size:

| Height | B-tree entries | B⁺-tree record pointers |
|---|---|---|
| 2 | 1 023 | 2 021 |
| 3 | 32 767 | 94 987 |
| 4 | 1 048 575 | 4 464 389 |

The running example's 30 000 records need three levels either way — but the B⁺-tree can triple in size before it needs a fourth.

## Searching

Search descends from the root, and at each node finds the position of $K$ among the separators and follows the corresponding tree pointer:

$$
\text{cost} = h \text{ block accesses to reach the leaf} \;+\; 1 \text{ for the data block}
$$

For the running example, $h = 3$, so **4 block accesses** — the same figure the static multilevel index achieved, now holding under insertions and deletions.

A <mark>**range query**</mark> is where the two structures separate. `WHERE Ssn BETWEEN a AND b` on a B⁺-tree descends once to the leaf holding $a$, then follows $P_{next}$ until it passes $b$: $h$ accesses plus one per leaf block of the answer. The same query on a B-tree has no leaf chain, so it must traverse the tree in key order, re-reading internal nodes as it goes.

## Insertion

Insertion always starts at a **leaf**, and only propagates upward when something overflows.

| Situation | Action |
|---|---|
| Leaf has room | Insert in key order. Done — one block written |
| Leaf is full | **Split**: distribute the $p_{leaf} + 1$ values, and **copy up** the smallest value of the new right leaf into the parent — the value *stays* in the leaf |
| Internal node is full | **Split**: distribute the $p$ pointers, and **move up** the middle key into the parent — the value does *not* stay |
| The root splits | A new root is created with a single key. **This is the only way a B⁺-tree gains height**, which is why it stays balanced |

The copy-up/move-up asymmetry is the whole reason B⁺-trees work: a leaf may not lose a value (it holds the only data pointer to it), while an internal node's key is only a separator and can move freely.

### Trace: inserting 8, 5, 1, 7, 3, 12, 9, 6

With $p = 3$ and $p_{leaf} = 2$ — deliberately tiny, so nearly every insertion overflows something.

| Insert | What happens | Tree after |
|---|---|---|
| 8 | New tree; the root is a leaf | `[8]` |
| 5 | Fits | `[5,8]` |
| 1 | Leaf overflows (1,5,8) → split, **copy up** 5 | `[5]` → `[1] [5,8]` |
| 7 | Leaf `[5,8]` overflows (5,7,8) → split, copy up 7 | `[5,7]` → `[1] [5] [7,8]` |
| 3 | Fits in `[1]` | `[5,7]` → `[1,3] [5] [7,8]` |
| 12 | Leaf `[7,8]` overflows → split, copy up 8 → root would be `[5,7,8]`, 4 pointers > $p$ → split the root, **move up** 7 | `[7]` → `[5] [8]` → `[1,3] [5] [7] [8,12]` |
| 9 | Leaf `[8,12]` overflows (8,9,12) → split, copy up 9; parent `[8]` becomes `[8,9]`, still within $p$ | `[7]` → `[5] [8,9]` → `[1,3] [5] [7] [8] [9,12]` |
| 6 | Routed left of 7, right of 5; fits in `[5]` | `[7]` → `[5] [8,9]` → `[1,3] [5,6] [7] [8] [9,12]` |

[//]: # (![Step-by-step insertion of the sequence 8, 5, 1, 7, 3, 12, 9, 6 into a B+-tree with p = 3 and pleaf = 2, showing each leaf and internal split]&#40;/images/database/17_3-image2.png&#41;)

Note step 12: one leaf split cascaded into a root split and the tree grew from two levels to three — the *only* moment its height changed, and every leaf moved down together.

## Deletion

Deletion also starts at a leaf, and only propagates upward when a node falls below its minimum: $\lceil p_{leaf}/2 \rceil$ values for a leaf, $\lceil p/2 \rceil$ tree pointers for an internal node.

| Situation | Action |
|---|---|
| Leaf stays at or above minimum | Remove the entry. If the value also appears as a separator above, replace it there with the next value (it is only a separator, so leaving it is also correct) |
| Leaf **underflows**, a sibling has a spare | <mark>**Redistribute**</mark>: move one entry across from the sibling and update the separator in the parent. Cheaper than merging, and it touches three blocks |
| Leaf underflows, no sibling can spare | <mark>**Merge**</mark> the leaf with a sibling, delete the now-unused separator from the parent — which may make the **parent** underflow, and so on upward |
| The root is left with one pointer | Delete it and make its only child the new root. **This is the only way a B⁺-tree loses height** |

:::warning Redistribute before you merge
Merging is the expensive path: it deletes a separator from the parent and can cascade all the way to the root. Always check whether an adjacent sibling has a spare entry first — most underflows are absorbed by a single redistribution and never touch the level above.
:::

### Trace: deleting 5, 12, 9

Continuing from the tree built above.

| Delete | What happens | Tree after |
|---|---|---|
| 5 | Leaf `[5,6]` → `[6]`, still at the minimum of 1. But 5 is a separator in the level above, so it is replaced by 6 | `[7]` → `[6] [8,9]` → `[1,3] [6] [7] [8] [9,12]` |
| 12 | Leaf `[9,12]` → `[9]`; at the minimum, and 12 was never a separator | `[7]` → `[6] [8,9]` → `[1,3] [6] [7] [8] [9]` |
| 9 | Leaf `[9]` empties → underflow. The left sibling `[8]` holds exactly its minimum, so it cannot lend → **merge**, and remove separator 9 from the parent. The parent drops to 2 tree pointers = $\lceil 3/2 \rceil$, exactly its minimum, so the cascade stops | `[7]` → `[6] [8]` → `[1,3] [6] [7] [8]` |

[//]: # (![Step-by-step deletion of 5, 12 and 9 from a B+-tree with p = 3 and pleaf = 2, showing separator replacement, redistribution and merging]&#40;/images/database/17_3-image3.png&#41;)

## B-Tree vs. B⁺-Tree

| | B-tree | B⁺-tree |
|---|---|---|
| Data pointers | In **every** node | In **leaves only** |
| Order | One $p$ | Separate $p$ and $p_{leaf}$ |
| Fan-out (running example) | 46 | **68** |
| Search cost | $\le h$, sometimes less | Always $h$ |
| Range / ordered scan | Full traversal, revisits internal nodes | Descend once, follow the **leaf chain** |
| Key duplication | None — each key stored once | Separators duplicate leaf keys |
| Deletion | Removing a key from an internal node needs a replacement from a subtree | Only leaves hold data; internal keys are separators, so deletion stays local |
| Used by real DBMSs | Rarely | **Almost universally** |

The B⁺-tree wins on the two things that decide index performance: a wider fan-out (fewer levels) and a leaf chain (cheap range scans). When a DBMS manual says "index", it means a B⁺-tree.

## Variations

Real implementations depart from the textbook structure in a few consistent ways.

**B\*-trees.** Raise the minimum occupancy from $1/2$ to $2/3$. Before splitting a full node, the algorithm tries to push entries into a sibling; a split happens only when *two* adjacent nodes are full, and it turns them into **three** two-thirds-full nodes. Fewer, fuller nodes means a shallower tree, paid for with more work per insertion.

**Key compression.** Separators in internal nodes only need to *distinguish* subtrees, not reproduce keys exactly. With character keys, storing the shortest distinguishing prefix — `Br` instead of `Brown` — packs far more separators into a block, raising $p$ where it matters most. This is the <mark>**prefix B⁺-tree**</mark>. Leaf entries, which carry real data pointers, are usually compressed only against their neighbours.

**Bulk loading.** Building an index by inserting records one at a time costs a full root-to-leaf descent per record and leaves nodes ~69% full. <mark>**Bulk loading**</mark> instead sorts the key values, fills leaf blocks sequentially to a chosen <mark>**fill factor**</mark>, then builds each level above from the level below. It is dramatically faster, and the fill factor is a tuning knob: pack tight (95%) for a read-only table, leave slack (60%) for one that will grow.

**Variable-length keys.** With `VARCHAR` keys there is no single $p$ — the constraint becomes "a node must be at least half full **in bytes**", and split points are chosen by byte offset rather than entry count.

**Duplicate keys.** On a nonkey field a value maps to many records. Implementations either repeat the key once per record pointer, or store one key with a list of record pointers (the indirection of note 17.1), or append a unique tiebreaker such as the row id to make every key distinct.

**Concurrency.** Because every insertion and deletion begins at the root, a naive lock on the root would serialize the whole index. Real systems use latch-coupling: latch a child, release the parent as soon as the child is known not to split — which is why "will this node split?" is decided on the way *down*, not on the way back up.
