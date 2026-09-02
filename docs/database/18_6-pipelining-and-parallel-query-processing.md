---
outline: deep
---

## Combining Operations Using Pipelining

A physical query plan is a tree of operators. A straightforward implementation finishes one operator, writes its complete output to a temporary file, and then lets the parent operator read that file.

This approach is called <mark>**materialized evaluation**</mark>:

```text
operator A
    ↓ produce all records
temporary file
    ↓ read all records
operator B
```

Materialization gives the parent a stable, rewindable input, but writing and rereading every intermediate result adds I/O, storage, and latency.

<mark>**Pipelining**</mark>, or stream-based processing, passes records directly from one operator to the next:

```text
operator A → one record → operator B → one record → operator C
```

Several operators can therefore participate in one execution chain without creating a complete temporary file between every pair.

## Materialization versus Pipelining

Consider:

```sql
SELECT C.name, O.order_id
FROM Customers AS C
JOIN Orders AS O
  ON C.customer_id = O.customer_id
WHERE C.city = 'Hanoi'
  AND O.status = 'paid';
```

A materialized plan might create four temporary results:

```text
Customers → select city     → temp_customer
Orders    → select paid     → temp_order
temp_customer ⋈ temp_order  → temp_join
temp_join → project columns → result
```

A pipelined plan can combine the work:

```text
Customers scan → city filter ┐
                              ├→ join → projection → result
Orders scan    → paid filter ┘
```

Each scan returns only qualifying records to the join, and each joined record is immediately narrowed by the projection.

### Benefits

Pipelining can:

- avoid writing and rereading intermediate files;
- reduce temporary storage;
- return the first result before every input record has been processed;
- keep several operators active as records flow through the plan;
- combine selection and projection work with a join or scan.

### Limits

Pipelining is not always possible. Some operators must consume substantial or complete input before producing correct output. Other plans require an intermediate result to be reread, shared by multiple consumers, or spilled because it exceeds memory.

:::info Pipelining changes data movement, not query meaning
A materialized and a pipelined plan must produce the same result. The difference is whether an intermediate relation is stored completely or consumed incrementally.
:::

## Pipelineable and Blocking Operators

A <mark>**pipelineable operator**</mark> can normally produce output incrementally. A <mark>**blocking operator**</mark> must consume its input—or a major partition of it—before it can return output.

| Operator | Typical behavior | Reason |
|---|---|---|
| Selection | Pipelineable | Test and pass one record at a time |
| Ordinary projection | Pipelineable | Remove/evaluate fields per record |
| `UNION ALL` | Pipelineable | Concatenate inputs without deduplication |
| Index nested-loop join | Pipelineable | Probe inner access path for each outer record |
| Block nested-loop join | Partially pipelineable | Emits while processing resident outer chunks |
| Hash join | Blocks on build input | Build hash table before probing |
| Sort-merge join | Pipelineable after ordering | Sorting inputs may block first |
| External sort | Blocking | Final order is unknown until sorting/merging |
| `DISTINCT` | Usually blocking | Must know whether equal values occur elsewhere |
| Hash aggregation | Usually blocking | Group state is final only after input ends |
| Ordered aggregation | Group-blocking | Emits when the current ordered group ends |
| Global `SUM`/`COUNT` | Blocking for final result | Final value requires the complete input |

Some operators are only partially blocking. A partitioned hash operator can finish and emit one partition before all other partitions finish; ordered grouping can emit completed groups while later keys are still arriving.

:::warning First-row latency and total runtime are different
Pipelining often improves time to first row and removes temporary I/O. It does not guarantee the smallest total runtime if a materialized result enables reuse, better locality, or a cheaper downstream algorithm.
:::

## Iterators for Physical Operators

Many DBMS execution engines expose each physical operator through an <mark>**iterator**</mark> interface:

```text
Open()
Get_Next()
Close()
```

- `Open()` initializes state and opens child iterators.
- `Get_Next()` returns the next result record or an end-of-stream marker.
- `Close()` releases buffers, files, and child resources.

The parent repeatedly pulls records from its child:

```text
parent.Get_Next()
       ↓
child.Get_Next()
       ↓
grandchild.Get_Next()
       ↓
base-table access
```

Many iterators can be active at the same time, each preserving enough state to resume at its next record.

## Selection Iterator

A selection iterator repeatedly asks its child for records until one satisfies the predicate:

```text
Open():
    child.Open()

Get_Next():
    loop:
        t = child.Get_Next()
        if t is END:
            return END
        if predicate(t):
            return t

Close():
    child.Close()
```

One call may inspect several child records, but it returns at most one qualifying result. No complete selection result is stored.

## Projection Iterator

An ordinary projection iterator transforms exactly one child record per successful call:

```text
Open():
    child.Open()

Get_Next():
    t = child.Get_Next()
    if t is END:
        return END
    return evaluate_projected_fields(t)

Close():
    child.Close()
```

`PROJECT DISTINCT` cannot use this simple form unless the child already supplies a compatible order or uniqueness guarantee. Otherwise, a sort or hash duplicate-elimination operator becomes a pipeline breaker.

## Index Nested-Loop Iterator

An index nested-loop join can preserve its current outer record and inner index position across calls:

```text
Open():
    outer.Open()
    current_outer = NONE
    current_matches = EMPTY

Get_Next():
    loop:
        if current_matches has another record:
            return combine(current_outer, next_match)

        current_outer = outer.Get_Next()
        if current_outer is END:
            return END

        current_matches = inner_index.lookup(current_outer.join_key)

Close():
    outer.Close()
    close inner index resources
```

The parent receives joined records incrementally. Duplicate inner matches are returned across successive calls before the iterator advances to the next outer record.

## Iterator Tree Example

The earlier SQL query can be implemented as:

```text
Project(name, order_id)
          │ Get_Next
IndexNestedLoopJoin(customer_id)
      ┌───────────────┐
Select(city='Hanoi')  │
      │               │
CustomersScan     Orders(customer_id) index lookup
                         + status='paid' filter
```

A top-level request unfolds as follows:

1. `Project.Get_Next()` asks the join for one record.
2. The join asks the selection for a customer.
3. The selection pulls customer records until one is from Hanoi.
4. The join probes the order index for that customer.
5. The join returns one combined record.
6. Projection removes unneeded fields and returns the result.
7. The next request resumes the saved join and scan positions.

This pull model naturally implements demand-driven execution. If the consumer stops after ten records, upstream operators may avoid producing the rest.

## Access Methods as Iterators

The iterator abstraction can extend down to physical access methods:

- a table-scan iterator returns the next visible record;
- a B⁺-tree range iterator walks the next qualifying leaf entry;
- a hash access iterator walks records in a target bucket;
- an external-sort iterator manages runs and returns sorted records after its blocking setup;
- a partition iterator returns records from one temporary partition.

This gives the execution engine a common interface even though the underlying access patterns differ.

## Pipeline Breakers and Materialization Points

Materialization remains necessary or useful when:

- an operator must sort or globally deduplicate its input;
- a hash table or aggregate state does not fit in memory;
- an input must be rescanned or rewound;
- multiple parent operators reuse the same intermediate result;
- one producer is much faster than its consumer and buffering is required;
- an execution stage needs repartitioned data before later work can begin.

A plan can mix both techniques:

```text
scan → select → project
          ↓ pipeline
external sort
          ↓ materialized runs / blocking merge
ordered aggregate → having → result
          ↓ pipeline by completed group
```

The goal is not to eliminate every temporary result. It is to avoid unnecessary materialization while retaining the physical properties required by later operators.

## Pipelining Checklist

For each edge in an execution plan, ask:

1. Can the producer return records incrementally?
2. Can the consumer process one record or one small batch at a time?
3. Does the consumer require complete order, uniqueness, or aggregate state?
4. Must the intermediate input be rewound or consumed more than once?
5. Does the intermediate result fit in memory if buffering is required?
6. Can selection and projection be fused into a scan or join?
7. Is low time-to-first-row important?
8. Would materialization provide a useful order or reusable result?

## Pipelining — Summary

- Materialized evaluation stores complete intermediate results; pipelining passes records directly between operators.
- Pipelining reduces temporary I/O and can produce initial results earlier.
- Selection and ordinary projection naturally pipeline; sorting, duplicate elimination, and final aggregation commonly block.
- Physical iterators expose `Open()`, `Get_Next()`, and `Close()` and preserve state between calls.
- Access methods and joins can use the same iterator interface.
- Real plans combine pipelines with deliberate materialization points.

## Parallel Algorithms for Query Processing

Parallel query processing uses multiple processors, memory regions, and storage devices to perform database work concurrently. Parallelism can reduce the response time of one large query, increase total system throughput, or allow a larger database and workload to maintain similar performance.

Its effectiveness depends on architecture, data placement, partition balance, communication, synchronization, and the parallel form of each physical operator.

## Parallel Database Architectures

Three common architectures differ in which resources are shared.

### Shared-memory architecture

Multiple processors share a main-memory region and storage system:

```text
CPU  CPU  CPU
 \    |    /
  shared memory
       │
  shared storage
```

Processors can communicate through shared memory. The system must coordinate access to common buffers and data structures, and memory or storage bandwidth can become a contention point.

### Shared-disk architecture

Each processor has private memory, but all processors can access the same disks:

```text
CPU+memory  CPU+memory  CPU+memory
      \         |         /
             shared disks
```

Data is accessible from every processor without assigning each disk partition permanently to one node. Buffer caches are separate, so cache coherence is required when one processor updates a page that another processor may have cached.

### Shared-nothing architecture

Each processor or node owns private memory and private disk storage:

```text
[CPU + memory + disk] ⇄ [CPU + memory + disk] ⇄ ...
```

Nodes communicate by sending data or control messages. Data must be partitioned across nodes, but independent local resources reduce centralized contention. The book identifies this as the architecture most commonly used for parallel database systems.

| Architecture | Memory | Disk | Main coordination issue |
|---|---|---|---|
| Shared memory | Shared | Shared | Contention for common resources |
| Shared disk | Private | Shared | Cache coherence and shared storage access |
| Shared nothing | Private | Private | Partitioning and network redistribution |

## Speed-Up and Scale-Up

<mark>**Speed-up**</mark> measures how much faster the same task runs with more resources. If $T_1$ is execution time with one processor and $T_p$ with $p$ processors:

$$
Speedup(p)=\frac{T_1}{T_p}
$$

Ideal linear speed-up is:

$$
Speedup(p)=p
$$

so doubling processors and disks halves response time.

<mark>**Scale-up**</mark> asks whether a proportionally larger system can process a proportionally larger workload in roughly the same time:

$$
Scaleup(p)=
\frac{T(\text{small workload},1)}
{T(p\times\text{workload},p)}
$$

Ideal linear scale-up is close to one: multiply data/work by $p$, multiply resources by $p$, and keep elapsed time approximately constant.

### Why scaling is not perfectly linear

Practical losses come from:

- startup and scheduling overhead;
- communication and data redistribution;
- synchronization barriers;
- shared-resource contention;
- serial portions of the plan;
- uneven partition sizes or join-key skew;
- one slow worker delaying the entire stage.

:::warning The slowest partition sets the stage time
If one worker receives far more data than others, most workers can finish early and remain idle while the overloaded worker completes. More processors do not fix a poor partitioning function by themselves.
:::

## Horizontal Data Partitioning

Parallel operators divide a relation horizontally so different processors handle different records.

### Round-robin partitioning

Records are assigned cyclically:

```text
r1 → P0, r2 → P1, r3 → P2, r4 → P0, ...
```

Round robin tends to balance record counts and is useful for full scans. It does not place a particular key value at a predictable processor.

### Range partitioning

Each processor owns a key interval:

```text
P0: key < 1000
P1: 1000 ≤ key < 2000
P2: key ≥ 2000
```

Range partitioning supports range pruning and global ordering by partition range, but skewed key distributions can create unbalanced partitions.

### Hash partitioning

The owner is computed from a partitioning hash function:

$$
owner(t)=h(t.A)\bmod p
$$

Hash partitioning supports equality lookup, grouping, equality joins, and set operations because equal keys are sent to the same processor. It does not preserve range order and can still skew when a few key values are extremely frequent.

## Parallelism at the Operator Level

<mark>**Operator-level parallelism**</mark> executes one relational operator over multiple data partitions. Each worker performs a local version of the operation, followed by any required merge, redistribution, or reduction.

## Parallel Sorting

If data is range-partitioned on the sort attribute using correct nonoverlapping boundaries:

1. Each processor sorts its local partition independently.
2. The sorted partitions are concatenated in range order.

```text
P0 sorts [lowest range]  ┐
P1 sorts [middle range]  ├→ concatenate → global order
P2 sorts [highest range] ┘
```

If the original partitions do not correspond to global ranges, the system can sample or choose splitters, redistribute records into ranges, sort locally, and then concatenate. Alternatively, locally sorted streams need a global multiway merge.

Parallel sort performance depends on balanced ranges and sufficient local memory. Duplicate or highly concentrated keys require careful boundary handling.

## Parallel Selection

For a full scan, each processor applies the predicate to its local partition:

$$
\sigma_C(R)
= \bigcup_i \sigma_C(R_i)
$$

No communication is needed until local results are combined or consumed downstream.

Partitioning can eliminate unnecessary work:

- equality on a range or hash partitioning key can target the owning partition;
- a range predicate can scan only overlapping range partitions;
- a predicate unrelated to partitioning normally scans every partition.

## Parallel Projection and Duplicate Elimination

Projection without duplicate elimination is local and embarrassingly parallel:

$$
\pi^{bag}_A(R)
= \biguplus_i \pi^{bag}_A(R_i)
$$

where $\biguplus$ represents bag concatenation.

`PROJECT DISTINCT` needs a global uniqueness step. Each processor may first eliminate local duplicates, but the same projected value can still occur on different processors. A correct plan then:

1. locally projects and optionally deduplicates;
2. redistributes records by a hash or range function on all projected attributes;
3. deduplicates again within each destination partition.

Equal projected tuples now meet at the same worker.

## Parallel Equality Join

For:

$$
R \bowtie_{R.A=S.B} S
$$

hash-partition both inputs with compatible functions:

$$
R_i=\{r\mid h(r.A)=i\},
\qquad
S_i=\{s\mid h(s.B)=i\}
$$

Then:

$$
R\bowtie S
=\bigcup_i(R_i\bowtie S_i)
$$

Every matching pair reaches the same worker, and all local joins run concurrently. Each worker can use an in-memory hash join, nested-loop join, or sort-merge join for its partition pair.

If one input is already partitioned on the join key, only the other may need redistribution. If both inputs are already compatibly partitioned, the join can be local with no data shuffle.

### Broadcasting a small input

When one relation is very small, the system can copy it to every processor holding partitions of the large relation:

```text
small Customers → copy to P0, P1, P2, ...
large Orders    → remain partitioned
```

Each processor joins its local large partition with the copied small input. Broadcasting avoids repartitioning the large relation but sends multiple copies of the small one.

### Inequality joins

A condition such as $R.A<S.B$ does not have the same co-partitioning property as equality. Matching values can belong to different partitions. A parallel algorithm may use ordered range partitions and replicate records to every partition where they can match.

Replication increases communication and makes range balance important.

## Parallel Aggregation

For `GROUP BY G`, hash- or range-partition on the grouping attributes so all records of one group reach the same processor:

$$
owner(t)=h(t.G)\bmod p
$$

Each processor computes its groups locally. A two-stage plan can reduce communication:

1. Compute partial aggregates in the original partitions.
2. Redistribute compact partial states by grouping key.
3. Combine partial states at destination processors.

For decomposable aggregates:

$$
SUM = \sum_i SUM_i
$$

$$
COUNT = \sum_i COUNT_i
$$

and:

$$
AVG = \frac{\sum_i SUM_i}{\sum_i COUNT_i}
$$

`MIN` is the minimum of local minima, and `MAX` is the maximum of local maxima. Sending partial states can be far cheaper than moving every input record.

For a global aggregate with no grouping attributes, local partial states are reduced to one final result.

## Parallel Set Operations

For `UNION`, `INTERSECTION`, or `SET DIFFERENCE`, partition both union-compatible inputs using the same hash function on the complete tuple:

$$
R_i=\{r\mid h(r)=i\},
\qquad
S_i=\{s\mid h(s)=i\}
$$

Each processor independently computes:

$$
R_i\cup S_i,
\qquad
R_i\cap S_i,
\qquad
R_i-S_i
$$

and the local results are combined. Hashing the complete tuple ensures identical tuples reach the same processor, which is necessary for global duplicate semantics.

## Intraquery Parallelism

<mark>**Intraquery parallelism**</mark> uses multiple processors for one query. It has two complementary forms.

### Parallel algorithms within operators

One operator is divided across multiple processors, as with parallel scan, sort, hash join, or aggregation. This is also called data or intraoperator parallelism.

```text
one hash join
  ├→ worker 0 joins R0 with S0
  ├→ worker 1 joins R1 with S1
  └→ worker 2 joins R2 with S2
```

### Parallel independent plan branches

Operators with no dependency can run simultaneously. In a join tree, the two input branches can perform their scans, selections, projections, or sorting in parallel before the join needs both results.

```text
scan/filter Customers ─┐
                        ├→ join
scan/filter Orders    ─┘
```

### Pipelined parallelism

When a producer returns records incrementally, producer and consumer operators can execute concurrently:

```text
parallel scan → filter → repartition → parallel join → aggregate
```

Different stages work on different records at the same time. A blocking operator prevents downstream work until its required input phase is complete.

:::info Pipeline and parallelism are different dimensions
An iterator pipeline can execute on one processor. A parallel sort can use many processors but remain blocking. Pipelined parallelism combines concurrency between dependent stages with incremental data flow.
:::

## Interquery Parallelism

<mark>**Interquery parallelism**</mark> executes multiple independent queries or transactions at the same time:

```text
query A → processors/resources
query B → processors/resources
query C → processors/resources
```

Its main goal is throughput and scale-up rather than reducing the latency of one query.

Concurrent queries require coordination for:

- locks and transaction isolation;
- logging and recovery;
- simultaneous conflicting updates;
- buffer and cache coherence;
- CPU, memory, disk, and network scheduling.

Shared-memory systems can reuse concurrency mechanisms similar to those of a multiuser DBMS on one machine. Shared-disk and shared-nothing systems require coordination across separate memories or nodes.

Too much interquery concurrency can reduce performance when queries compete for buffers, temporary space, storage bandwidth, or network capacity. A scheduler may limit per-query parallelism so one large query does not monopolize the whole system.

## Worked Parallel Pipeline

Consider:

```sql
SELECT C.city,
       SUM(O.total_amount) AS revenue
FROM Customers AS C
JOIN Orders AS O
  ON C.customer_id = O.customer_id
WHERE O.status = 'paid'
GROUP BY C.city;
```

Assume `Orders` and `Customers` are distributed across four workers.

### Stage 1 — Local scan and selection

Every worker scans its local `Orders` partition and keeps paid orders:

$$
O_i'=\sigma_{status='paid'}(O_i)
$$

Selection pipelines directly from each scan.

### Stage 2 — Co-partition for the join

If the two relations are not already compatible, redistribute both on `customer_id`:

$$
owner=h(customer\_id)\bmod 4
$$

Each worker receives corresponding customer and order partitions.

### Stage 3 — Parallel local joins

Workers independently compute:

$$
C_i\bowtie O_i'
$$

A local hash join may block while building its `Customers` hash table, then pipeline joined records during probing.

### Stage 4 — Partial aggregation

Each worker computes local `(city, sum)` states from joined records:

```text
Hanoi → local sum
Da Nang → local sum
...
```

### Stage 5 — Repartition and finalize

Redistribute partial states by `city`. The worker owning each city adds the partial sums:

$$
SUM(city)=\sum_i SUM_i(city)
$$

The plan combines:

- operator-level parallel scans, joins, and aggregates;
- pipelineable selection and probe output;
- blocking build and repartition boundaries;
- intraquery parallelism across four workers.

## Parallel-Plan Checklist

When parallelizing an execution plan, ask:

1. Is the architecture shared-memory, shared-disk, or shared-nothing?
2. How is each base relation currently partitioned?
3. Can partition pruning eliminate workers or partitions?
4. Which operators can execute locally without redistribution?
5. What key should range- or hash-partition each intermediate result?
6. Is one join input small enough to broadcast?
7. Can local aggregation reduce data before a shuffle?
8. Are keys or partition ranges skewed?
9. Which operators block pipelines or require synchronization barriers?
10. Is the goal lower single-query latency, greater throughput, or scale-up?
11. Will communication, contention, or cache coordination exceed the parallel benefit?

## Parallel Query Processing — Summary

- Shared-memory, shared-disk, and shared-nothing architectures share different resources and require different coordination.
- Speed-up reduces time for the same work; scale-up maintains performance as workload and resources grow together.
- Round-robin balances records, range partitioning preserves key intervals, and hash partitioning colocates equal keys.
- Selection, projection, sorting, joins, aggregation, and set operations each have partitioned parallel forms.
- Global duplicate elimination and grouping require equal keys or tuples to meet at the same worker.
- Intraquery parallelism accelerates one query through parallel operators, independent branches, and pipelines.
- Interquery parallelism runs multiple queries concurrently to improve throughput.
- Communication, synchronization, contention, blocking stages, and data skew prevent ideal linear scaling.
