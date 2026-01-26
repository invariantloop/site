---
outline: deep
---

## Integer Representations

### Theorem 1

- For any integer $b>1$ (the base) and any positive integer n, there is a **unique representation**:

$$
n = a_k b^k + a_{k-1} b^{k-1} + \cdots + a_1 b + a_0
$$

where:

- $k \ge 0$ is an integer (the highest power of $b$ in the representation).
- $a_0, a_1, \dots, a_k$ are **digits**, each satisfying $0 \le a_i < b$.
- $a_k \neq 0$ (so the first digit is not zero, ensuring uniqueness).

::: info 💡
**Theorem 1 is called the base b expansion of n**
:::

### Expansions

- Decimal: b = 10
- Binary : b = 2
- hexadecimal: b = 16
- Octal: b = 8

### Base conversion

1. First, divide n by b to obtain a quotient and remainder, that is,

$$
n = bq_0 + a_0 \text{ , where }0 \leq a_0 < b
$$

1. The remainder, $a_0$, is the **rightmost** **digit** in the base b expansion of n. Next, divide $q_0$ by b to obtain

$$
q_0 = bq_1 + a_1 \text{ , where }0 \leq a_1 < b
$$

1. $a_1$ is the second digit from the right in the base b expansion of n
2. Continue this process until we obtain **a quotient equal to zero**.

![image.png](/images/discrete-mathematics/4_2-image.png)

### Algorithm

![image.png](/images/discrete-mathematics/4_2-image1.png)

### Conversion between 2, 16 and 8 expansions

- Each octal digit corresponds to a **block of three** binary digits
- Each hexadecimal digit corresponds to a **block of four** binary digits

## Algorithms for Integer Operations

::: tip ✅
**The algorithms for performing operations** with integers using their **binary expansions** are extremely important in computer arithmetic
:::

Throughout this discussion, suppose that the binary expansions of a and b are

$$
a = (a_{n−1} a_{n−2} ... a_1a_0 )_2,\\b = (b_{n−1} b_{n−2} ... b_1 b_0 )_2
$$

so that a and b each have **n bits**

### Addition algorithm

1. To add a and b, first add their rightmost bits. This gives

$$
a_0 + b_0 = c_0 \cdot 2 + s_0
$$

- where
  - $s_0$ is the rightmost bit (LSB) in the binary expansion of a + b
  - $c_0$ is the carry, which is either 0 or 1
1. Then add the next pair of bits and the carry,

$$
a_1 + b_1 + c_0 = c_1 \cdot 2 + s_1
$$

- where
  - $s_1$ is the next bit (from the right) in the binary expansion of a + b
  - $c_1$ is carry
1. Continue this process
2. At the last stage,

$$
a_{n-1} + b_{n-1} + c_{n-2} = c_{n-1} \cdot 2 + s_{n-1}
$$

- Then, the leading bit of the sum is $s_n = c_{n−1}$

::: tip ✅
$a + b = (s_n s_{n−1} s_{n−2} ... s_1 s_0)_2$
:::

![image.png](/images/discrete-mathematics/4_2-image2.png)

### Multiplication algorithm

- Using the distributive law, we see that

$$
ab = a(b_0 2^0 + b_1 2^1 + ⋯ + b_{n−1} 2^{n−1} ) = a(b_0 2^0) + a(b_1 2^1) + ⋯ + a(b_{n−1} 2^{n−1} )
$$

- We first note that:
1.
   - $ab_j = a$ if $b_j = 1$
   - $ab_j = 0$ if $b_j = 0$
2. Each time we *multiply a term by 2*, we shift its binary expansion one place to the left and add a zero at the tail end of the expansion:

$$
a \cdot 2^1 = a << 1
$$

$$
a \cdot 2^n = a << n
$$

3. Consequently, we can get $(ab_j)2^j$ by shifting the binary expansion of abj j places to the left, that

$$
(ab_j)2^j = (ab_j) << j
$$

4. Finally, we get $ab$ by adding the n integers $ab_j 2^j$, j = 0, 1, 2, ... , n − 1.
- Pseudocode

![image.png](/images/discrete-mathematics/4_2-image3.png)

### Algorithm for DIV and MOD

![image.png](/images/discrete-mathematics/4_2-image4.png)

- This algorithm takes $O(q log a)$ bit operations

## Modular Exponentiation

- How to find efficiently **without using an excessive amount of memory** for

$$
b^n \space mod \space m \text{ -- where b, n and m are large integers}
$$

- Some thought,
  1. It is impractical to first compute $b^n$ and then find its remainder when divided by m, because $b^n$ can be a huge number
  2. We can apply Corollary 2 of Theorem 5 at `[4.1] Divisibility and Modular` which is

$$
(ab) \space mod \space m = ((a \space mod \space m)(b \space mod \space m)) \space mod \space m
$$

Then, we have (Recall that $1 ≤ b < m$)

$$
b^{k+1}\space  mod \space m = b(b^k \space mod \space m)\space  mod \space m
$$

However, this approach is impractical because it requires n − 1 multiplications of integers and n might be huge.

### Fast modular exponentiation algorithm

- Note that, If we use **the base 2 expansion of n**, then

$$
b^n = b^{a_{k-1}\cdot2^{k-1} +... a_1\cdot2 + a_0} \\ = b^{a_{k-1}\cdot2^{k-1}} \cdot ... \cdot b^{a_1 \cdot 2} \cdot b^{a_0}
$$

- This shows that to compute $b^n$, we need only compute the values of
  - $b, b^2 , (b^2)^2 = b^4 , (b^4 )^2 = b^8 , ... , (b^{2^n})^2 = b^{2^k}$
- The algorithm successively finds
  - $b \space mod\space m$,
  - $b^2 \space mod\space m$,
  - $b^4 \space mod\space m$, ... ,
  - $b^{2^{k-1}} \space mod\space m$ and
  - multiplies together those terms $b^{2^j} \space mod\space m$ where $a_j = 1$

![image.png](/images/discrete-mathematics/4_2-image5.png)