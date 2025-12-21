---
outline: deep
---

## Propositions (Mệnh đề)

- Declarative sentence (câu trần thuật), (note, trong tiếng anh cuối câu là đấu chấm)
- It can be True (T) or False (F), **but not both**

### Example

- Propositions
    - 1 + 1 = 2
    - 2 + 2 = 3
    - Hanoi is the capital of Vietnam
- Not propositions
    - What time is it?
    - Read this carefully
    - x + 1 = 2

## Propositional connectives

| Sign  | Connective         | Meaning           | Truth value                                               |
|-------|--------------------|-------------------|-----------------------------------------------------------|
| ¬p    | Negation           | Phủ định          | Opposite true value of p                                  |
| p ∧ q | Conjunction        | And               | **True** when both p and q are true. **False** otherwise  |
| p ∨ q | Dis-junction       | Or (inclusive or) | **False** when both p and q are false. **True** otherwise |
| p ⊕ q | Exclusive Or (XOR) | Exclusive Or      | True when **exactly** p or q is true but not both         |

## Conditional statements

| Sign  | Connective          | Meaning        | Truth value                                                 |
|-------|---------------------|----------------|-------------------------------------------------------------|
| p → q | Implication (hàm ý) | if p then q    | **False** when p is true and q is false, and true otherwise |
| p ↔ q | Bi-conditional      | if and only if | Đúng nếu cả hai cùng giá trị                                |

![image.png](/images/discrete-mathematics/1_1-image.png)

![image.png](/images/discrete-mathematics/1_1-image1.png)

### Ways to express this conditional statement

| Cách diễn đạt bằng tiếng Anh        | Dịch nghĩa tiếng Việt          |
|-------------------------------------|--------------------------------|
| “if p, then q”                      | Nếu p thì q                    |
| “if p, q”                           | Nếu p, thì q                   |
| “p is sufficient for q”             | p là điều kiện đủ để có q      |
| “q if p”                            | q nếu p xảy ra                 |
| “q when p”                          | q khi p xảy ra                 |
| “a necessary condition for p is q”  | Một điều kiện cần để có p là q |
| “q unless ¬p”                       | q trừ khi không phải p         |
| “p implies q”                       | p kéo theo q                   |
| “p only if q”                       | p chỉ khi q                    |
| “a sufficient condition for q is p” | Một điều kiện đủ để có q là p  |
| “q whenever p”                      | q mỗi khi p xảy ra             |
| “q is necessary for p”              | q là điều kiện cần để có p     |
| “q follows from p”                  | q suy ra từ p                  |
| “q provided that p”                 | q miễn là p xảy ra             |

## Converse, Contrapositive, and Inverse

| Loại               | Ký hiệu | Tương đương với           |
|--------------------|---------|---------------------------|
| Converse           | q → p   | Không tương đương p → q   |
| Inverse            | ¬p → ¬q | Không tương đương p → q   |
| **Contrapositive** | ¬q → ¬p | **Tương đương** với p → q |

## Precedence of Logical Operators

| Operator | Precedence |
|----------|------------|
| ¬        | 1          |
| ^        | 2          |
| ∨        | 3          |
| →        | 4          |
| ↔        | 5          |

## Application

### Translating English Sentences

### System Specifications

- System specifications should be **consistent**, that is, they should not contain conflicting requirements that could be used to derive a contradiction.
- When specifications are not consistent, there would be no way to develop a system that satisfies all specifications

### Boolean Searches

### Logic Puzzles

### Logic Circuits