---
outline: deep
---

## 1. Correctness

A program is **correct** if it produces correct output for every valid input.

- **Partial correctness**: if the program terminates ⇒ output is correct
- **Termination**: program always terminates

## 2. Hoare Triple

Notation:

$$
p \{ S \} q
$$

- $p$: initial assertion
- $q$: final assertion
- $S$: program

Meaning:

If $p$ is true and $S$ terminates, then $q$ is true.


## 3. Partial Correctness

$$
(p \land \text{S terminates}) \Rightarrow q
$$

Note: does NOT guarantee termination.


## 4. Composition Rule

If:

$$
p \{ S_1 \} q
$$

$$
q \{ S_2 \} r
$$

Then:

$$
p \{ S_1; S_2 \} r
$$


## 5. Conditional Statements

### 5.1 If (no else)

```text
if condition then S
```

Rule:

$$
(p \land condition)\{S\}q
$$

$$
(p \land \neg condition) \Rightarrow q
$$

Therefore:

$$
p \{ \text{if condition then } S \} q
$$


### 5.2 If-Else

```text
if condition then S1 else S2
```

Rule:

$$
(p \land condition)\{S_1\}q
$$

$$
(p \land \neg condition)\{S_2\}q
$$

Therefore:

$$
p \{ \text{if condition then } S_1 \text{ else } S_2 \} q
$$

### 5.3 Rule of Inference: If – Else If – ... – Else

```text
if condition1 then S1
else if condition2 then S2
...
else Sn
```

#### Rule

Để chứng minh:

$$
p \{ \text{if-else chain} \} q
$$

Ta cần chứng minh các điều sau:

$$
(p \land condition_1)\{S_1\}q
$$

$$
(p \land \neg condition_1 \land condition_2)\{S_2\}q
$$

$$
(p \land \neg condition_1 \land \neg condition_2 \land condition_3)\{S_3\}q
$$

$$
\vdots
$$

$$
(p \land \neg condition_1 \land \cdots \land \neg condition_{n-1})\{S_n\}q
$$


#### Kết luận

$$
p \{ \text{if condition1 then } S_1 \ \text{else if condition2 then } S_2 \ \cdots \ \text{else } S_n \} q
$$


## 6. Loop Invariant (While)

```text
while condition do S
```

### Definition

$p$ is a **loop invariant** if:

$$
(p \land condition)\{S\}p
$$


### While Rule

If:

$$
(p \land condition)\{S\}p
$$

Then:

$$
p \{ \text{while condition } S \} (\neg condition \land p)
$$


## 7. Intuition

- Invariant = something always true during the loop
- When loop ends:
    - condition = false
    - invariant still true

⇒ derive final result

## 8. Proof Checklist for While

1. Initialization:

$$
p \text{ holds before loop}
$$

2. Maintenance:

$$
(p \land condition)\{S\}p
$$

3. Termination:

$$
\neg condition \land p \Rightarrow q
$$