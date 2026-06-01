---
outline: deep
---

## The Basics of Counting

Counting problems arise when we want to know **how many** ways something can be done, without listing every possibility. They are built on a few simple `counting principles`.

## The Product Rule

::: info Def
Suppose that a procedure can be broken down into a sequence of two tasks. If there are $n_1$ ways to do the first task and, for each of these, $n_2$ ways to do the second task, then there are
$$
n_1 \cdot n_2
$$
ways to do the procedure.
:::

The product rule applies when a task is made of **`successive`** steps, and the choices for each step do not depend on which choices were made before (only the *count* matters).

Extended to a sequence of tasks $T_1, T_2, \dots, T_m$ with $n_1, n_2, \dots, n_m$ ways respectively, the number of ways to do the procedure is:

$$
n_1 \cdot n_2 \cdots n_m
$$

- Example:
  - A license plate has $2$ letters followed by $3$ digits.
  - Letters: $26$ choices each, digits: $10$ choices each.
  - Total $= 26 \cdot 26 \cdot 10 \cdot 10 \cdot 10 = 676{,}000$.

::: tip Set form
If $A_1, A_2, \dots, A_m$ are finite sets, the number of elements in their `Cartesian product` is the product of their sizes:
$$
|A_1 \times A_2 \times \cdots \times A_m| = |A_1| \cdot |A_2| \cdots |A_m|
$$
:::

## The Sum Rule

::: info Def
If a task can be done either in one of $n_1$ ways **or** in one of $n_2$ ways, where none of the set of $n_1$ ways is the same as any of the set of $n_2$ ways, then there are
$$
n_1 + n_2
$$
ways to do the task.
:::

The sum rule applies when we choose from **`disjoint`** alternatives — exactly one of the groups is used, and the groups share no options.

Extended to tasks $T_1, T_2, \dots, T_m$ that can be done in $n_1, n_2, \dots, n_m$ ways, where no two tasks can be done at the same time, the number of ways to do one of the tasks is:

$$
n_1 + n_2 + \cdots + n_m
$$

- Example:
  - A student picks one project from $3$ math topics **or** $4$ CS topics.
  - The two lists have no topic in common.
  - Total $= 3 + 4 = 7$ choices.

::: tip Set form
If $A_1, A_2, \dots, A_m$ are **pairwise disjoint** finite sets, then:
$$
|A_1 \cup A_2 \cup \cdots \cup A_m| = |A_1| + |A_2| + \cdots + |A_m|
$$
:::

::: warning
The sum rule requires the alternatives to be `disjoint`. If the groups overlap, simply adding their sizes **double counts** the shared options — use the subtraction rule instead.
:::

## The Subtraction Rule

Also known as the **`Inclusion–Exclusion`** principle for two sets.

::: info Def
If a task can be done in either $n_1$ ways or $n_2$ ways, then the number of ways to do the task is
$$
n_1 + n_2 - n_{12}
$$
where $n_{12}$ is the number of ways to do the task that are common to the two different ways.
:::

We add the sizes of the two groups, then **subtract** the overlap once, because elements in both groups were counted twice.

::: tip Set form
For any two finite sets $A$ and $B$:
$$
|A \cup B| = |A| + |B| - |A \cap B|
$$
:::

- Example:
  - How many bit strings of length $8$ either start with a $1$ **or** end with $00$?
  - Start with $1$: $2^7 = 128$.
  - End with $00$: $2^6 = 64$.
  - Both (start with $1$ **and** end with $00$): $2^5 = 32$.
  - Total $= 128 + 64 - 32 = 160$.

## The Division Rule

::: info Def
There are $n / d$ ways to do a task if it can be done using a procedure that can be carried out in $n$ ways, and for every way $w$, exactly $d$ of the $n$ ways correspond to way $w$.
:::

The division rule applies when a straightforward count produces each outcome **`d`** times. Dividing by $d$ removes the over-counting.

::: tip Set form
If a finite set $A$ is the union of $n$ pairwise disjoint subsets each with $d$ elements, then the number of subsets is:
$$
n = \frac{|A|}{d}
$$
:::

- Example:
  - How many different ways can $4$ people be seated around a **circular** table, where two seatings are the same when each person has the same left and right neighbor?
  - In a row there are $4! = 24$ orderings.
  - Each circular arrangement corresponds to $d = 4$ rotations of the same seating.
  - Total $= \dfrac{4!}{4} = \dfrac{24}{4} = 6$.

## Intuition

| Rule | When to use | Combine by |
| --- | --- | --- |
| **Product** | A sequence of independent steps (do this **and** then this) | $\times$ |
| **Sum** | Disjoint alternatives (do this **or** this) | $+$ |
| **Subtraction** | Alternatives that **overlap** | $+$ then $-$ overlap |
| **Division** | A count where each outcome appears $d$ times | $\div\, d$ |
