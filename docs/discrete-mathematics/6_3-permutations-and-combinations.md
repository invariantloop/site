---
outline: deep
---

## Permutations and Combinations

Many counting problems ask us to choose elements from a set. The key question is always the same: **does order matter?** If it does, we count `permutations`; if it does not, we count `combinations`.

## Permutations

::: info Def
A **permutation** of a set of distinct objects is an **ordered** arrangement of these objects. An ordered arrangement of $r$ elements of a set is called an **$r$-permutation**.
:::

The number of $r$-permutations of a set with $n$ distinct elements is denoted $P(n, r)$.

::: info Theorem 1
If $n$ is a positive integer and $r$ is an integer with $1 \le r \le n$, then there are
$$
P(n, r) = n(n-1)(n-2)\cdots(n-r+1) = \frac{n!}{(n-r)!}
$$
$r$-permutations of a set with $n$ distinct elements.
:::

The intuition is the **product rule**: there are $n$ ways to pick the first element, $n-1$ ways for the second (one is already used), and so on down to $n - r + 1$ ways for the $r$-th.

::: tip Special case
When $r = n$ we arrange the whole set: $P(n, n) = n!$. By convention $P(n, 0) = 1$ — there is exactly one way to arrange nothing.
:::

- Examples:
  - How many ways can a gold, silver, and bronze medal be awarded among $8$ runners? Order matters, so $P(8, 3) = 8 \cdot 7 \cdot 6 = 336$.
  - The number of permutations of the letters $\{a, b, c\}$ is $3! = 6$: $abc, acb, bac, bca, cab, cba$.
  - How many ways can $5$ people line up at a counter? $P(5, 5) = 5! = 120$.

## Combinations

::: info Def
An **$r$-combination** of elements of a set is an **unordered** selection of $r$ elements from the set. It is simply a **subset** of size $r$.
:::

The number of $r$-combinations of a set with $n$ distinct elements is denoted $C(n, r)$, also written $\binom{n}{r}$ and read "**$n$ choose $r$**". It is called a `binomial coefficient`.

::: info Theorem 2
The number of $r$-combinations of a set with $n$ elements, where $0 \le r \le n$, equals
$$
C(n, r) = \binom{n}{r} = \frac{n!}{r!\,(n-r)!}
$$
:::

::: tip Why divide by $r!$
Each $r$-combination can be ordered in $r!$ different ways to form $r$-permutations. So $P(n, r) = C(n, r) \cdot r!$, which rearranges to
$$
C(n, r) = \frac{P(n, r)}{r!} = \frac{n!}{r!\,(n-r)!}
$$
This is the **division rule** at work: counting ordered selections, then dividing out the orderings we no longer care about.
:::

- Examples:
  - How many ways can a committee of $3$ be chosen from $8$ people? Order does not matter, so $C(8, 3) = \dfrac{8!}{3!\,5!} = 56$.
  - How many bit strings of length $10$ contain exactly four $1$s? Choose which $4$ of the $10$ positions hold a $1$: $C(10, 4) = 210$.
  - How many hands of $5$ cards can be dealt from a standard $52$-card deck? $C(52, 5) = 2{,}598{,}960$.

## A Key Identity

::: info Corollary
For all nonnegative integers $n$ and $r$ with $r \le n$,
$$
\binom{n}{r} = \binom{n}{n-r}
$$
:::

Choosing the $r$ elements **to include** is the same as choosing the $n - r$ elements **to leave out** — every choice of one determines the other, so the counts are equal. This is a **bijective proof**: pairing each $r$-subset with its complement is a one-to-one correspondence between the size-$r$ subsets and the size-$(n-r)$ subsets.

The same fact drops out of the formula. Substituting $n - r$ for $r$ in Theorem 2,
$$
\binom{n}{n-r} = \frac{n!}{(n-r)!\,\bigl(n-(n-r)\bigr)!} = \frac{n!}{(n-r)!\,r!} = \binom{n}{r}
$$
since the two factorials in the denominator just swap places. The identity is exactly the **symmetry** of Pascal's triangle: reading each row left-to-right gives the same numbers as reading it right-to-left.

::: tip Boundary values
$$
\binom{n}{0} = \binom{n}{n} = 1, \qquad \binom{n}{1} = \binom{n}{n-1} = n
$$
:::

- Example:
  - $\binom{8}{6} = \binom{8}{2} = 28$ — easier to compute by leaving out $2$ than choosing $6$.


## Combinatorial Proof (Chứng minh tổ hợp)

- Ý tưởng: Thay vì biến đổi đại số để chứng minh một đẳng thức, **hãy nghĩ xem hai vế đang đếm cái gì**.

- Nếu hai vế đều biểu diễn số lượng của cùng một đối tượng (hoặc hai tập đối tượng có cùng số phần tử), thì hai vế phải bằng nhau.

**Câu hỏi quan trọng nhất khi gặp một combinatorial proof:**

::: tip
Hai vế này đang đếm cái gì?
:::

- Có 2 loại Combinatorial Proof

```text
Combinatorial Proof
        │
        ├──────────────┐
        │              │
        ▼              ▼
Double Counting    Bijective Proof
```

### Double Counting Proof

::: info
Đếm **cùng một tập đối tượng** bằng `hai cách khác nhau`. Nếu hai cách đều đếm cùng một thứ thì kết quả phải bằng nhau.
:::

```text
        Cùng một tập đối tượng
                ★★★★★★★
          ↙                 ↘
     Cách đếm 1          Cách đếm 2
          ↓                  ↓
     Biểu thức A         Biểu thức B
          ↓                  ↓
                 A = B
```

- Example 1

Chứng minh

$$
\sum_{k=0}^{n}\binom{n}{k}=2^n
$$

- Vế phải: Đếm tất cả các tập con của một tập có $(n)$ phần tử.

Mỗi phần tử:
- Chọn
- Không chọn

Có 2 lựa chọn.

Do đó

$$
2^n
$$

- Vế trái: Đếm theo số phần tử của tập con.

- Có $\binom n0$ tập con có 0 phần tử.
- Có $\binom n1$ tập con có 1 phần tử.
- ...
- Có $\binom nn$ tập con có n phần tử.

Tổng số tập con là

$$
\sum_{k=0}^{n}\binom nk.
$$

Hai cách đều đếm **tập tất cả các tập con**.

Suy ra

$$
\sum_{k=0}^{n}\binom nk=2^n.
$$


- Example 2

Có 30 người.

Muốn đếm số cái bắt tay.

- Cách 1

Chọn 2 người

$$
\binom{30}{2}
$$

- Cách 2

Mỗi người bắt tay với 29 người.

Có

$$
30\times29
$$

lượt đếm.

Nhưng mỗi cái bắt tay bị đếm hai lần.

Do đó

$$
\frac{30\times29}{2}.
$$

Hai cách đếm cùng một đối tượng.

Suy ra

$$
\binom{30}{2}
=
\frac{30\times29}{2}.
$$

### Bijective Proof

- Ý tưởng: 

::: tip
Không cần đếm.

Chỉ cần xây dựng một **song ánh (bijection)** giữa hai tập.
:::

Nếu mỗi phần tử của tập A ghép đúng với một phần tử của tập B và ngược lại thì

$$
|A|=|B|.
$$

```text
Tập A

 A1 ───── B1
 A2 ───── B2
 A3 ───── B3
 ...

↓

Ghép 1-1

↓

Hai tập có cùng số phần tử.
```
- Example 

Chứng minh

$$
\binom nr=\binom n{n-r}.
$$

Giả sử

$$
S=\{1,2,\ldots,n\}.
$$

Ta xét:

- Tập tất cả các tập con có \(r\) phần tử.
- Tập tất cả các tập con có \(n-r\) phần tử.

Xây dựng hàm

$$
f(A)=\overline A
$$

trong đó

$$
\overline A=S-A
$$

(chính là phần bù của \(A\)).

Ví dụ

```text
S = {1,2,3,4,5}

A      = {1,4}

Ā = {2,3,5}
```

Nếu \(A\) có \(r\) phần tử thì

$$
\overline A
$$

có

$$
n-r
$$

phần tử.

Mỗi tập con có đúng một phần bù.

Ngược lại, biết phần bù thì xác định lại được tập ban đầu.

Do đó đây là một **bijection**.

Suy ra

$$
\binom nr=\binom n{n-r}.
$$

### Intuition

> **Combinatorial Proof = Đừng biến đổi công thức. Hãy nghĩ xem hai vế đang đếm cái gì.**

- Nếu **đếm cùng một tập đối tượng bằng hai cách** → **Double Counting**.
- Nếu **ghép 1-1 giữa hai tập đối tượng** → **Bijective Proof**.


## Intuition

The single most important question is **whether order matters**.

| | Order matters | Order does not matter |
| --- | --- | --- |
| **What it is** | Permutation (arrangement) | Combination (subset) |
| **Formula** | $P(n, r) = \dfrac{n!}{(n-r)!}$ | $C(n, r) = \dfrac{n!}{r!\,(n-r)!}$ |
| **Relationship** | $P(n, r) = C(n, r) \cdot r!$ | $C(n, r) = \dfrac{P(n, r)}{r!}$ |
| **Cue words** | line up, rank, award, sequence | choose, select, committee, subset |

- **Same start, different finish.** Both pick $r$ items from $n$; permutations then *order* them, combinations do not.
- **Divide away the order.** Every combination corresponds to $r!$ permutations, so combinations are always the smaller count.


