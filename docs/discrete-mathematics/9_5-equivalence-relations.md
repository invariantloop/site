---
outline: deep
---

## Equivalent Relations

::: info Def
A relation on a set `A` is called an equivalence relation if it is `reflexive`, `symmetric`, and `transitive`.
:::


- Two elements $a$ and $b$ that are related by an equivalence relation are called `equivalent`. 
- The notation $a \sim b$ is often used to denote that $a$ and $b$ are equivalent elements with respect to a particular equivalence relation.


## Equivalence Classes
Let $R$ be an equivalence relation on a set $A$.

::: info
The **`equivalence class`** of an element $a \in A$ is the set of all elements in $A$ that are related to $a$.
:::

The equivalence class of $a$ is denoted by:

$$
[a]_R
$$

If only one equivalence relation is being discussed, we usually write:

$$
[a]
$$

instead of $[a]_R$.

### Definition

The equivalence class of $a$ is:

$$
[a]_R = \{\, s \mid (a,s) \in R \,\}
$$

or equivalently:

$$
[a]_R = \{\, s \in A \mid aRs \,\}
$$

### Representative

If:

$$
b \in [a]_R
$$

then $b$ is called a **`representative`** of the equivalence class.

::: tip
Any element in the class can serve as a representative.
:::

::: tip
There is nothing special about the chosen representative.
:::


## Equivalence Classes and Partitions

Let $R$ be an equivalence relation on a set $A$.

These statements for elements $a$ and $b$ of $A$ are `equivalent`

$$
(i) \text{ } aRb
$$

$$
(ii) \text{ } [a] = [b]
$$

$$
(iii) \text{ } [a] \cap [b] \neq \emptyset
$$

::: info
$$
(i) \equiv (ii) \equiv (iii)
$$
:::


### Partitions

Let $R$ be an `equivalence relation` on a set $A$. The **union** of `equivalence classes` of $R$ is all of $A$.

$$
\bigcup_{a \in A} [a]_R = A
$$

In other words, A partition of a set $S$ is a collection of subsets:

$$
A_i,\quad i \in I
$$

such that:

:::info Nonempty
Each subset is nonempty:

$$
A_i \ne \emptyset
$$

for all $i \in I$.
:::

::: info Pairwise Disjoint
Different subsets do not overlap:

$$
A_i \cap A_j = \emptyset
$$

whenever $i \ne j$.
:::


::: info Cover the Entire Set

The union of all subsets equals the whole set:

$$
\bigcup_{i \in I} A_i = S
$$

:::


![image.png](/images/discrete-mathematics/9_5-image.png)


## Equivalence Partitions and Relations

::: info Theorem 2

- Let $R$ be an `equivalence relation` on a set $S$. Then the `equivalence classes` of $R$ form a `partition` of $S$. 

- Conversely, given a partition $\{A_i ∣ i \in I\}$ of the set $S$, there is an `equivalence relation` $R$
that has the sets $A_i$, $i \in I$, as its `equivalence classes`.

:::

## Intuition