---
outline: deep
---

## The Pigeonhole Principle

The idea is almost obvious: if you have more pigeons than boxes, some box must hold at least two pigeons. Despite how simple it sounds, it proves surprising results.

::: info Theorem 1 — The Pigeonhole Principle
If $k + 1$ or more objects are placed into $k$ boxes, then there is at least one box containing **two or more** of the objects.
:::

::: tip Proof idea
Use the **contrapositive**. If every one of the $k$ boxes held at most one object, the total number of objects would be at most $k$. That contradicts having $k + 1$ objects. So some box must hold at least two.
:::

This principle is also known as the **`Dirichlet drawer principle`**.

### Corollary

::: info Corollary 1
A function $f$ from a set with $k + 1$ or more elements to a set with $k$ elements is **not one-to-one**.
:::

The connection: think of the $k+1$ domain elements as objects and the $k$ codomain values as boxes. Two objects sharing a box means two inputs map to the same output — so $f$ cannot be injective.

- Examples:
  - Among any $367$ people, at least two share a birthday (there are only $366$ possible birthdays).
  - In any group of $27$ English words, at least two must begin with the same letter (only $26$ letters).
  - In a class, how many students guarantee that two get the same final score (scored $0$ to $101$)? There are $101$ possible scores, so $102$ students suffice.

## The Generalized Pigeonhole Principle

What if there are many more objects than boxes? Then some box is forced to hold *many* objects, not just two.

::: info Theorem 2 — Generalized Pigeonhole Principle
If $N$ objects are placed into $k$ boxes, then there is at least one box containing at least
$$
\left\lceil \frac{N}{k} \right\rceil
$$
objects.
:::

Here $\lceil x \rceil$ is the **`ceiling`** — the smallest integer not less than $x$.

::: tip Proof idea
Suppose, for contradiction, that **every** box held fewer than $\left\lceil N/k \right\rceil$ objects, i.e. at most $\left\lceil N/k \right\rceil - 1$. Then the total is at most
$$
k\left(\left\lceil \frac{N}{k} \right\rceil - 1\right) < k\left(\left(\frac{N}{k} + 1\right) - 1\right) = N
$$
using $\lceil N/k \rceil < (N/k) + 1$. That total $< N$ contradicts having $N$ objects.
:::

- Examples:
  - Among $100$ people, at least $\left\lceil 100/12 \right\rceil = 9$ were born in the same month.
  - The minimum number of cards drawn from a standard deck to guarantee three of one suit: with $k = 4$ suits, we need the smallest $N$ with $\lceil N/4 \rceil \ge 3$, which is $N = 9$.

### The general counting rule

A very useful form: the **minimum number of objects** $N$ needed so that at least $r$ objects are guaranteed in one of $k$ boxes is

$$
N = k(r - 1) + 1
$$

The intuition: you can place up to $r - 1$ objects in *each* of the $k$ boxes without any box reaching $r$ — that is $k(r-1)$ objects. The **very next** object (number $k(r-1)+1$) is forced to push some box up to $r$.

- Example:
  - To guarantee at least $6$ students get the same grade out of $5$ grades $\{A, B, C, D, F\}$: $k = 5$, $r = 6$, so $N = 5(6-1) + 1 = 26$ students.

## Some Elegant Applications

The pigeonhole principle shines when the "boxes" are clever to spot.

::: info Theorem 3 — Monotone subsequences
Every sequence of $n^2 + 1$ distinct real numbers contains a subsequence of length $n + 1$ that is either **strictly increasing** or **strictly decreasing**.
:::

- Example (consecutive games):
  - A team plays at least one game per day over $30$ days, and at most $45$ games total.
  - Then there is a span of consecutive days during which it plays **exactly $14$** games. (Proved by applying the pigeonhole principle to running totals.)

::: tip Ramsey-style result
In any group of $6$ people, there are either $3$ who all mutually know each other, or $3$ who are all mutual strangers. This is the statement that the Ramsey number $R(3,3) = 6$.
:::

## Intuition

- **Basic principle** → guarantees a *collision* (some box has $\ge 2$). Use it for "must two share...?".
- **Generalized principle** → guarantees a *crowd* of size $\lceil N/k \rceil$. Use it for "must at least $r$ share...?".
- **Hardest part is choosing the boxes.** Decide what counts as an "object" and what the "boxes" (the things they get grouped by) are; the arithmetic is then easy.
