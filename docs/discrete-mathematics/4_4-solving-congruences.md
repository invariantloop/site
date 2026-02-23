---
outline: deep
---

## Linear Congruences

- A congruence of the form:

::: info 
$$
ax \equiv b \pmod{m}
$$
is called a `linear congruence`
:::
where $m$ is a positive integer, $a$ and $b$ are integers, and $x$ is a variable

### Inverse of an $a$ modulo $m$ theorem

::: info Theorem 1
If $gcd(a, m) = 1$, m > 1, then there exists an integer $\overline{a}$ such that $a\overline{a} \equiv 1 \pmod{m}$. 
Furthermore, this inverse is unique modulo m.
:::

- Proof:
  - If $gcd(a,m) = 1$, then $sa + tm = 1$ (BÉZOUT’S THEOREM)
  - It also means, $sa + tm \equiv 1 \pmod{m}$
  - Because $tm \equiv 0 \pmod{m}$
  - $sa \equiv 1 \pmod{m}$
  - $s$ is inverse of $a$ modulo $m$

- Find the inverse of $a$ modulo $m$

::: tip 
To find the inverse of $a$ modulo $m$, we can use one of the following methods:
- Working backward through the divisions of the Euclidean Algorithm
- The Extended Euclidean Algorithm
:::

- Example
  - 5, -2, 12, -9,... is the inverse of 3 modulo 7


### Solve The Linear Congruences
- To solve the linear congruences, we first find the inverse $\overline{a}$ of $a$ modulo $m$.
- Then, we multiply both sides of the congruence by $\overline{a}$, we get the equation:
$$
\overline{a}ax \equiv \overline{a}b \pmod{m}
$$ 
- Because $\overline{a}a \equiv 1 \pmod{m}$, we get the equation:
$$
\overline{a}ax \equiv x \pmod{m}
$$
- Finally, we get the solution:
$$
x \equiv \overline{a}b \pmod{m}
$$ 

- Example:
  - Solve: $3x \equiv 4 \pmod{7}$ (1)
  - Because gcd(3,7) = 1, then we have $\overline{a} = 5$ (we choose 5 here)
  - Multiply both sides of the equation (1) by $\overline{a}$:
    - $15x \equiv 20 \pmod{7}$
  - Finally,
    - $x \equiv 20 \equiv 6 \pmod{7}$


## The Chinese Remainder Theorem
::: info Theorem 2
- Let $m_1$, $m_2$, ..., $m_n$ be `pairwise relatively prime` positive integers greater than one 
- and $a_1$, $a_2$, ..., $a_n$ arbitrary integers. Then the system
  - $x \equiv a_1 \pmod{m_1}$
  - $x \equiv a_2 \pmod{m_2}$
  - ...
  - $x \equiv a_n \pmod{m_n}$
- has `a unique solution modulo` $m = m_1 \cdot m_2 \cdot ... \cdot m_n$. (That is, there is a solution $x$ with 0 ≤ x < m, and all other solutions are congruent modulo $m$ to this solution.)
$$
:::

::: tip
We can also use a method known as `Back substitution`
:::

## Computer Arithmetic with Large Integers
- Based on `The Chinese remainder theorem`, we can `uniquely represent` an integer $a$ with $0 \leq a < m$ by

::: info
$$
(a \mod{m_1}, a \mod{m_2}, ..., a \mod{m_n})
$$
:::

- Example:
  - What are the pairs used to represent the nonnegative integers less than m = 12
  - we choose $m_1 = 3$, $m_2 = 4$,
  - 0 = (0, 0) 4 = (1, 0)  8 = (2, 0)
  - 1 = (1, 1) 5 = (2, 1)  9 = (0, 1)
  - 2 = (2, 2) 6 = (0, 2) 10 = (1, 2)
  - 3 = (0, 3) 7 = (1, 3) 11 = (2, 3)

## Fermat’s Little Theorem

::: info Theorem 3
If $p$ is a prime number and $a$ is an integer such that $p \nmid a$ then
$$
a^{p-1} \equiv 1 \pmod{p}
$$

Furthermore, for every integer $a$ we have

$$
a^{p} \equiv a \pmod{p}
$$
:::

- Remark: Fermat’s little theorem tells us that if $a \in Z_p$, then $a^{p−1} = 1$ in $Z_p$
- Example:
  - Find $7^{222} \pmod{11}$
  - $7^{222} = 7^{22.10 + 2} = (7^{10})^{22} \cdot 7^{2} \equiv 1^{22} \cdot 49 \pmod{11} \equiv 5 \pmod{11}$
  - $7^{222} \pmod{11} = 5$

## Primitive Roots and Discrete Logarithms

::: info Def
A `primitive root` modulo a prime $p$ is an integer $r$ in $Z_p$ such that `every nonzero` element of $Z_p$ is a power of $r$.
:::

- Example:
  - 2 is a primitive root modulo 11, because every nonzero element of $Z_{11}$ is a power of 2 
  - we obtain $2^1 = 2, 2^2 = 4, 2^3 = 8, 2^4 = 5, 2^5 = 10, 2^6 = 9, 2^7 = 7, 2^8 = 3, 2^9 = 6, 2^{10} = 1$

::: info Def
- Suppose that $p$ is a `prime`, $r$ is a `primitive root` modulo $p$, and $a$ is an `integer` between 1 and $p$ − 1 inclusive
- If $r^e \mod{p} = a$ and $0 ≤ e ≤ p − 1$, we say that $e$ is `the discrete logarithm` of a modulo $p$ to the base $r$ 
- and we write $log_r a = e$
:::
- Example:
  - Find the discrete logarithms of 3 and 5 modulo 11 to the base 2.
  - Because $2^8 = 3$ and $2^4 = 5$
  - The result is 8 and 4
