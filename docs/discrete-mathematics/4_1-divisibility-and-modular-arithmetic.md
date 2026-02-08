---
outline: deep
---


::: info
Tính chia hết và số học đồng dư
:::

## Division

- For 2 integers a and b, a ≠ 0, a divides b **$(a|b)$** if it exists an integer k such that $b = a.k$
- Express using quantifier

$$
a|b \text{: } \exists k (a.k=b) \text { where x is set of integer}
$$

- **a** is a factor or **divisor** of **b** (a là uớc, số chia của b)
- **b** is a **multiple** of **a** (b là bội của a)

### Theorem 1

- Let a, b, and c be integers, where a ≠ 0. Then,

::: info 👆
if $a ∣ b$  and $a ∣ c$ , then **$a ∣ (b + c)$**
:::

::: info 👆
if $a ∣ b$  then $a ∣ bc$ for all integer c
:::

::: info 🥉
if $a ∣ b$  and $b ∣ c$ , then **$a ∣ c$**
:::

### Corollary 1

::: info 👉
If a, b, and c are integers, where a ≠ 0, such that $a ∣ b$ and $a ∣ c$, then $a ∣ mb + nc$  whenever m and n are integers.
:::

### Theorem 2 (Division algorithm)

::: info 👉
Let a be an integer and d a positive integer.

Then there are **unique integers q and r**, with $0 ≤ r < d$, such that $a = dq + r$.
:::

- In the equality:
    - d is called the **divisor (số chia)**
    - a is called **dividend (số bị chia)**
    - q is called **quotient (thương)**
    - r is called **remainder (số dư)**
- We have notation for q and r:

$$
q = a \space div \space d = \lfloor a/d \rfloor \text {, and }
$$

$$
r = a \space mod \space d = a - d
$$

## Modular Arithmetic (số học đồng dư)

### Congruent (đồng dư thức)

- If a and b are integers and m is a positive integer, then **a is congruent to b modulo m** if **m divides a − b $m|(a-b)$**

$$
a \equiv b(mod \space m)
$$

- m is called **modulus** (plural moduli) - mẫu số đồng dư

### Theorem 3

::: info 👉
Let a and b be integers, and let m be a positive integer. Then $a ≡ b (mod \space m)$ if and only if $a \space mod \space m = b \space mod \space m$.
:::

- Proof,

### Theorem 4

::: info 👉
Let m be a positive integer. The integers a and b are congruent modulo m if and only if there is an integer k such that $a = b + km.$
:::

- Proof, use direct proof from the definition of congruence

### Theorem 5

- Let m be a positive integer. If $a ≡ b (mod \space m)$ and $c ≡ d (mod \space m)$, then
    - $a + c \equiv b + d (mod \space m)$
    - $a.c \equiv b.d (mod \space m)$
- Proof, direct proof

### Corollary 2

![image.png](/images/discrete-mathematics/4_1-image.png)

## Arithmetic Modulo m

### Definition

- We can define arithmetic operations on $Zm$, the set of non-negative integers less than m, that is, the set $\{{0, 1, ... , m − 1\}}$. 
- In particular, we define the addition of these integers, denoted by $+m$ (use + for simplicity) by

$$
a + b = (a +b) \space mod \space m
$$

$$
a.b = (a.b) \space mod \space m
$$

- They also satisfy many of the same properties of ordinary addition and multiplication of integers. 
- In particular, they satisfy these properties:

### Properties

- Closure (Tính đóng)

$$
\text{If } a, b \in \mathbb{Z}_m, \text{ then }
$$

$$
a + b \in \mathbb{Z}_m \text{ and }
$$

$$
a \cdot b \in \mathbb{Z}_m
$$

- Associativity (Tính kết hợp)

$$
\text{If } a, b, c \in \mathbb{Z}_m, \text{ then }
$$

$$
(a + b) + c = a + (b + c) \text{ and }
$$

$$
(a \cdot b) \cdot c = a \cdot (b \cdot c)
$$

- Commutativity (Tính giao hoán)

$$
\text{If } a, b, c \in \mathbb{Z}_m, \text{ then }
$$

$$
a + b= b + a \text{ , and }
$$

$$
a \cdot b = b \cdot a
$$

- Identity elements (Phần tử đơn vị)

::: info 👉
The elements 0 and 1 are identity elements for addition and multiplication
modulo m, respectively
:::

- **Additive** **inverses** (Phần tử đối), **not be applied for multiplicative**

$$
\text{If } a \ne 0 \text{ and } a \in \mathbb{Z}_m, \text{ then }
$$

$$
m-a \text{ is additive inverse of } a \text{ modulo } m, \space 0 \text{ is its own additive inverse.}
$$

$$
a + (m - a) = 0 \text{ and } 0 + 0 = 0.
$$

- Distributivity (phân phối)

$$
\text{If } a, b, c \in \mathbb{Z}_m, \text{ then }
$$

$$
a \cdot (b + c) = (a \cdot b) + (a \cdot c) \text{, and }
$$

$$
(a + b) \cdot c = (a \cdot c) + (b \cdot c)
$$
