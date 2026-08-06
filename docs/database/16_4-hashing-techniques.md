---
outline: deep
---

## Introduction

Heap files and sorted files both make the DBMS *hunt* for a record: a linear scan costs $b/2$ block accesses on average, a binary search on the ordering field costs $\lceil \log_2 b \rceil$. <mark>**Hashing**</mark> takes a different route — it *computes* where the record lives.

:::tip Definition
A <mark>**hash file organization**</mark> stores each record at an address derived from one of its fields by a <mark>**hash function**</mark> $h$. The field is the <mark>**hash field**</mark>; if it is also a key of the file, it is the <mark>**hash key**</mark>.
:::

The payoff is that an **equality search on the hash field** — `WHERE ssn = '123456789'` — takes roughly **one block access**, independent of file size. The price is that hashing provides *no* help for anything else: no ordered retrieval, no range queries, no searching on other fields.

| Organization | Equality search on the field | Ordered / range access |
|---|---|---|
| Heap | $b/2$ | none (must sort) |
| Sorted (ordering field) | $\log_2 b$ | excellent |
| **Hashed (hash field)** | **~1** | **none** |

## Internal Hashing

Internal hashing is hashing applied to a table held **in main memory**, and it is the model everything else builds on. The table is an array of $M$ **slots**, indexed $0 \dots M-1$, and the hash function maps a key onto a slot number.

The workhorse function for numeric keys is the **division-remainder** method:

$$
h(K) = K \bmod M
$$

:::info Choosing $M$
$M$ should be a **prime number** (or at least have no small factors). If $M$ shares factors with patterns in the keys — say $M = 1000$ and keys are ids ending in fixed digits — whole ranges of slots go unused while others pile up. A prime $M$ spreads the values much more evenly.
:::

Non-numeric keys must first be turned into an integer. Two common tricks:

- **Character arithmetic** — sum the numeric codes of the characters, then take $\bmod\ M$.
- <mark>**Folding**</mark> — split the key into pieces of equal length, then add (or XOR) the pieces together before applying $\bmod\ M$. Folding uses *all* of the key, so keys sharing a prefix or suffix still land apart.

### Collisions

A hash function maps a large key space onto a small address space, so two distinct keys will eventually hash to the same slot. That is a <mark>**collision**</mark>, and the procedure for placing the second record is <mark>**collision resolution**</mark>.

Collisions are not a rare accident to be engineered away — they are guaranteed, and the quality of a hash organization is mostly the quality of its collision handling.

### Collision Resolution

| Method | How it works | Cost / behaviour |
|---|---|---|
| <mark>**Open addressing**</mark> | On collision, probe the following slots ($h(K)+1, +2, \dots$, wrapping around) until a free one is found. Search repeats the same probe sequence. | No extra space, but colliding records cluster together, and one cluster lengthens the search for *unrelated* keys |
| <mark>**Chaining**</mark> | Each slot holds a pointer to a linked list of **overflow** records kept in an extra area beyond the $M$ slots. | Search follows one pointer chain; deletion is easy; needs pointer space |
| <mark>**Multiple hashing**</mark> | On collision, apply a *second* hash function $h_2$; if that also collides, fall back to open addressing. | Avoids clustering better than plain probing, at the cost of extra computation |

:::warning Keep the table from filling up
Hashing degrades sharply as the table fills. The <mark>**load factor**</mark> is

$$
\alpha = \frac{\text{number of records}}{\text{number of slots}}
$$

Performance stays close to one access while $\alpha$ is roughly **0.7 to 0.9**; past that, probe sequences and overflow chains grow quickly. Hash files are therefore deliberately allocated with **spare space**.
:::

Deletion under open addressing is awkward for the same reason: physically removing a record breaks the probe chain of records placed after it, so deleted slots are marked rather than emptied — the same **deletion marker** idea used in heap files.

## External Hashing for Disk Files

Moving to disk changes one thing fundamentally: the unit of transfer is a **block**, not a record. Hashing to individual record addresses would waste an entire block access per record and make collisions catastrophic. So disk hashing hashes to <mark>**buckets**</mark>.

:::tip Definition
A <mark>**bucket**</mark> is either one disk block or a small cluster of contiguous blocks. The hash function maps a key to a **bucket number**, and a <mark>**bucket-address table**</mark> converts that bucket number into the actual disk block address.
:::

$$
h(K) = K \bmod M \quad\Longrightarrow\quad \text{bucket } 0 \dots M-1 \;\xrightarrow{\text{table}}\; \text{block address}
$$

This indirection matters: it lets the file's blocks be relocated on disk without changing the hash function.

Because a bucket holds many records — `bfr` of them — a collision is only a *problem* when the bucket is **full**. Several keys hashing to the same bucket is the normal, desirable case.

### Overflow handling

When a bucket fills, the extra records go into an <mark>**overflow area**</mark>, and each bucket keeps a pointer to a **linked list (chain)** of its own overflow records. Chaining is the standard choice on disk, since following a pointer costs one block access while probing neighbouring buckets would scatter reads across the file.

![Bucket with a chained overflow area: main buckets 0..M-1 each hold a pointer into a shared overflow block area, with records linked in per-bucket chains](/images/database/16_4-image.png)

Retrieval cost is therefore:

$$
\text{cost} = 1 \;+\; (\text{length of the overflow chain})
$$

which stays near **1 block access** as long as buckets are not overloaded — and that is the entire design goal.

### Operations

- **Insert** — hash to the bucket, read it, add the record if there is room, write it back. If full, append to the overflow chain.
- **Delete** — locate the record, remove it, and if a record is available in the overflow chain, **move it up** into the main bucket so future searches stay short.
- **Modify** — changing a **non-hash** field is a read/write in place. Changing the **hash field** relocates the record, so it is implemented as a **delete followed by an insert**.

### The problem with static hashing

Everything above is <mark>**static hashing**</mark>: $M$ is fixed when the file is created. That is fine for a file of stable size and bad for anything that grows.

:::warning Why $M$ fixed hurts
- **Too small an $M$** — buckets overflow, chains grow, and the one-access guarantee is lost.
- **Too large an $M$** — most buckets sit mostly empty, wasting a great deal of disk.
- **Fixing it means rehashing** — choosing a new $M$ and redistributing *every* record in the file, since the addresses all change. For a large file this is a full offline reorganization.
:::

The techniques in the next section exist to make a hash file **grow and shrink gracefully**, without ever rehashing the whole thing.

## Dynamic File Expansion

All three schemes below share the same core idea, so it is worth stating once.

Instead of using $h(K) \bmod M$, apply a hash function that produces a **long bit string** — the <mark>**hash value**</mark> — and use only the **leading $i$ bits** of it to choose a bucket:

$$
h_i(K) = \text{first } i \text{ bits of } h(K)
$$

Using $i$ bits gives $2^i$ possible buckets. Adding **one more bit** doubles the address space, and — crucially — it splits each bucket into exactly two: the records whose next bit is `0` and those whose next bit is `1`. So the file can be expanded **one bucket at a time**, touching only the records in the bucket being split. No global rehash.

The three techniques differ in *how they keep track* of which buckets have been split.

### Extendible Hashing

<mark>**Extendible hashing**</mark> adds a level of indirection: a <mark>**directory**</mark> — an array of $2^d$ pointers to buckets, where $d$ is the <mark>**global depth**</mark>.

To find a record, take the first $d$ bits of $h(K)$, use them as an index into the directory, and follow the pointer to the bucket.

Two directory entries may point to the **same** bucket. Each bucket therefore records its own <mark>**local depth**</mark> $d'$, with $d' \le d$: the number of leading bits that all records in that bucket actually share. A bucket with $d' < d$ is shared by $2^{d - d'}$ directory entries.

![Extendible hashing: a directory of 2^d pointers indexed by the first d bits of the hash value, with several entries pointing to the same bucket and each bucket labelled with its local depth](/images/database/16_4-image1.png)

**Splitting a full bucket** with local depth $d'$:

1. Distribute its records into **two** buckets using bit $d' + 1$; both new buckets get local depth $d' + 1$.
2. If $d' < d$, the directory already has enough entries — just repoint the affected half at the new bucket. **The directory does not change size.**
3. If $d' = d$, there are no spare bits: **double the directory** ($d \leftarrow d + 1$), copying each old pointer into the two new entries that correspond to it, then repoint as in step 2.

Deletion works in reverse: when two **buddy** buckets (same local depth, hash values differing only in the last bit) become empty enough, they are merged and $d'$ decreases. If every bucket has $d' < d$, the directory can be **halved**.

:::tip Cost
Retrieval is **two block accesses** — one for the directory entry, one for the bucket — and often **one**, because the directory is small enough to stay in main memory. Doubling the directory is cheap since it only copies pointers, not records.
:::

:::warning The directory is the weak point
The directory must be maintained, and it doubles in size the moment a *single* bucket at maximum depth overflows. With a badly skewed key distribution the directory can grow far larger than the data warrants.
:::

### Dynamic Hashing

<mark>**Dynamic hashing**</mark> is the same splitting idea with the flat directory replaced by a <mark>**binary trie**</mark>: internal nodes have a `0` child and a `1` child, and the leaves point to buckets. Searching means walking down the tree consuming one bit of $h(K)$ per level.

Splitting a bucket simply turns its leaf into an internal node with two new leaves — a purely **local** change. There is no doubling step, so a skewed distribution grows only the branches it actually uses rather than the whole directory.

The trade-off is that traversing a tree costs more than indexing an array, and the tree itself needs pointer space and maintenance. In practice extendible and linear hashing are the ones that get implemented.

### Linear Hashing

<mark>**Linear hashing**</mark> is the most elegant of the three: it allows the file to grow and shrink **with no directory at all**.

The file starts with $M$ buckets, numbered $0 \dots M-1$, using $h_0(K) = K \bmod M$. Two extra pieces of state are kept:

- $n$ — the <mark>**split pointer**</mark>, the number of the next bucket to be split. It starts at $0$.
- a second hash function $h_1(K) = K \bmod 2M$.

The search rule is:

$$
\text{bucket} =
\begin{cases}
h_0(K), & \text{if } h_0(K) \ge n \quad(\text{not yet split})\\[4pt]
h_1(K), & \text{if } h_0(K) < n \quad(\text{already split})
\end{cases}
$$

**The counter-intuitive part:** when a bucket overflows, the bucket that gets split is **not** the one that overflowed — it is bucket $n$, whatever that happens to be. The overflowing bucket uses an overflow chain in the meantime; it will be split in its turn as $n$ sweeps past it.

Each split appends a **new bucket at the end of the file** (bucket $M + n$), redistributes the records of bucket $n$ between $n$ and $M + n$ using $h_1$, then increments $n$. When $n$ reaches $M$, a full round is complete: every bucket has been split, the file has $2M$ buckets, so $n$ resets to $0$, $M$ doubles, and the hash functions shift up one level ($h_1$ becomes the new $h_0$).

![Linear hashing: the split pointer n sweeping across the buckets, with buckets before n already split into pairs at the end of the file and an overflow chain on a bucket that has not yet been reached](/images/database/16_4-image2.png)

:::info When to trigger a split
Splitting on *any* overflow gives a load factor of roughly 60% — a lot of wasted space. Implementations instead trigger a split when the **load factor** crosses a chosen threshold, keeping $\alpha$ near 0.9 in exchange for slightly longer overflow chains.
:::

Contraction is the mirror image: when the load factor falls below a lower threshold, decrement $n$, merge bucket $M + n$ back into bucket $n$, and remove the last bucket from the file.

## Comparison and When to Use Hashing

| | Static hashing | Extendible | Dynamic | Linear |
|---|---|---|---|---|
| Directory structure | bucket-address table (fixed) | array of $2^d$ pointers | binary trie | **none** |
| Grows without full rehash | ✗ | ✓ | ✓ | ✓ |
| Splits which bucket | — | the one that overflowed | the one that overflowed | bucket $n$, in order |
| Typical retrieval cost | 1 + overflow chain | 1–2 | 1 + trie traversal | 1 + overflow chain |
| Main drawback | overflow chains grow; rehashing is offline | directory can double abruptly | tree maintenance cost | overflow chains on unsplit buckets |

:::warning What hashing cannot do
Hashing scatters records deliberately, so a good hash function destroys any relationship between key order and physical position. Consequently:

- **Range queries** (`WHERE age BETWEEN 20 AND 30`) require reading the entire file.
- **Ordered retrieval** requires a full external sort.
- Searching on **any field other than the hash field** is a linear scan, exactly as in a heap file.
- The hash field is usually forced to be a **key**; hashing on a field with few distinct values piles everything into a handful of buckets.
:::

So the choice between the organizations is really a choice about the **access pattern**:

| Dominant access pattern | Best organization |
|---|---|
| Equality lookup on one key field | **Hashing** |
| Range and ordered access | Sorted file **+ index**, or a B⁺-tree |
| Bulk load, full scans, no lookups | Heap file |

This is also why real systems rarely rely on a hash organization alone. What they do instead is keep the data in some primary organization and build **separate access structures** — indexes — over the fields that queries actually use, including **hash indexes** for equality and **B⁺-tree indexes** for ranges. That is the subject of the indexing chapter.
