---
outline: deep
---


## Recursively Defined Functions
- We use two steps to define a function with the set of nonnegative integers as its domain:
::: info
`BASIS STEP`: Specify the value of the function at zero.

`RECURSIVE STEP`: Give a rule for finding its value at an integer from its values at smaller integers.
:::

- Note that,
 
::: info
Recursive function on integers = sequence defined by recurrence
:::

- Example, $f$ is defined recursively by
    - `BASIS STEP` $f(0) = 3$
    - `RECURSIVE STEP` $f(n + 1) = 2f(n) + 3$

## Recursively Deﬁned Sets and Structures
- Recursive definitions play an important role in the study of strings
- Example, consider the subset $S$ of the set of integers recursively defined by
  - `BASIS STEP` $3 \in S$
  - `RECURSIVE STEP` If $x \in S$ and $y \in S$, then $x + y \in S$

### Recursive Definition of Strings
::: info
Let $\Sigma$ be an alphabet. The set $\Sigma^*$ of all strings over $\Sigma$ is defined recursively as follows:

`BASIS STEP`: $\lambda \in \Sigma^*$ (where $\lambda$ is the empty string.)

`RECURSIVE STEP`: $\text{If } w \in \Sigma^* \text{ and } x \in \Sigma, \text{ then } wx \in \Sigma^*$
:::

### Recursive Definition of Concatenation

Let $\Sigma$ be an alphabet and $\Sigma^*$ the set of all strings over $\Sigma$.  
The concatenation of two strings is denoted by $\cdot$ and defined recursively as follows:

::: info
`BASIS STEP`:
$$
\text{If } w \in \Sigma^*, \text{ then } w \cdot \lambda = w,
$$
where $\lambda$ is the empty string.

`RECURSIVE STEP`:

$$
\text{If } w_1 \in \Sigma^*,\ w_2 \in \Sigma^*,\ \text{and } x \in \Sigma,
\text{ then }
w_1 \cdot (w_2 x) = (w_1 \cdot w_2)x.
$$
:::

#### Intuition

- Nối chuỗi với chuỗi rỗng $\lambda$ không làm thay đổi chuỗi
- Để nối $w_1$ với $w_2x$:
    - trước tiên nối $w_1$ với $w_2$
    - sau đó thêm ký tự $x$ vào cuối

### Recursive Definition of Rooted Trees

- A rooted tree is defined recursively as follows:
::: info

`BASIS STEP`:
$$
\text{A single vertex } r \text{ is a rooted tree.}
$$

`RECURSIVE STEP`:
Suppose that $T_1, T_2, \dots, T_n$ are disjoint rooted trees with roots
$r_1, r_2, \dots, r_n$, respectively.

Form a new graph by:
- introducing a new vertex $r$ (not in any $T_i$), and
- adding edges from $r$ to each $r_i$ for $i = 1, \dots, n$

Then this graph is also a rooted tree.
:::

#### Exclusion Rule
No graph is a rooted tree unless it can be formed using the basis step and recursive step.

### Recursive Definition of Extended binary trees
::: info
`BASIS STEP`:
$$
\varnothing \text{ is an extended binary tree.}
$$

`RECURSIVE STEP`:
$$
\text{If } T_1 \text{ and } T_2 \text{ are disjoint extended binary trees, then } T_1 \cdot T_2
$$

$$
\text{is an extended binary tree formed by introducing a root } r \text{ and connecting it}
$$

$$
\text{to the roots of } T_1 \text{ (left subtree) and } T_2 \text{ (right subtree), when these are nonempty.}
$$
:::


### Recursive Definition of Full Binary Trees

::: info
`BASIS STEP`:
$$
\text{There is a full binary tree consisting of a single vertex } r.
$$

`RECURSIVE STEP`:
$$
\text{If } T_1 \text{ and } T_2 \text{ are disjoint full binary trees, then } T_1 \cdot T_2
$$

$$
\text{is a full binary tree formed by introducing a root } r \text{ and connecting it}
$$

$$
\text{to the roots of } T_1 \text{ (left subtree) and } T_2 \text{ (right subtree).}
$$
:::

## Structural Induction
- Structural induction can be used to prove that all members of a set constructed recursively have a particular property.

### Example on Well-Formed Formulae

#### Goal
Prove that every well-formed formula (WFF) has an equal number of left and right parentheses.

---

#### Basis Step
- T, F, and propositional variables (s) contain no parentheses
- ⇒ number of left = number of right = 0 ✔️

---

#### Recursive Step

**Induction hypothesis:**
- p and q are WFF
- p has equal left/right parentheses
- q has equal left/right parentheses

---

**Check new constructions:**

1. **(¬p)**
- left: lp + 1
- right: rp + 1
- ⇒ still equal ✔️

2. **(p ∨ q), (p ∧ q), (p → q), (p ↔ q)**
- left: lp + lq + 1
- right: rp + rq + 1
- since lp = rp and lq = rq
- ⇒ still equal ✔️

---

#### Conclusion
- Property holds for basis
- Preserved under recursive construction  
  ⇒ True for all WFF (by structural induction)