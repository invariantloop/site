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

$$
m \equiv c^d \pmod {pq}
$$


## Cryptographic Protocols

### Key exchange (Diffie–Hellman) 

Diffie–Hellman là một a protocol that two parties can use to `exchange a secret key 
over an insecure communications channel` without having shared any information in the
past


##### Public Parameters

Alice and Bob publicly choose:

- prime $p$
- primitive root $a$ of $p$

The computations are done in

$$
\mathbb{Z}_p
$$


#### Protocol Steps

1. Alice chooses a secret

$$
k_1
$$

and sends

$$
a^{k_1} \bmod p
$$

to Bob.

2. Bob chooses a secret

$$
k_2
$$

and sends

$$
a^{k_2} \bmod p
$$

to Alice.


#### Compute Shared Key

Alice and Bob compute the shared key

$$
(a^{k_2})^{k_1} \bmod p = (a^{k_1})^{k_2} \bmod p
$$

### Digital signature

Digital signatures allow a recipient to verify that a message **really came from the claimed sender**.

:::tip They provide:
- **Authentication** (who sent the message)
- **Integrity** (message was not altered)
:::

#### Alice's RSA Keys

Alice has:

- Public key: $(n, e)$

- Private key: $d$

#### Signing a Message

Alice wants to send a message \(M\).

1. Convert the message into numbers.
2. Split it into blocks:

$$
(m_1, m_2, ..., m_k)
$$


3. Alice signs each block using her **private key**:

$$
(s_i = m_i^d \pmod n)
$$

She sends the signature blocks:

$$
(s_1, s_2, ..., s_k)
$$


#### Verifying the Signature

Anyone can verify the signature using **Alice's public key**.

They compute:

$$
(m_i = s_i^e \pmod n)
$$

If the result equals the original message block, the signature is valid.