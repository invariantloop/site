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

<aside>
💡

$P(x)$ for all values of x **in a domain**

</aside>

- Notation $\forall x P(x)$ :
    - For every $x P(x)$
    - For all $x P(x)$
    - For each, for any, for arbitrary, …

### Existential quantifier ($\exists$)

- Existential quantification of a $P(x)$ is

<aside>
💡

There exists an element x **in a domain** such that $P(x)$

</aside>

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

<aside>
💡

Think of nested quantifiers like a 2 NESTED LOOP IN PROGRAMMING

</aside>

## The Order of Quantifiers

![image.png](/images/discrete-mathematics/1_3-image2.png)

## Negating nested quantifier

- Apply De Morgan’s Laws for negating, just apply from **left → right** in propositions