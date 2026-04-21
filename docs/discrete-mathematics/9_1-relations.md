---
outline: deep
---

## Introduction

::: details Definition
Let A and B be sets. A binary relation from A to B is a subset of $A \times B$
:::


::: info
We use the notation
$a R b$ to denote that $(a, b) \in R$ and $a \not R b$ to denote that $(a, b) \not \in R$.
Moreover, when (a, b) belongs to R, a is said to be `related to` b by R.
:::

- Relations are a `generalization` of graphs of [functions](2_3-function.md)

## Relations on a Set

::: details Definition
- A relation on a set A is a relation from A to A.
- In other words, a relation on a set A is a subset of $A \times A$.
:::


## Properties of Relations

### Reﬂexive
::: details Definition
A relation R on a set A is called `reflexive` if $(a, a) \in R$ for every element $a \in A$.
:::

::: tip Remark
Using [Quantifier](1_3-predicates-quantifier.md), we see that the relation R on the set A is reflexive if 
$$
\forall a((a, a) \in R)
$$
where the universe of discourse is the set of all elements in A.
:::

- Example:
  - Relation R on set $A = \{1, 2, 3, 4\}$
  - $R = \{(1, 1), (1, 2), (1, 4), (2, 1), (2, 2), (3, 3), (4, 1), (4, 4)\}$ is reflexive, but
  - $R = \{(1, 1), (1, 2), (1, 4)\}$ isn't relexive


### Symmetric
::: details Definition
A relation R on a set A is called `symmetric` if $(b, a) \in R$ whenever $(a, b) \in R$, for all a, $b \in A$.
:::


::: tip Remark
Using [Quantifier](1_3-predicates-quantifier.md), we see that the relation R on the set A is symmetric if
$$
\forall a \forall b((a, b) \in R \rightarrow (b, a) \in R).
$$
:::

- Example:
    - Relation R on set $A = \{1, 2\}$
    - $R = \{(1, 2), (2, 1)\}$ is symmetric,

### Antisymmetric
::: details Definition
A relation R on a set A is called `antisymmetric` if $(a, b) \in R$ and $(b, a) \in R$, then $a = b$, for all a, $b \in A$.
:::


::: tip Remark
Using [Quantifier](1_3-predicates-quantifier.md), we see that the relation R on the set A is symmetric if
$$
\forall a \forall b((a, b) \in R \wedge (b, a) \in R \rightarrow (a = b)
$$
:::

- Example:
    - Relation R on set $A = \{1, 2\}$
    - $R = \{(1, 1), (1, 2) \}$ is antisymmetric

### Transitive
::: details Definition
A relation R on a set A is called `transitive` if whenever $(a, b) \in R$ and $(b, c) \in R$, then $(a, c) \in R$, for all $a,b,c \in A$.
:::


::: tip Remark
Using [Quantifier](1_3-predicates-quantifier.md), we see that the relation R on the set A is symmetric if
$$
\forall a \forall b \forall c((a, b) \in R \wedge (b, c) \in R \rightarrow (a, c) \in R)
$$
:::

- Example:
    - Relation R on set $A = \{1, 2, 3\}$
    - $R = \{(1, 3), (3, 2), (1, 2) \}$ is transitive

## Combining Relations

::: tip
`Two relations` from A to B can be combined in any way `two sets` can be combined
:::

::: info Composite definition
- Given two relations R and S from A to B:
  - R: relation from $A \rightarrow B$
  - S: relation from $B \rightarrow C$

- Composite $S \circ R$ is relation from $A \rightarrow C$ including $(a,c)$ that there exists an element $b \in B$ such that:
$$
(a,b) \in R \text{ and }
(b,c) \in S
$$
:::

- Example:
![image.png](/images/discrete-mathematics/9_1-image.png)

## The powers of a relation R 
::: info
Let R be a relation on the set A. The powers $R^n$, n = 1, 2, 3, ..., are [recursively deﬁned](5_2-recursion.md#recursively-defined-functions) by

`BASIS STEP`:
$$
R^1 = R
$$

`RECURSIVE STEP`:
$$
R^{n+1} = R^n \circ R
$$
:::

### Theorem 1
::: info
The relation R on a set A is `transitive` if and only if $R^n \subseteq R$ for n = 1, 2, 3, ...
:::

## Inverse relation of R 
::: info
Let $R^{-1}$ be a reverse of relation $R$:

$$
R^{-1} = \{(b, a) | (a,b) \in R\}
$$
:::

## Complementary relation of R 

::: info
Let $\overline{R}$ be a reverse of relation $R$:

$$
\overline{R} = \{(a, b) | (a, b) \notin R\}
$$
:::
