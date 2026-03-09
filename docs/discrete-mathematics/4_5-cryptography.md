---
outline: deep
---

## Classical Cryptography

### Monoalphabetic cipher

#### Caesar cipher
- Replace each letter by an element of $Z_{26}$, that is, an integer from 0 to 25 (A = 0, B = 1,... Z = 25)
- Chose a `key` k < 26, we'll have a function f (encrypt) and g (decrypt):

:::info 
$$
f(p) = (p + k) \mod 26
$$
:::

:::info
$$
g(p) = f^{-1}(p) = (p - k) \mod 26
$$
:::

#### Affine cipher

- We can generalize shift ciphers further to slightly enhance security by using a function of
the form
::: info
$$
f(p) = (ap + b) \mod 26
$$

Where $a$ and $b$ are integers and $f$ is the `bijection`.
:::

Prove: $f$ is a bijection iff `gcd(a, 26) = 1`

- To find decrypt function $g(p) = f^{-1}(p)$, we assume that $c = (ap + b) \mod 26$, we'll show $p$ in term of $c$
- $c \equiv (ap + b) \mod 26$ => $ap \equiv (c - b) \mod 26$ (1)
- We can see that to solve the congruence equation (1), the gcd(a, 26) = 1 to obtain its `inverse` (See 4_4)
- (1) => $p \equiv (a^{-1} \cdot (c - b)) \mod 26$

:::info Affine decryption
$$
g(p) = a^{-1} \cdot (c - b) \pmod {26}
$$
:::

### Block cipher
- Encryption methods of Caesar/Affine cipher are vulnerable to attacks based on the `analysis of letter frequency` in the ciphertext.
- We can make it harder to successfully attack ciphertext by replacing blocks of letters with other blocks of letters 
instead of replacing individual characters with individual characters

#### Transposition cipher

- A **transposition cipher** is a simple type of block cipher that encrypts a message by **rearranging the positions of letters**,
rather than changing the letters themselves.

- The `key` is a **permutation** $\sigma$ of the set

$$
\{1,2,\dots,m\}
$$

- A permutation is a **one-to-one function**

$$
\sigma : \{1,2,\dots,m\} \rightarrow \{1,2,\dots,m\}
$$

- Encryption 
  - Split the plaintext into **blocks of size $m$**. 
  - If the message length is not divisible by $m$, add **random letters** to complete the last block. 
  - Rearrange letters using the permutation $\sigma$. 

If the plaintext block is

$$
p_1 \; p_2 \; \dots \; p_m
$$

then the ciphertext block is

$$
c_1 c_2 \dots c_m
=
p_{\sigma(1)} \; p_{\sigma(2)} \; \dots \; p_{\sigma(m)}
$$

- Decryption 
  - Use the **inverse permutation** $\sigma^{-1}$.

Given ciphertext

$$
c_1 c_2 \dots c_m
$$

we rearrange using $\sigma^{-1}$ to recover

$$
p_1 p_2 \dots p_m
$$


## Cryptosystems
- A **cryptosystem** provides a general framework for defining encryption methods.
- A cryptosystem is a **five-tuple**

$$
(\mathcal{P}, \mathcal{C}, \mathcal{K}, \mathcal{E}, \mathcal{D})
$$

where

- $\mathcal{P}$ : set of **plaintext strings**
- $\mathcal{C}$ : set of **ciphertext strings**
- $\mathcal{K}$ : **keyspace** (set of all possible keys)
- $\mathcal{E}$ : set of **encryption functions**
- $\mathcal{D}$ : set of **decryption functions**

For each key $k \in \mathcal{K}$

- encryption function: $E_k \in \mathcal{E}$
- decryption function: $D_k \in \mathcal{D}$

They satisfy

$$
D_k(E_k(p)) = p
$$

for every plaintext $p$.

This means **decrypting an encrypted message returns the original plaintext**.

### Private Key Cryptography
::: info
All classical ciphers, including shift ciphers and aﬃne ciphers, are examples of `private key cryptosystems`
:::

## The RSA Cryptosystem
Each user has an **encryption key**

::: info
$$
(n, e)
$$
:::

### Key Construction

1. Choose two large primes

$$
p, q
$$

2. Compute the modulus

$$
n = pq
$$

Typically:
- $p$ and $q$ each have about **300 digits**
- $n$ has about **600 digits**

3. Choose an exponent $e$ such that

$$
\gcd(e,(p-1)(q-1)) = 1
$$

This means $e$ is **relatively prime** to $(p-1)(q-1)$.

### The RSA Encryption

#### Step 1: Convert letters to numbers

Each letter → **two digits**

$$
A=00, B=01, \dots, Z=25
$$

---

#### Step 2: Create blocks

Let

$$
n = pq
$$

Split the digit string into blocks of **$2N$ digits** such that

$$
2525\dots25 < n
$$

This ensures each block

$$
m_i < n
$$

Pad the last block with **X** if needed.

---

#### Step 3: Encrypt

Each block

$$
m_i
$$

is encrypted using

$$
c_i = m_i^e \pmod{n}
$$

(using [fast modular exponentiation](4_2-integer-representations-and-algorithms.md#fast-modular-exponentiation-algorithm))

---

## Result

Ciphertext:

$$
c_1, c_2, \dots, c_k
$$

RSA encrypts **blocks of characters → blocks of numbers**, so it is a **block cipher**.


### The RSA Decryption
### RSA as a Public Key System

## Cryptographic Protocols

### Key exchange
### Digital signature

