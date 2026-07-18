# D&D Ability Scores

The six core numbers a D&D character is built on. A score of **10–11** is average for a human;
player characters usually run **8–20** (20 = human peak; monsters and gods go higher).

## Scores vs. modifiers

The score itself is mostly a label. What actually gets added to your dice rolls is the
**modifier**:

```
modifier = floor( (score - 10) / 2 )
```

So 14 → +2, 10 → +0, 8 → −1, 20 → +5.

| Score | Modifier |
|------:|:--------:|
| 8     | −1 |
| 10–11 | +0 |
| 12–13 | +1 |
| 14–15 | +2 |
| 16–17 | +3 |
| 18–19 | +4 |
| 20    | +5 |

## The six abilities

**Strength (STR)** — raw physical power. Melee attacks and damage, carrying capacity, athletics
(climbing, jumping, grappling). The "solve it by hitting it" stat.

**Dexterity (DEX)** — agility, reflexes, balance. Ranged/finesse attacks, Armor Class (dodging),
initiative (who acts first), stealth, acrobatics, sleight of hand. Often called the most valuable
stat because it touches so many things at once.

**Constitution (CON)** — health, stamina, endurance. Sets hit points; resists poison, disease,
exhaustion. No associated skills, but quietly keeps you alive — almost every build wants a decent CON.

**Intelligence (INT)** — reasoning, memory, factual knowledge. Powers Arcana, History,
Investigation, Nature, Religion. Wizard casting stat. This is *knowing* things.

**Wisdom (WIS)** — perception, intuition, insight, willpower. Reading a room, noticing danger,
resisting mental manipulation. Covers Perception, Insight, Survival, Medicine, Animal Handling.
Cleric/Druid casting stat. This is *sensing* things and having good judgment.

**Charisma (CHA)** — force of personality, confidence, presence. All social influence:
Persuasion, Deception, Intimidation, Performance. Bard/Sorcerer/Warlock/Paladin casting stat.
Not physical attractiveness — the *weight of your personality* on other people.

## The classic gotcha

INT vs. WIS. The standard illustration: knowing a tomato is technically a fruit is
**Intelligence**; knowing not to put it in a fruit salad is **Wisdom**.

## Why this matters for the project

D&D's six are the *familiar* model, but they were designed for a dungeon, not for growth. Note
that four of the six lean physical/combat (STR, DEX, CON, and arguably INT-as-arcana), while
the human-development stuff you actually care about is compressed into **WIS** and **CHA**. That
imbalance is the reason to look at other attribute systems (see `../attribute-systems/`) before
committing to a taxonomy for trainable traits.
