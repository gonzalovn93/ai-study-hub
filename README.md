# Gonza's AI Study Hub

Live site: https://gonzalovn93.github.io/ai-study-hub/

Single-file HTML/JS study hub. To deploy: `git push origin main` → GitHub Pages rebuilds in ~40s.

The site is fully static — no backend, no API calls, no keys. A Vercel mirror still exists at
https://ai-study-hub-weld.vercel.app/ and redeploys from the same push, but nothing depends on it.

Two views: **Syllabus** (module cards) and **Learn** (all 73 lessons). Completion is stored in
`localStorage` per device — click the sidebar ✓ or the footer button to toggle a lesson done.

Deep links work: `…/#learn?m=sec&l=owasp` opens that lesson directly. This is what the 70 tasks in
the Notion daily study tracker point at.

## Module sequence

| Module | Name | Week | Dates | PDF |
|--------|------|------|-------|-----|
| M01 | Python Basics | W1 | Jul 28 – Aug 3 | Study_M01_Python_Basics.pdf |
| M02 | Data Structures | W2 | Aug 4 – Aug 10 | Study_M02_Data_Structures.pdf |
| M03 | Databases & AI Memory | W3 | Aug 11 – Aug 17 | Study_M03_Databases_AI_Memory.pdf |
| — | AI Orientation bridge | W3→W4 | Aug 17 | (end of M03 PDF) |
| M04 | Machine Learning | W4 | Aug 18 – Aug 24 | Study_M04_Machine_Learning.pdf |
| M05 | Neural Networks | W5 | Aug 25 – Aug 28 | Study_M05_Neural_Networks.pdf |
| M06 | Transformers & Attention | W5 | Aug 29 – Aug 30 | (inside M05 PDF) |
| M07 | LLMs In Depth | W6 | Sep 1 – Sep 4 | Study_M07_LLMs_In_Depth.pdf |
| M08 | Evals | W6 | Sep 5 – Sep 7 | (inside M07 PDF) |
| M09 | AI Agents + Multi-Agent | W7 | Sep 8 – Sep 14 | Study_M09_AI_Agents.pdf |
| M10 | Systems & Cloud | W8 | Sep 15 – Sep 21 | Study_M10_Systems_and_Cloud.pdf |
| M11 | Security & Ethics | W9 | Sep 22 – Sep 28 | Study_M11_Security_and_Ethics.pdf |
| M12 | Agent Experience (AX) | W10 | Sep 29 – Oct 3 | Study_M12_M13_AX_and_Strategy.pdf |
| M13 | AI Strategy & Business | W10 | Sep 30 – Oct 5 | (inside M12 PDF) |

There are no standalone R1 / R2 modules. Their content is absorbed:

- **AI Orientation bridge** (end of M03) — what AI is, the three waves, the AI data pipeline
- **M04 Day 1** — tokens, parameters, embeddings
- **M09 Days 6–7** — the 4 canonical multi-agent patterns, cost curves (1x/4x/15x)
- **M13 final lesson** — the data flywheel and the strategic moat

PDFs live in `C:\Users\gonza\Tech Learning\` and `C:\Users\gonza\AI learning\Final_Course\`
(identical copies). Upload one per module group to NotebookLM for the audio walkthrough.

## How to add a lesson

Open `index.html`. Lesson keys are `<modulePrefix>:<slug>` — the prefix is the module's short code,
not its number (`py`, `db`, `ml`, `dl`, `tr`, `llm`, `ev`, `ag`, `ma`, `sys`, `sec`, `ax`, `st`, `f`).

Find the `const L={` object and add an entry, matching the existing format exactly — the key line,
then the `bd:` template literal, then the `pr:`/`nx:` line on its own:

```js
'ag:newlesson':{ey:'Module 09 · AI Agents',ti:'Title',sub:'One-line subtitle.',
bd:`<p>Body HTML.</p>`,
pr:{m:'ag',l:'skspark'},nx:{m:'ag',l:'safety'}}
```

Then add it to the Learn sidebar under the right `<div class="ss">` section:

```html
<div class="si" data-k="ag:newlesson" onclick="ld('ag','newlesson')">New lesson</div>
```

The sidebar order is the canonical order — `pr`/`nx` must match it, and the neighbours on either
side need their `pr`/`nx` updated too. The progress denominator is counted from the sidebar, so it
picks up new lessons automatically.
