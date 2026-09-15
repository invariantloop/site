---
outline: deep
---

## Choice of Query Execution Plans

A <mark>**query execution plan**</mark> turns a relational-algebra query tree into an executable strategy. Besides the logical operations, the plan specifies access methods, physical algorithms, and how intermediate results move between operators.

## 19.2.1 Alternatives for Query Evaluation

Consider the query tree for retrieving the name and address of employees who work for the Research department:

$$
\pi_{Fname,Lname,Address}
\left(
\sigma_{Dname='Research'}(DEPARTMENT)
\bowtie_{Dnumber=Dno}
EMPLOYEE
\right)
$$

```text
π Fname, Lname, Address
           │
     ⋈ Dnumber = Dno
        ┌──┴──┐
σ Dname='Research'   EMPLOYEE
        │
   DEPARTMENT
```

An execution plan for this tree can choose:

- an index search for the selection on `DEPARTMENT`, if a suitable index exists;
- an index-based nested-loop join using the selected departments as the outer input and an index on `EMPLOYEE.Dno`;
- a scan of the join result to compute the projection.

The plan also chooses between <mark>**materialized evaluation**</mark> and <mark>**pipelined evaluation**</mark>.

| Evaluation | Handling of an intermediate result | Main consequence |
|---|---|---|
| Materialized | Store the complete result as a temporary relation | The next operator must read it back |
| Pipelined | Forward produced tuples directly to the next operator through a buffer | Avoids writing and rereading the complete intermediate result |

For the example, a materialized plan stores the complete join result before projection. A pipelined plan lets the join consume selected `DEPARTMENT` tuples and sends each resulting joined tuple directly to the projection. Pipelining is generally preferred when it is feasible because it saves intermediate disk I/O.

The optimizer can improve a query by applying transformations heuristically or by comparing their estimated costs. It must also handle SQL queries containing multiple <mark>**query blocks**</mark>:

- a nested query in `WHERE` may be correlated with its outer query;
- a subquery in `FROM` defines a derived relation, similar to a view.

The following sections describe transformations for these two cases.

## 19.2.2 Nested Subquery Optimization

An uncorrelated scalar subquery can be evaluated first. For example:

```sql
SELECT E1.Fname, E1.Lname
FROM EMPLOYEE AS E1
WHERE E1.Salary = (
  SELECT MAX(E2.Salary)
  FROM EMPLOYEE AS E2
);
```

The inner query produces one maximum salary $M$; the outer block then evaluates `Salary = M`. If an index on `Salary` exists, it can help obtain the maximum and locate matching employees. Without an index, both steps may require linear scans.

In a <mark>**correlated subquery**</mark>, the inner block refers to a value supplied by the outer block. A naïve plan executes the inner query once for every outer tuple:

```sql
SELECT E.Fname, E.Lname, E.Salary
FROM EMPLOYEE AS E
WHERE EXISTS (
  SELECT *
  FROM DEPARTMENT AS D
  WHERE D.Dnumber = E.Dno
    AND D.Zipcode = 30332
);
```

Where possible, the optimizer removes the nested block and rewrites the query as a join:

```sql
SELECT E.Fname, E.Lname, E.Salary
FROM EMPLOYEE AS E
JOIN DEPARTMENT AS D
  ON D.Dnumber = E.Dno
WHERE D.Zipcode = 30332;
```

This process is called <mark>**unnesting**</mark> or <mark>**decorrelation**</mark>. Here an inner join preserves the result because `Dnumber` is unique, so each employee can match at most one department tuple.

The replacement operator depends on the semantics of the nested query. An ordinary inner join is not always valid. Consider:

```sql
SELECT COUNT(*)
FROM DEPARTMENT AS D
WHERE D.Dnumber IN (
  SELECT E.Dno
  FROM EMPLOYEE AS E
  WHERE E.Salary > 200000
);
```

The nested query acts as a filter: one department contributes at most once even if several employees match. Rewriting it as an inner join could duplicate a department and change `COUNT(*)`. A <mark>**semijoin**</mark> preserves the filter behavior:

$$
DEPARTMENT\ltimes_{Dnumber=Dno}
\sigma_{Salary>200000}(EMPLOYEE)
$$

In general:

- nested queries connected by `IN` or `ANY` can be unnested into one query block, often using a semijoin;
- a unique matching inner tuple may permit an ordinary inner join;
- `NOT IN`-style filtering may be expressed using an antijoin, subject to SQL `NULL` semantics;
- another option is to materialize the subquery result temporarily and use it in a join.

Unnesting complex correlated subqueries can require more involved transformations, but it is a widely used optimization technique.

## 19.2.3 Subquery (View) Merging Transformation

A subquery in the `FROM` clause is an <mark>**inline view**</mark>. A previously defined view can play the same role. <mark>**View merging**</mark>, also called <mark>**subquery merging**</mark>, replaces the view reference with its defining query and combines it with the outer query block.

Suppose the database contains:

```text
EMP  (Ssn, Fn, Ln, Dno)
DEPT (Dno, Dname, Dmgrname, Bldg_id)
BLDG (Bldg_id, No_storeys, Addr, Phone)
```

The following query uses an inline view `V`:

```sql
SELECT E.Ln, V.Addr, V.Phone
FROM EMP AS E,
     (
       SELECT D.Dno, D.Dname, B.Addr, B.Phone
       FROM DEPT AS D, BLDG AS B
       WHERE D.Bldg_id = B.Bldg_id
     ) AS V
WHERE V.Dno = E.Dno
  AND E.Fn = 'John';
```

One plan materializes `V` and then joins it with `EMP`. This restricts the optimizer to ordering `E` and `V` at the outer level and `D` and `B` inside the view. It also prevents an index-based join on `V.Dno` when the temporary view has no such index.

Merging produces a single query block:

```sql
SELECT E.Ln, B.Addr, B.Phone
FROM EMP AS E, DEPT AS D, BLDG AS B
WHERE D.Bldg_id = B.Bldg_id
  AND D.Dno = E.Dno
  AND E.Fn = 'John';
```

The merged form exposes all three relations to the optimizer, expands the possible join orders, and makes indexes such as those on `DEPT.Dno` and `BLDG.Bldg_id` available to index-based nested-loop joins.

Views containing only select-project-join operations are <mark>**simple views**</mark> and can generally be merged. Merging may be invalid or require special handling when the view contains `DISTINCT`, outer joins, aggregation, `GROUP BY`, or set operations.

### GROUP-BY View-Merging

For a view containing `GROUP BY`, neither always merging nor always materializing is best:

- delaying grouping until after selective joins may reduce the data to be grouped;
- grouping early may shrink the data supplied to later joins.

The optimizer therefore estimates plans both with and without merging.

The textbook illustrates a view that aggregates sales by customer and product:

```sql
CREATE VIEW CP_BOUGHT_VIEW AS
SELECT SUM(S.Qty_sold) AS Bought,
       S.Custid,
       S.Productid
FROM SALES AS S
GROUP BY S.Custid, S.Productid;
```

A query asks for French customers who bought more than 50 units of product `Ring_234`. Without merging, the DBMS may group the entire `SALES` table and materialize the view before applying the selective customer and product conditions.

After merging, the joins and filters can be evaluated before grouping:

```sql
SELECT C.Custid, C.Custname, C.Cemail
FROM CUST AS C, PRODUCT AS P, SALES AS S
WHERE P.Productid = S.Productid
  AND C.Custid = S.Custid
  AND P.Pname = 'Ring_234'
  AND C.Country = 'France'
GROUP BY P.Productid, P.rowid,
         C.rowid, C.Custid, C.Custname, C.Cemail
HAVING SUM(S.Qty_sold) > 50;
```

The selective joins can greatly reduce the `SALES` tuples that reach `GROUP BY`. The row identifiers preserve equivalence with the grouping behavior of the original query. Whether this transformation is cheaper still depends on estimated costs.

## 19.2.4 Materialized Views

A view is stored in the database as a query definition. A <mark>**materialized view**</mark> additionally stores the query result. Reading a stored result may be much cheaper than recomputing joins or aggregations, especially when many queries reuse it.

A materialized view may be temporary or permanent. Permanent materialized views are common in data warehouses. Because their contents are derived from base relations, changes to those relations can make the stored result stale.

The textbook identifies three refresh strategies:

| Strategy | When the materialized view is updated |
|---|---|
| Immediate update | As soon as a participating base relation changes |
| Lazy update | Only when the view is requested |
| Periodic or deferred update | Later, often on a regular schedule |

Immediate refresh keeps the view current but adds update overhead. Recomputing the whole view after every base-table change is usually too expensive, so DBMSs commonly use incremental maintenance.

### Incremental View Maintenance

<mark>**Incremental view maintenance**</mark> derives the change to a materialized view from inserted or deleted base tuples instead of recomputing the whole view. A modification can be treated as deletion of the old tuple followed by insertion of the new tuple.

Let $v_{old}$ be the stored instance of view $V$, and let $r$ and $s$ be the instances of relations $R$ and $S$.

**Join.** If $V=R\bowtie S$ and $r_i$ is inserted into $R$:

$$
v_{new}=v_{old}\cup(r_i\bowtie s)
$$

If $r_d$ is deleted from $R$:

$$
v_{new}=v_{old}-(r_d\bowtie s)
$$

The corresponding rules apply symmetrically when $S$ changes.

**Selection.** If $V=\sigma_C(R)$:

$$
v_{new}=v_{old}\cup\sigma_C(r_i)
$$

for insertions, and

$$
v_{new}=v_{old}-\sigma_C(r_d)
$$

for deletions.

**Projection.** Duplicate elimination means a projected view tuple may be supported by several base tuples. The DBMS maintains a count for each distinct projected tuple:

- insertion increments the count or creates the tuple with count 1;
- deletion decrements the count;
- the view tuple is removed only when its count reaches zero.

The same counts can represent multiplicities when the view uses multiset projection without `DISTINCT`.

**Intersection.** If $V=R\cap S$, an inserted tuple from $R$ is added to the view only if it is present in $S$. A deleted tuple from $R$ is removed if it is present in the view.

**Aggregation with `GROUP BY`.** For a view grouping on $G$ and aggregating attribute $A$:

| Aggregate | Incremental state and action |
|---|---|
| `COUNT` | Maintain a count per group; create the group on its first insertion and remove it when the count reaches zero |
| `SUM` | Maintain both sum and count; add or subtract the changed value and update the count |
| `AVG` | Maintain `SUM` and `COUNT`, then compute `SUM / COUNT` |
| `MAX` / `MIN` | Maintain the extreme value and a count; deleting the tuple that supplied the extreme may require recomputing it for that group |

Materialized views can also rewrite other queries. If a stored view matches a subexpression such as $R\bowtie S$ or $\pi_L(R)$, the optimizer can substitute the view and avoid repeating that computation. Conversely, it may expand a materialized view back into its defining query when useful indexes exist on the component relations but not on the stored view.
