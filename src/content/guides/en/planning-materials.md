---
translationId: planning-materials
locale: en
slug: planning-materials
title: Give your materials a plan
summary: Turn your own material requirements into a simple, saved shortage list.
category: tools
status: published
verification: editorial
gameVersion: Custom planning tool · no character presets
updatedAt: '2026-11-21'
revision: 1
sourceRevision: 1
sourceIds: [elementa-launch-20261031]
order: 4
---
## Start with requirements you can check

Our first material planner is a custom worksheet. Enter a material's name, the total amount needed for your selected upgrade and the amount you already own. Each row shows the remaining shortage.

The current release announcement does not establish character-specific progression costs. We therefore do not prefill character requirements. Use quantities you can verify in your own game or a clearly versioned source.

## What the numbers mean

For each material, the planner calculates **remaining = max(required − owned, 0)**. Here, “required” means the cost of the upgrades you still intend to perform, not a lifetime total that includes upgrades already completed.

Combine a material's requirements into a single row. The planner rejects duplicate names to avoid accidentally deducting the same inventory twice. It does not infer material identity across translated names.

The summary counts material types with a shortage. It does not add different item types into a misleading single currency, or convert them into stamina or days of farming.

## Saving and moving a plan

The plan is saved in this browser. English and Japanese pages share the same local plan on this site. Export a JSON backup if you want to keep a copy or move the plan to another browser. Imported files are checked before replacing the current plan, and replacement requires confirmation.

These are local notes: they do not connect to your game account or read your inventory. Private browsing and clearing site data can remove them.

[Open the material planner](../../tools/material-planner/).
