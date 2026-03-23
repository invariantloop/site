---
outline: deep
---

## Principle
- To prove that $P(n)$ is true for all positive integers n, where $P(n)$ is a propositional function, 
we complete two steps
::: info 
`BASIS STEP`: We verify that $P(1)$ is true.

`INDUCTIVE STEP`: We show that the conditional statement $P(k) → P(k + 1)$ is true for all
  positive integers k.
:::

- Expressed as a rule of inference, this proof technique can be stated as
::: tip
$$
  (P(1) ∧ \forall k(P(k) \rightarrow P(k + 1))) → \forall nP(n)
$$
:::
 
## Why Mathematical Induction is Valid (TBD)

## Template for Proofs by Mathematical Induction
::: tip Template
1. Express the statement that is to be proved in:
   - The form $\forall n ≥ b, P(n)$ for `a ﬁxed integer b`. 
   - The form $P(n) \text{ for all positive integers n}$, let `b = 1`, 
   - The form $P(n) \text{ for all nonnegative integers n}$, let `b = 0`. 
   - For some statements of the form $P(n)\text{, such as inequalities}$, 
     you may need to determine the appropriate value of `b` by checking the truth values of $P(n)$ for small values of $n$
2. Write out the words `Basis Step` Then show that $P(b)$ is true, taking care that the correct value of b is used. `This completes the ﬁrst part of the proof`.
3. Write out the words `Inductive Step` and state, and clearly identify, the inductive hypothesis, 
   in the form `Assume that P(k) is true for an arbitrary ﬁxed integer k ≥ b`.
4. State what needs to be proved under the assumption that the inductive hypothesis is true.
   That is, write out what $P(k + 1)$ says.
5. Prove the statement $P(k + 1)$ making use of the assumption $P(k)$. 
   (Generally, `this is the most difficult part of a mathematical induction proof`. Decide on the most promising
   proof strategy and look ahead to see how to use the induction hypothesis to build your
   proof of the inductive step. Also, be sure that your proof is valid for all integers $k$ with
   $k ≥ b$, taking care that the proof works for small values of $k$, including $k = b$.)
6. Clearly identify the conclusion of the inductive step, such as by saying `This completes the inductive step.`
7. After completing the basis step and the inductive step, state the conclusion, namely, 
   `By mathematical induction, P(n) is true for all integers n with n ≥ b`
:::