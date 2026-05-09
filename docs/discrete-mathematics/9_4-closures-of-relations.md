---
outline: deep
---

## What is Closures of Relations?

- A `relation R` on a set $A$, it may or may not have some `property P` (e.g. relfexive, symmetric, antisymmetric, etc.)

::: info Definition
A `relation S`, if exists, satisfies the following conditions:

- `R` $\subseteq$ `S`
- `S` has `property P`
- `S` is `the smallest relation` containing `R` with `property P`

We call `S is closure of R`
:::

## Reﬂexive closure

::: tip
We have a `diagonal relation` $\Delta$ on a set $A$,

$$
\Delta = \{(a, a) \text{ | } a \in A\}
$$

A `reflexive relation` $S$ of relation $R$ on a set $A$,

$$
S = R \cup \Delta
$$

:::

### Example
Set $A = \{1, 2, 3\}$

The relation $R = \{(1, 1), (1, 2), (2, 1), (3, 2)\}$ on the set $A$ is `not reﬂexive`


We have a diagonal relation $\Delta$ on set $A$,

$$
\Delta = \{(2, 2), (3, 3)\}
$$

The `reflexive closure of R` is,
$$
S = R \cup \Delta = \{(1, 1), (1, 2), (2, 1), (3, 2), (2, 2), (3, 3)\}
$$

## Symmetric closure

::: tip
A `symmetric relation` $S$ of relation $R$ on a set $A$,

$$
S = R \cup R^{-1}
$$

:::

### Example
Set $A = \{1, 2, 3\}$

The relation $R = \{(1, 1), (1, 2), (2, 2), (2, 3), (3, 1), (3, 2)\}$ on the set $A$ is `not symmetric`


We have an `inverse relation` $R^{-1}$ on set $A$,

$$
R^{-1} = \{(2, 1), (1, 3)\}
$$

The `symmetric closure of R` is,
$$
S = R \cup R^{-1} = \{(1, 1), (1, 2), (2, 2), (2, 3), (3, 1), (3, 2), (2, 1), (1, 3)\}
$$

## Transitive closure

### Theorem Path và Relation Power

::: info
Given a relation R on set A

There is a path of length `n` from a to b, `iff`

$$
(a,b)\in R^n
$$
:::

- Intuition
  - $R$: đi được trong 1 bước
  - $R^2$: đi được trong 2 bước
  - $R^3$: đi được trong 3 bước
  - ...
  - $R^n$: đi được trong đúng n bước

### Connectivity relation $R^*$

::: info
- Let $R$ be a relation on a set $A$. 
- The `connectivity relation` $R^∗$ consists of the pairs (a, b) such that there is `a path of length at least one` from a to b in $R$
- In other words,

$$
R^* = R^1 \cup R^2 \cdots \cup R^{\infty} = \bigcup_{n=1}^\infty R^n
$$

- $R^*$ tells us there exists a path from a to b. (Reachable)

:::

::: tip
A `Transitive relation` $S$ of relation $R$ on a set $A$,

$$
S = R^*
$$

:::

## Efficient ways to find transitive closure
::: warning
- The $n$ in the previous section is the length of the path and leads to `infinity` ($\infty$).
:::

### Lemma 1

::: info
If there is a path from \(a\) to \(b\), then there exists a path whose length is `at most n`.

Moreover, if $a \ne b$, then there exists a path of length is ` at most n - 1`

:::

- From Lemma 1, we see that the transitive closure of R is the union of $R$, $R^2$, $R^3$, $\cdots R^n$

::: tip
`n` is the number of elements in the set $A$
:::

### Transitive closure for the zero–one matrix

::: info Theorem 3
- Let $M_R$ be the `zero–one matrix` of the relation $R$ on a set with $n$ elements. Then the zero–one matrix of the transitive closure $R^∗$ is
$$
M_R^* = M_R \cup M_R^2 \cdots M_R^n
$$
 
- Note that this is a `Boolean multiplication`
:::

### Warshall’s Algorithm

::: details
Warshall does NOT build paths by length.

Instead, it builds reachability by:

> gradually allowing more intermediate vertices.

:::


#### Interior Vertices

For a path:

$$
a, x_1, x_2, \dots, x_{m-1}, b
$$

the interior vertices are:

$$
x_1, x_2, \dots, x_{m-1}
$$

::: tip
That is: `all vertices except the first and last`
:::

#### Definition of $W_k$

Warshall constructs matrices:

$$
W_0, W_1, \dots, W_n
$$

where:

$$
W_k = [w_{ij}^{[k]}]
$$

and when:
$$
w_{ij}^{[k]} = 1
$$

iff there exists a path from:

$$
v_i \to v_j
$$

such that all interior vertices belong to:

$$
\{v_1, v_2, \dots, v_k\}
$$

::: tip Important Interpretation

At step \(k\):

> we are allowed to use only
>
> $$
> v_1,\dots,v_k
> $$
>
> as intermediate vertices.

:::

#### Lemma 2 — The Core Recurrence


$$
w_{ij}^{[k]}
=
w_{ij}^{[k-1]}
\vee
\left(
w_{ik}^{[k-1]}
\land
w_{kj}^{[k-1]}
\right)
$$


- Meaning that, a path from $v_i \to v_j$, exists at `step k` if:

##### Case 1 — Existing Path

The path already existed before:

$$
w_{ij}^{[k-1]} = 1
$$

##### Case 2 — Path Through $v_k$

There exists:

$$
v_i \to v_k
$$

and:

$$
v_k \to v_j
$$

using only:

$$
v_1,\dots,v_{k-1}
$$

as intermediate vertices.


##### Practical Implementation $O(n^3)$

```text
for k = 1 to n
    for i = 1 to n
        for j = 1 to n
            W[i][j] =
            W[i][j] OR
            (W[i][k] AND W[k][j])
```