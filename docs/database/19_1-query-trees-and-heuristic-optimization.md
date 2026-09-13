---
outline: deep
---

## Query Trees and Heuristics for Query Optimization

<mark>**Query optimization**</mark> chooses a good execution strategy from the alternatives available to the DBMS. “Optimization” does not guarantee the absolute best plan: exhaustively searching every equivalent expression and physical plan can itself take too long.

The optimizer first receives an initial internal representation from the scanner and parser. It then transforms that representation using equivalence-preserving rules and finally selects access paths and physical algorithms.

```text
SQL query
   ↓ scan, parse, validate
initial query representation
   ↓ heuristic transformations
optimized query representation
   ↓ choose access paths and algorithms
query execution plan
```

A central heuristic is to perform operations that reduce intermediate results early. `SELECT` reduces the number of tuples; `PROJECT` reduces tuple width. Applying them before a large `JOIN` or another binary operation can substantially reduce later work.

## 19.1.1 Notation for Query Trees and Query Graphs

### Query tree

A <mark>**query tree**</mark> represents an extended relational-algebra expression:

- leaf nodes are input relations;
- internal nodes are relational operations;
- the root is the final operation that produces the query result.

Execution begins at leaves whose inputs are available and proceeds upward. Therefore, a query tree represents not only the operations but also an order in which results become available.

Consider:

```sql
SELECT C.name, O.order_id
FROM Customers AS C
JOIN Orders AS O
  ON C.customer_id = O.customer_id
WHERE C.city = 'Hanoi';
```

One relational-algebra expression is:

$$
\pi_{C.name,\ O.order\_id}
\left(
\sigma_{C.city='Hanoi'}(Customers\ C)
\bowtie_{C.customer\_id=O.customer\_id}
Orders\ O
\right)
$$

Its query tree is:

```text
π C.name, O.order_id
          │
⋈ C.customer_id = O.customer_id
       ┌──┴──┐
σ C.city='Hanoi'   Orders O
       │
 Customers C
```

This tree explicitly performs the customer selection before the join.

### Query graph

A <mark>**query graph**</mark> is a more neutral representation:

- relation nodes are shown as single circles;
- constant nodes are shown as double circles or ovals;
- edges represent selection and join conditions;
- required attributes are associated with their relation nodes.

For the example above:

```text
[name, customer_id]                 [order_id, customer_id]
      Customers ── customer_id = customer_id ── Orders
          │
       city =
          │
       'Hanoi'
```

The graph shows which relations and conditions are connected, but it does not prescribe which operation runs first. A query can have many equivalent query trees but a single neutral query graph for the same relational-calculus expression.

| Representation | Expresses operation order? | Main role |
|---|---:|---|
| Query tree | Yes | Represents a relational-algebra expression and execution ordering |
| Query graph | No | Represents relations, predicates, and their connections neutrally |

## 19.1.2 Heuristic Optimization of Query Trees

A parser can create a simple <mark>**canonical query tree**</mark> by taking the Cartesian product of the `FROM` relations, applying the `WHERE` condition, and finally projecting the requested columns:

$$
\pi_L\left(\sigma_c(R\times S\times T)\right)
$$

This form is easy to generate but normally disastrous to execute directly because the Cartesian product can create an enormous intermediate relation. The optimizer transforms it into an equivalent tree that reduces tuples and columns earlier and uses direct joins.

### Typical transformation sequence

```text
canonical product tree
        ↓ split conjunctive predicates
push single-relation selections to their leaves
        ↓
run the most restrictive selections early
        ↓
replace product + join predicate with JOIN
        ↓
push projections while retaining required join fields
        ↓
group compatible operations into physical algorithms
```

Each step must preserve the query result. A transformation that merely looks faster is invalid if it changes duplicate handling, `NULL` behavior, preserved rows of an outer join, or aggregate results.

### General transformation rules

The textbook lists the following rules. Here, $c$, $c_1$, and $c_2$ are conditions; $L$ is an attribute list; and $\theta$ denotes the same binary operation throughout a formula.

#### 1. Cascade of `SELECT`

$$
\sigma_{c_1\land c_2\land\cdots\land c_n}(R)
\equiv
\sigma_{c_1}(\sigma_{c_2}(\cdots\sigma_{c_n}(R)))
$$

#### 2. Commutativity of `SELECT`

$$
\sigma_{c_1}(\sigma_{c_2}(R))
\equiv
\sigma_{c_2}(\sigma_{c_1}(R))
$$

#### 3. Cascade of `PROJECT`

If each outer projection keeps only attributes available from the inner projection, intermediate projections can be removed:

$$
\pi_{L_1}(\pi_{L_2}(\cdots\pi_{L_n}(R)))
\equiv \pi_{L_1}(R)
$$

#### 4. Commuting `SELECT` with `PROJECT`

If condition $c$ uses only attributes retained by $L$:

$$
\pi_L(\sigma_c(R)) \equiv \sigma_c(\pi_L(R))
$$

#### 5. Commutativity of `JOIN` and Cartesian product

$$
R\bowtie S \equiv S\bowtie R,
\qquad
R\times S \equiv S\times R
$$

The result may list attributes in a different order while representing the same information.

#### 6. Commuting `SELECT` with `JOIN` or product

If $c$ refers only to attributes of $R$:

$$
\sigma_c(R\bowtie S)
\equiv
(\sigma_c(R))\bowtie S
$$

If $c=c_1\land c_2$, with $c_1$ local to $R$ and $c_2$ local to $S$:

$$
\sigma_c(R\bowtie S)
\equiv
\sigma_{c_1}(R)\bowtie\sigma_{c_2}(S)
$$

The same idea applies to Cartesian product.

#### 7. Commuting `PROJECT` with `JOIN` or product

Projection can be pushed to each input, but every attribute required by the join condition and later operations must be retained. A final projection removes join-only fields that are not part of the requested output.

#### 8. Commutativity of set operations

$$
R\cup S \equiv S\cup R,
\qquad
R\cap S \equiv S\cap R
$$

Set difference is not commutative: $R-S\ne S-R$.

#### 9. Associativity of binary operations

Natural `JOIN`, Cartesian product, union, and intersection are associative under the relational semantics assumed here:

$$
(R\ \theta\ S)\ \theta\ T
\equiv
R\ \theta\ (S\ \theta\ T)
$$

#### 10. Commuting `SELECT` with set operations

For $\theta\in\{\cup,\cap,-\}$:

$$
\sigma_c(R\ \theta\ S)
\equiv
\sigma_c(R)\ \theta\ \sigma_c(S)
$$

#### 11. Commuting `PROJECT` with union

$$
\pi_L(R\cup S)
\equiv
\pi_L(R)\cup\pi_L(S)
$$

#### 12. Converting `SELECT` over product into `JOIN`

When $c$ is a join condition:

$$
\sigma_c(R\times S)
\equiv
R\bowtie_c S
$$

#### 13. Pushing `SELECT` with set difference

$$
\sigma_c(R-S)
\equiv
\sigma_c(R)-\sigma_c(S)
$$

When $c$ refers only to the left input, the textbook also gives:

$$
\sigma_c(R-S) \equiv \sigma_c(R)-S
$$

#### 14. Pushing `SELECT` to one argument of intersection

When $c$ uses attributes of $R$:

$$
\sigma_c(R\cap S)
\equiv
\sigma_c(R)\cap S
$$

#### 15. Trivial transformations

Examples include:

$$
R\cup\varnothing=R
$$

and, when $c$ is true for every tuple of $R$:

$$
\sigma_c(R)=R
$$

Boolean equivalences such as De Morgan's laws can also rewrite conditions:

$$
\neg(c_1\land c_2)\equiv\neg c_1\lor\neg c_2
$$

$$
\neg(c_1\lor c_2)\equiv\neg c_1\land\neg c_2
$$

:::warning Algebraic rules need their stated preconditions
These rules are presented for relational-algebra operations. SQL bags, three-valued `NULL` logic, outer joins, aggregation, and nondeterministic expressions can invalidate a rewrite unless additional conditions hold.
:::

### Outline of the heuristic algebraic optimization algorithm

The textbook organizes the heuristic procedure into six steps:

1. Break every conjunctive `SELECT` into a cascade of individual selections.
2. Move each selection as far down the tree as its referenced attributes permit.
3. Reorder leaf relations so the most restrictive selections run early while avoiding unnecessary Cartesian products.
4. Replace Cartesian product followed by a join condition with a direct `JOIN`.
5. Move projections downward, retaining only result attributes and fields required by later operations.
6. Identify subtrees whose operations can be executed together by one algorithm.

“Most restrictive” may mean the operation that produces the fewest tuples, the smallest result in bytes, or the smallest estimated selectivity. This is a heuristic: it usually reduces later work but does not prove global optimality.

### Heuristic summary

- Reduce rows early with `SELECT`.
- Reduce tuple width early with `PROJECT`.
- Execute restrictive selections and joins before less restrictive ones.
- Avoid materializing Cartesian products when a join condition exists.
- Preserve every attribute needed by a later predicate, join, grouping, or final result.
- Combine compatible operations when one physical algorithm can evaluate them together.

## Query Trees and Heuristics — Summary

- Query trees encode relational operations and their execution order; query graphs show relationships without choosing an order.
- A canonical tree is easy to derive from SQL but is not intended for direct execution.
- Equivalence rules allow the optimizer to produce a different tree with the same result.
- The primary heuristic is to reduce intermediate tuple counts and widths as early as possible.
- The optimized logical tree becomes executable only after the DBMS chooses access paths and physical algorithms.
