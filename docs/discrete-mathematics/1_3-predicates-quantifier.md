---
outline: deep
---
## Predicates (vị từ)

- **Predicate (vị từ)** là một biểu thức logic **chứa biến**, nói về tính chất (property) của biến đó
- Gán biểu thức predicate cho $P(x)$, chưa rõ giá trị đúng/sai **cho đến khi** gán giá trị cụ thể cho biến đó.
- $P(x)$ is called **propositional function**

## **Quantifier (lượng từ)**

### Universal quantifier ($\forall$)

- Universal quantification of a $P(x)$ is

$P(x)$ for all values of x **in a domain**


- Notation $\forall x P(x)$ :
    - For every $x P(x)$
    - For all $x P(x)$
    - For each, for any, for arbitrary, …

### Existential quantifier ($\exists$)

- Existential quantification of a $P(x)$ is

There exists an element x **in a domain** such that $P(x)$

- Notation $\exists x P(x)$ :
    - There is an x such that $P(x)$
    - There is at least one x ….
    - For some $x P(x)$

### The uniqueness quantifier (Skipped)

![image.png](/images/discrete-mathematics/1_3-image.png)

## Precedence of Quantifier

- The quantifiers ∀ and ∃ have higher precedence than all logical operators from [**propositional calculus**](1_1-propositional-logic)

## Quantifier with restricted domain

- The restriction of universal quantification $(\forall)$ is the same as the universal quantification of a conditional statement
    - $\forall x < 0 (x^2 > 0) \Leftrightarrow \forall x (x < 0 \rightarrow x^2 > 0)$
- The restriction of existential quantification is the same as the existential quantification of a conjunction $(\wedge)$
    - $\exists x>0(x^2=0) \Leftrightarrow \exists x(x>0 \wedge x^2=0)$

## Logical Equivalences Involving Quantifiers

- Statements involving **predicates** and **quantifiers** are **logically equivalent,**  if and only if they have the **same true value, no matter:**
    - which predicates are substituted into
    - which domain of discourse is used?
- $S \equiv T$
- Example:
    - $\forall x(P(x) \wedge Q(x)) \equiv \forall xP(x) \wedge \forall xQ(x))$

## Negating Quantified Expressions

![image.png](/images/discrete-mathematics/1_3-image1.png)

## Nested Quantifiers

- $\forall x \forall y(x + y = y + x)$ : for all real numbers x and y, x + y = y + x
- $∀x∀y((x > 0) ∧ (y < 0) → (xy < 0))$
  : For all real numbers x and y, if x is positive and y is negative, then the product of x and y is negative

::: info
Think of nested quantifiers like a 2 NESTED LOOP IN PROGRAMMING
:::

## The Order of Quantifiers

![image.png](/images/discrete-mathematics/1_3-image2.png)

## Negating nested quantifier

- Apply De Morgan’s Laws for negating, just apply from **left → right** in propositions


## Quantifiers: at least, at most, exactly

### Setup
Let P(x) be a predicate over a domain.

---

### 1. At least n

#### Meaning
There are **at least n distinct elements** satisfying P.

#### Form (example n = 2)

$$
∃x ∃y (x ≠ y ∧ P(x) ∧ P(y))
$$

#### General pattern
- Use n existential quantifiers (∃)
- Add pairwise distinct conditions (≠)

---

### 2. At most n

#### Meaning
There are **no more than n elements** satisfying P.

#### Form (example n = 1)

$$
∀x ∀y ((P(x) ∧ P(y)) → x = y)
$$

#### Form (example n = 2)

$$
∀x ∀y ∀z ((P(x) ∧ P(y) ∧ P(z)) → (x = y ∨ x = z ∨ y = z))
$$

#### General pattern
- Use universal quantifiers (∀)
- If n+1 elements satisfy P → at least two must be equal

---

### 3. Exactly n

#### Meaning
There are **exactly n elements** satisfying P.

#### Form
:::tip
(at least n) $∧$ (at most n)
:::

---

### Example: Exactly 2

$$
∃x ∃y (x ≠ y ∧ P(x) ∧ P(y))
$$
$$
∧
$$
$$
∀x ∀y ∀z ((P(x) ∧ P(y) ∧ P(z)) → (x = y ∨ x = z ∨ y = z))
$$

---

### Special case: Exactly 1 (unique existence)

$$
∃x (P(x) ∧ ∀y (P(y) → y = x))
$$

---

### Quick cheat sheet


- at least n -> $∃ n$ distinct elements
- at most n -> not exist $n+1$ distinct elements
- exactly n -> (≥ n) $∧$ (≤ n)