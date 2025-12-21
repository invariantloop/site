---
outline: deep
---
## Terminology

### Theorem (Định lí)

- A statement that can be shown to be true
- Maybe the universal quantification of a conditional statement with one or more premises and a conclusion

### Propositions (Mệnh đề logic / Định đề)

- A theorem but less important

### Proof (Chứng minh)

- Is a valid argument that establishes the truth of a theorem

### Axioms (**Tiên đề**)

- statements we assume to be true (need not proof)
- Using primitive terms that do not require definition

### Lemma (Bổ đề)

- Use to prove a complicated theorem
- Complicated proofs are usually easier to understand when they are proved using a series of lemmas

### Corollary (Hệ quả)

- A theorem that can be established directly from a theorem that has been proved

### Conjecture (Phỏng đoán)

- A statement that is being proposed to be a true statement
- When a proof of a conjecture is
  found, the conjecture becomes a theorem

## Methods of Proving Theorems

<aside>
✅

Use axioms, definitions, previously proved results, and rules of inference to complete the proof

</aside>

<aside>
✅

To prove a theorem of the form **$\forall x(P(x) \rightarrow Q(x))$,** should apply [**universal generalization**](1_4-rule-of-inference)

</aside>

- That means, we need to prove $P(c) \rightarrow Q(c)$, for arbitrary c. In this case, we prove a conditional statement is true
- Recall, $p \rightarrow q$ is true unless p is true but q is false

<aside>
✅

For $p \rightarrow q$ is true, we only need to prove **q is true if p is true**

</aside>

## Direct Proofs

- Lead from the premises of a theorem to the conclusion

<aside>
✅

We assume **directly** $p = true$, then $q$ must also be true

</aside>

## Proof by contraposition  (Phản đảo)

- We will see that attempts at direct proofs often reach **dead ends**
- An extremely useful type of indirect proof is known as proof by contraposition

<aside>
✅

Make use of the fact that the conditional statement $p \rightarrow q$ is equivalent to its contrapositive, $¬q → ¬p$

</aside>

### Vacuous proofs (Chứng minh rỗng)

- We can quickly prove that a conditional statement $p → q$ is true **when we know that p is false**

### Trivial proofs (Chứng minh tầm thường)

- We can quickly prove that a conditional statement $p → q$ is true **when we know that q is true**

## Proof by contradiction  (Phản chứng)

- (1) Assume $¬p$ is true
- (2) Then prove that $\neg p \rightarrow q \space is \space true$
- (3) $q$ must be false, such as $q = r \wedge \neg r$
- Because q is false (3) and (2) true, then $\neg p$ must be false
- p is true

## Proofs of equivalence

<aside>
✅

Prove $(p ↔ q) ↔ (p → q) ∧ (q → p)$

</aside>

## Proof by cases

- We now introduce a method that can be used to prove a theorem by considering different cases
  separately, that means:

<aside>
✅

$(p_1 \vee p_2 \vee ... \vee p_n) \rightarrow q$

</aside>

- Then, make it tautology:

<aside>
✅

$(p_1 \vee p_2 \vee ... \vee p_n) \rightarrow q \space \leftrightarrow	 [(p_1 \rightarrow q) \wedge (p_2 \rightarrow q) ... \wedge ... (p_n \rightarrow q)]$

</aside>

- A proof by cases **must cover all possible cases that arise in a theorem**. We illustrate proof by cases with a couple of examples. In each example, you should check that all possible cases are covered

### Exhaustive proof

- Special case of proof by cases
- Some theorems can be proved by examining a relatively small number of examples
- With the finite examples such as $n \space is \space a \space integer \space n < 4$

## Without loss of generality

- Is used in mathematical proofs to handle **symmetric or similar cases** efficiently. It means that **proving one representative case is enough**, and the other cases follow by symmetry or similar reasoning.
- **When to use:**
    - The remaining cases are **logically equivalent** or **structurally symmetric**.
    - For example, swapping variables like `x` and `y` doesn’t change the logic of the proof.
- **Why it helps:**

  It **shortens proofs** by avoiding repetitive arguments.

- **Warning:**

  Using WLOG incorrectly (when other cases are not truly equivalent) can lead to **incomplete or incorrect proofs**.


## COMMON ERRORS WITH EXHAUSTIVE PROOF AND PROOF BY CASES

- A common error of reasoning is to draw incorrect conclusions **from examples**. No matter how many separate examples are considered, a theorem is not proved by considering examples **unless every possible case is covered.**

## Existence Proof

<aside>
✅

To prove a theorem of the form **$\exists xP(x)$**

</aside>

- Some theorems state that **something exists** — typically written in the form **∃x P(x)** (there exists an x such that P(x) is true). A **proof** of this is called an **existence proof**, and there are two main types:

### **Constructive Existence Proof**

- You **find a specific example** (called a **witness**) that satisfies the condition.
- Example: To prove there exists an even prime number, you simply point out that **2** is one.

### **Nonconstructive Existence Proof**

- You **do not provide a specific example**, but still prove that something **must** exist.
- Often done using **proof by contradiction**: Assume nothing exists (¬∃x P(x)), derive a contradiction, so something **must exist**.

## Uniqueness Proofs

- Some theorems claim that **exactly one** element exists with a certain property. To prove such a theorem, you must do **two things**:
    - **Existence:** Show that **at least one** element exists that satisfies the property.
    - **Uniqueness:** Show that **no other** element can have the same property — meaning: If two elements both satisfy the property, then they **must be equal**.

<aside>
✅

To prove a theorem of the form **$\exists x(P(x) \wedge \forall y (y \neq x \rightarrow \neg P(y))$**

</aside>