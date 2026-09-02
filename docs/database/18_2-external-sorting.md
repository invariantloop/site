---
outline: deep
---

## Algorithms for External Sorting

Sorting supports `ORDER BY`, duplicate elimination, grouping, set operations, index creation, and sort-merge join. If the input fits in memory, an internal sorting algorithm is sufficient. Database relations often exceed available memory, so the DBMS must sort while moving data between memory and secondary storage.

An <mark>**external sorting algorithm**</mark> is designed for this situation. Its dominant cost is normally block I/O rather than CPU comparisons.

## Notation and Constraints

Let:

- $b$ be the number of blocks in the input file;
- $n_B$ be the number of memory buffer blocks available to the sort;
- $n_R$ be the number of initial sorted runs;
- $d_M$ be the merge degree, the number of runs merged at once.

When $b > n_B$, the entire file cannot be sorted in one memory load. The algorithm therefore creates smaller sorted files and repeatedly merges them.

:::tip Sorted run
A <mark>**run**</mark> is a sequence of blocks whose records are already sorted on the requested sort key. Each initial run fits in memory when it is created, but the final run may be as large as the whole input file.
:::

## External Sort-Merge Algorithm

External sort-merge has two major phases:

1. <mark>**Run generation**</mark>: read memory-sized portions, sort them internally, and write sorted runs.
2. <mark>**Multiway merge**</mark>: merge several runs per pass until only one sorted run remains.

### Phase 1 — Run generation

Repeat until the entire input has been consumed:

1. Read up to $n_B$ input blocks into memory.
2. Sort their records using an internal sorting algorithm.
3. Write the sorted records as one run on disk.

The number of initial runs is:

$$
n_R = \left\lceil \frac{b}{n_B} \right\rceil
$$

If the final chunk contains fewer than $n_B$ blocks, its run is simply shorter than the others.

```text
Unsorted file
┌────┬────┬────┬────┬────┬────┬────┬────┐
│    memory-sized chunks, each sorted     │
└────┴────┴────┴────┴────┴────┴────┴────┘
                  ↓
run 1       run 2       run 3       ...
[sorted]    [sorted]    [sorted]
```

Every block is read once and written once during run generation, so this phase costs approximately:

$$
2b \text{ block transfers}
$$

### Phase 2 — Multiway merging

During merging, one buffer is reserved for output. The remaining $n_B - 1$ buffers can each supply input from a different run. Therefore:

$$
d_M = \min(n_B - 1,\ n_R)
$$

For a $d_M$-way merge:

1. Load the first block of each input run into its input buffer.
2. Compare the smallest unconsumed record from every input buffer.
3. Move the smallest record to the output buffer.
4. Refill an input buffer when its block is exhausted.
5. Write the output buffer when it becomes full.
6. Continue until every input run has been consumed.

One merge produces a larger sorted run because the next output record is always the smallest remaining record among all participating runs.

After one full merge pass, the number of runs falls from $n_R$ to approximately:

$$
\left\lceil \frac{n_R}{n_B - 1} \right\rceil
$$

The merge passes continue until this number becomes one.

## Number of Passes and I/O Cost

Assuming a merge fan-in of $n_B - 1$, the number of merge passes is:

$$
p = \left\lceil
\log_{n_B-1}
\left(\left\lceil \frac{b}{n_B} \right\rceil\right)
\right\rceil
$$

Each complete pass reads all $b$ blocks and writes all $b$ blocks. Including run generation, the approximate total is:

$$
\operatorname{Cost}_{sort}
= 2b(1+p)
$$

This formula counts writing the final sorted file. If the next operator consumes the final merge output directly, the last write—and possibly a later read—can be avoided through pipelining.

:::warning Count block I/O, not just comparisons
An $O(n\log n)$ CPU comparison count does not describe an external sort well. The important questions are how many full passes over the file are required and how many blocks each pass reads and writes.
:::

## Worked Example

Suppose an `Orders` file occupies:

$$
b = 1{,}000 \text{ blocks}
$$

and the sorting operator receives:

$$
n_B = 11 \text{ buffer blocks}
$$

### Generate initial runs

Each memory load sorts at most 11 blocks:

$$
n_R = \left\lceil \frac{1{,}000}{11} \right\rceil = 91
$$

Run generation reads and writes the file once:

$$
2b = 2{,}000 \text{ block transfers}
$$

### Merge the runs

One output buffer leaves ten input buffers, so the maximum merge degree is:

$$
d_M = n_B - 1 = 10
$$

The runs shrink as follows:

```text
91 initial runs
   ↓ first merge pass, 10-way
10 runs
   ↓ second merge pass, 10-way
1 final sorted run
```

Thus:

$$
p = \left\lceil \log_{10}(91) \right\rceil = 2
$$

and the total cost is approximately:

$$
2(1{,}000)(1+2) = 6{,}000 \text{ block transfers}
$$

The same 1,000-block file is processed three times: once to create runs and twice to merge them.

## Why More Memory Helps Discontinuously

Adding buffer blocks helps in two ways:

- initial runs become longer, reducing $n_R$;
- the merge fan-in $n_B-1$ becomes larger.

The benefit is stepwise rather than perfectly smooth. Enough extra memory to eliminate an entire merge pass saves approximately one full read and one full write of the file:

$$
2b \text{ block transfers}
$$

For a one-pass merge after run generation, all initial runs must be merged at once:

$$
\left\lceil \frac{b}{n_B} \right\rceil \le n_B - 1
$$

Ignoring rounding, this condition is roughly $b \le n_B(n_B-1)$. A file much larger than memory can still be sorted with only one merge pass because the buffers are reused while the runs stream through them.

## Buffering Details

### Input and output buffers

The simplest multiway merge assigns one block to each input run and one block to output. This arrangement maximizes fan-in, but single-block buffers can lead to frequent I/O requests.

A system may instead allocate several blocks per run and several blocks to output. Larger sequential I/O requests can improve transfer efficiency, although fewer input runs can then participate in each merge.

### Double buffering

With <mark>**double buffering**</mark>, one buffer is processed while another buffer for the same stream is being filled or written. This overlaps CPU work with I/O:

```text
CPU consumes buffer A  ←→  storage fills buffer B
CPU consumes buffer B  ←→  storage fills buffer A
```

Double buffering can reduce waiting time, but it consumes more memory and can reduce the merge degree if the total memory budget is fixed.

### Blocking and record boundaries

The sort operates on records but performs I/O in blocks. Variable-length records and records spanning blocks require the storage layer to preserve record boundaries while input buffers are refilled and output blocks are formed.

## Sorting Records versus Sorting Pointers

A DBMS does not always need to copy complete records during sorting. It can sort smaller entries of the form:

$$
\langle sort\ key,\ record\ pointer \rangle
$$

This creates more entries per block and can reduce the number of blocks participating in the sort. The final operator follows the pointers to retrieve records when needed.

The trade-off is locality. If sorted pointers refer to records scattered across the data file, retrieving the full records may cause many random block accesses. Sorting complete records performs more work during sorting but produces the final records in sequential order.

## Exploiting Existing Order

An explicit external sort may be unnecessary when:

- the file is physically ordered on a compatible key;
- a B⁺-tree index can be scanned in the required order;
- an earlier operator already produces the requested order;
- only small groups need additional sorting because the input has a useful prefix order.

However, scanning a secondary index does not guarantee cheap record retrieval. The index entries are ordered, but their referenced data records may be distributed across many blocks.

:::info Interesting order
An intermediate order can be valuable even when the current operator does not require it. The optimizer may preserve an order because a later merge join, grouping, duplicate elimination, or `ORDER BY` can reuse it.
:::

## Where External Sorting Is Used

### `ORDER BY`

The final tuples are sorted by the requested expressions unless an earlier access path already supplies that order.

### Duplicate elimination

After sorting on all projected attributes, equal tuples become adjacent and all but one can be discarded during the merge.

### Grouping and aggregation

Sorting on grouping attributes places each group together. Aggregate state can be finalized when the group key changes.

### Sort-merge join

Both join inputs are sorted on their join attributes. A merge scan then advances through the ordered inputs to find matching groups.

### Index construction

Bulk loading a B⁺-tree starts by sorting index entries on the search key, then packs leaf pages and builds upper levels.

## External Sorting — Summary

- External sorting is required when the input does not fit in the available buffers.
- Run generation creates $\lceil b/n_B \rceil$ sorted runs and costs about $2b$ block transfers.
- A multiway merge normally uses $n_B-1$ input buffers and one output buffer.
- Each merge pass reads and writes the entire file; eliminating one pass saves about $2b$ transfers.
- More memory increases both initial run length and merge fan-in.
- Buffering, pointer sorting, existing order, and pipelining can materially change the real cost.
