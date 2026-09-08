---
outline: deep
---

## Translating SQL Queries into Relational Algebra and Other Operators

A declarative SQL query states <mark>**what**</mark> result is required, not how the DBMS should retrieve it. Before execution, the DBMS must turn that statement into a sequence of physical operations over files, indexes, buffers, and intermediate results.

This distinction creates two levels:

- a <mark>**logical query**</mark>, expressed using relational operations such as selection, projection, and join;
- a <mark>**physical execution plan**</mark>, which chooses concrete algorithms and access paths for those operations.

Many physical plans can implement the same logical query. Their results are equivalent, but their I/O costs can differ by orders of magnitude.

## Main Query-Processing Stages

A typical high-level query passes through the following stages:

```text
SQL query
   ↓
scan, parse, and validate
   ↓
logical representation
   ↓
query optimization
   ↓
physical execution plan
   ↓
code generation / interpretation
   ↓
runtime database processor
   ↓
result
```

### Scanning and parsing

The scanner recognizes lexical units such as keywords, identifiers, operators, and literals. The parser then checks whether those units form a legal SQL statement according to the grammar.

For example:

```sql
SELECT order_id, total_amount
FROM Orders
WHERE customer_id = 42;
```

The parser identifies a query block containing:

- a projection list: `order_id`, `total_amount`;
- an input relation: `Orders`;
- a selection condition: `customer_id = 42`.

A malformed statement can be rejected at this stage before any table is accessed.

### Validation

Syntactic correctness is not enough. The DBMS also checks the query against the catalog:

- Do the referenced relations and attributes exist?
- Are ambiguous attribute names qualified?
- Are expressions type-compatible?
- Are aggregate and grouping rules satisfied?
- Does the user have the required privileges?

Validation binds each name to a catalog object and derives the type of each expression and result column.

### Logical translation

The validated query is translated into an internal representation, commonly a relational-algebra expression or a query tree. At this level the query describes operators and dependencies without committing to a file scan, an index, or a particular join algorithm.

### Optimization

The <mark>**query optimizer**</mark> considers equivalent logical forms and alternative physical implementations. It may decide:

- which selection to perform first;
- which access path to use for a relation;
- in what order to join relations;
- which join or sorting algorithm to use;
- whether to materialize an intermediate result or pipeline tuples directly.

The selected plan is expected to be efficient according to the available statistics and cost model. Searching every possible plan is usually too expensive, so “optimization” normally means finding a good plan, not proving that the absolute best plan was found.

### Code generation and runtime execution

The chosen plan is converted into executable operators. A plan may be interpreted immediately, compiled and stored for reuse, or represented as an iterator tree whose operators request tuples from their children.

At runtime, the database processor coordinates buffer pages, file and index access, expression evaluation, and construction of the final result.

:::info Logical operator versus physical algorithm
`σ customer_id = 42` is a logical selection. A full scan, a B⁺-tree lookup, and a hash lookup are different physical algorithms that can implement it.
:::

## Translating a SELECT-FROM-WHERE Block

Consider a basic SQL query with no grouping or nesting:

```sql
SELECT O.order_id, O.total_amount
FROM Orders AS O
JOIN Customers AS C
  ON O.customer_id = C.customer_id
WHERE C.city = 'Hanoi'
  AND O.total_amount >= 1000000;
```

Its main SQL clauses map naturally to relational operations:

| SQL construct | Relational operation |
|---|---|
| `FROM` with several relations | Cartesian product or join inputs |
| `WHERE` predicate | Selection $\sigma$ |
| join condition | Join $\bowtie$ or selection over a product |
| `SELECT` column list | Projection $\pi$ |
| `SELECT DISTINCT` | Projection plus duplicate elimination |

A direct relational-algebra translation is:

$$
\pi_{O.order\_id,\ O.total\_amount}
\left(
\sigma_{
C.city='Hanoi'\ \land\
O.total\_amount \ge 1000000\ \land\
O.customer\_id=C.customer\_id
}
(Orders\ O \times Customers\ C)
\right)
$$

The equivalent join form is clearer:

$$
\pi_{O.order\_id,\ O.total\_amount}
\left(
\sigma_{O.total\_amount \ge 1000000}(Orders\ O)
\bowtie_{O.customer\_id=C.customer\_id}
\sigma_{C.city='Hanoi'}(Customers\ C)
\right)
$$

The second expression exposes useful work early: filter each input before joining. It is logically equivalent to the first expression but can create much smaller intermediate results.

### Query-tree representation

An operator tree places base relations at the leaves and the final result at the root:

```text
π order_id, total_amount
           │
⋈ O.customer_id = C.customer_id
      ┌────┴────┐
σ total_amount  σ city = 'Hanoi'
   >= 1000000       │
      │          Customers
    Orders
```

Data conceptually flows upward. A physical plan annotates each node with an implementation, for example:

- B⁺-tree range scan for the `total_amount` selection;
- file scan for `city = 'Hanoi'`;
- hash join for the equality join;
- streaming projection at the root.

## Query Blocks and Nested Queries

Each `SELECT-FROM-WHERE` expression, together with its `GROUP BY` and `HAVING` clauses when present, forms a <mark>**query block**</mark>. A nested query introduces another block that can initially be translated separately.

```sql
SELECT order_id, total_amount
FROM Orders
WHERE total_amount > (
  SELECT MAX(total_amount)
  FROM Orders
  WHERE status = 'pending'
);
```

The inner block is uncorrelated and returns one value. It can be translated independently:

$$
c \leftarrow \mathcal{G}_{MAX(total\_amount)}
(\sigma_{status='pending'}(Orders))
$$

The outer block then uses that result as the constant $c$:

$$
\pi_{order\_id,\ total\_amount}
(\sigma_{total\_amount>c}(Orders))
$$

Because the inner block does not refer to the outer query, it needs to be evaluated only once. A correlated subquery is more complicated because its inner block refers to an outer tuple variable; DBMSs use unnesting and other optimization techniques to avoid naïvely rerunning it for every outer tuple.

:::warning SQL is not set algebra by default
Relational algebra is traditionally set-based, while SQL normally preserves duplicates. A translation must account for SQL's bag semantics and introduce duplicate elimination only when required by `DISTINCT`, set operators, or another semantic rule.
:::

## Additional Operators: Semi-Join and Anti-Join

Some nested subqueries are unnested into join variants that are not among the basic relational-algebra operations.

### Semijoin

A <mark>**semijoin**</mark> is commonly used when unnesting `EXISTS`, `IN`, or `ANY`. It returns a left-side record as soon as one right-side match is found; it does not search for every possible match or append right-side attributes.

```sql
SELECT COUNT(*)
FROM Customers AS C
WHERE C.customer_id IN (
  SELECT O.customer_id
  FROM Orders AS O
  WHERE O.total_amount > 1000000
);
```

Conceptually, the query uses:

$$
Customers \ltimes
\pi_{customer\_id}
(\sigma_{total\_amount>1000000}(Orders))
$$

Even if one customer has many qualifying orders, that customer contributes only one left-side record to the semijoin result.

### Antijoin

An <mark>**antijoin**</mark> is used when unnesting forms such as `NOT EXISTS`, `NOT IN`, or `ALL`. A left-side record is rejected as soon as a right-side match is found and returned only if no match exists.

```sql
SELECT COUNT(*)
FROM Customers AS C
WHERE NOT EXISTS (
  SELECT 1
  FROM Orders AS O
  WHERE O.customer_id = C.customer_id
);
```

Conceptually:

$$
Customers \triangleright Orders
$$

:::warning `NOT IN` and `NULL`
SQL's three-valued logic makes `NOT IN` behave differently when its subquery can return `NULL`. The antijoin transformation must preserve the original query's `NULL` semantics; `NOT EXISTS` avoids that particular trap.
:::

## Supplemental SQL Operators

SQL also requires operations that are not fully represented by the basic selection, projection, product, union, difference, and rename operators.

### Duplicate elimination

`SELECT DISTINCT` removes duplicate result tuples:

```sql
SELECT DISTINCT status
FROM Orders;
```

The physical operator can sort the values and collapse adjacent duplicates, or hash values and retain one copy of each distinct key.

### Sorting

`ORDER BY` imposes an order on the final result:

```sql
SELECT order_id, total_amount
FROM Orders
ORDER BY total_amount DESC;
```

Sorting is not part of the unordered relational model. It requires an explicit physical operation unless an access path already supplies the requested order. If the data is larger than memory, the DBMS needs an external sorting algorithm.

### Grouping and aggregation

```sql
SELECT customer_id,
       COUNT(*) AS order_count,
       SUM(total_amount) AS total_spent
FROM Orders
GROUP BY customer_id;
```

This introduces a grouping/aggregation operator often written conceptually as:

$$
{}_{customer\_id}\mathcal{G}_{COUNT(*),\ SUM(total\_amount)}(Orders)
$$

It partitions tuples by `customer_id` and computes aggregate state for each group. Sorting and hashing are common implementations.

### Outer join

An inner join discards tuples with no match. A left, right, or full outer join preserves specified unmatched tuples and fills the missing side with `NULL` values.

```sql
SELECT C.customer_id, O.order_id
FROM Customers AS C
LEFT JOIN Orders AS O
  ON C.customer_id = O.customer_id;
```

The execution algorithm must therefore track which tuples matched; a plain inner-join implementation is not sufficient.

## From Logical Expression to Execution Plan

Translation alone does not determine the execution strategy. For every logical operator, the DBMS still needs choices such as:

| Logical task | Possible physical implementations |
|---|---|
| Selection | linear scan, binary search, primary/secondary index, hash access |
| Sorting | in-memory sort, external merge sort, ordered index scan |
| Join | nested-loop, index nested-loop, sort-merge, partitioned hash join |
| Duplicate elimination | sort then collapse, hash into distinct groups |
| Grouping | sort-based aggregation, hash-based aggregation |

The optimizer combines these choices into an <mark>**execution plan**</mark>. Its decisions depend on relation size, available memory, indexes, ordering, estimated selectivity, and the cost of producing intermediate results.

:::danger A plan is valid only if it preserves query semantics
Reordering inner joins and pushing ordinary selections downward are often safe. Transformations involving outer joins, `NULL`, duplicate-sensitive operators, aggregation, or nondeterministic expressions require additional conditions.
:::

## Translation Checklist

When reading a SQL query, identify:

1. The query blocks and any correlations between them.
2. The base relations named by `FROM`.
3. Selection predicates local to one relation.
4. Join predicates connecting relations.
5. Projected attributes and expressions.
6. Duplicate semantics: ordinary SQL bag or `DISTINCT` set behavior.
7. Requested ordering.
8. Grouping, aggregates, and `HAVING` predicates.
9. Outer-join, existence, or nonexistence requirements.

## Query Translation — Summary

- SQL specifies a result; the DBMS chooses the physical procedure.
- Parsing checks grammar, while validation resolves names, types, privileges, and schema rules.
- A query block contains one `SELECT-FROM-WHERE` expression plus any associated `GROUP BY` and `HAVING` clauses, and can be translated into an extended relational-algebra expression or query tree.
- Semijoins and antijoins support unnesting of existence and nonexistence subqueries without producing all inner-join matches.
- Logical equivalences expose alternatives, such as applying selective predicates before a join.
- SQL additionally needs duplicate elimination, ordering, grouping, aggregation, and outer-join behavior.
- The optimizer maps logical operators to physical algorithms and produces an executable plan.
