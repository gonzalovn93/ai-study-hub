# Gonza's AI Study Hub

Live: https://ai-study-hub-weld.vercel.app/
Deploy: git push origin main → Vercel auto-deploys in ~30s

The same commit also builds https://gonzalovn93.github.io/ai-study-hub/ (GitHub Pages).
Both hosts serve the identical file. The 70 tasks in the Notion daily study tracker
currently link to the Pages URL.

## Architecture

Single HTML file (index.html). All content and JS inline. No backend, no API calls, no keys.

Tabs: Syllabus (module map) · Learn (lesson browser)

Deep links work: `…/#learn?m=ma&l=patterns` opens that lesson directly.
Lesson completion is stored in `localStorage` per device — click the sidebar ✓ or the
footer button to toggle a lesson done.

## 15 modules — topic-scoped, no overlap

| Module | Topic | Dates | PDF |
|--------|-------|-------|-----|
| M01 | Python Basics | Jul 28–Aug 3 | Study_M01_Python_Basics.pdf |
| M02 | Data Structures | Aug 4–10 | Study_M02_Data_Structures.pdf |
| M03 | Databases & AI Memory | Aug 11–17 | Study_M03_Databases_AI_Memory.pdf |
| M04 | Machine Learning | Aug 18–24 | Study_M04_Machine_Learning.pdf |
| M05 | Neural Networks | Aug 25–31 | Study_M05_Neural_Networks.pdf |
| M06 | Transformers & Attention | Aug 29–30 | Study_M06_Transformers_and_Attention.pdf |
| M07 | LLMs In Depth | Sep 1–4 | Study_M07_LLMs_In_Depth.pdf |
| M08 | Evals | Sep 5–7 | Study_M08_Evals.pdf |
| M09 | AI Agents | Sep 8–12 | Study_M09_AI_Agents.pdf |
| M09B | Multi-Agent Systems | Sep 13–14 | Study_M09B_Multi_Agent_Systems.pdf |
| M10 | Systems & Cloud | Sep 15–21 | Study_M10_Systems_and_Cloud.pdf |
| M11 | Security & Ethics | Sep 22–28 | Study_M11_Security_and_Ethics.pdf |
| M12 | AX & Agent Experience | Sep 29–Oct 3 | Study_M12_M13_AX_and_Strategy.pdf |
| M13 | AI Strategy & Business | Sep 30–Oct 3 | Study_M12_M13_AX_and_Strategy.pdf |
| M13B | The Data Flywheel | Oct 4–5 | Study_M13B_Data_Flywheel.pdf |

PDFs are topic-scoped and uploaded to a single NotebookLM notebook. Zero overlap between files.
They live in `C:\Users\gonza\Tech Learning\` and `C:\Users\gonza\AI learning\Final_Course\`.

Four PDFs in the table above have not been generated yet: **M06, M08, M09B, M13B**. Their
material currently sits inside the M05, M07, M09 and M12/M13 files respectively, so those
four still overlap until the new ones are cut.

The Learn sidebar also carries a **Bridge — AI Orientation before M04** section (what AI is,
the three waves, the data pipeline). It is Day 7 of M03 and ships inside the M03 PDF.

## How to add a lesson

1. Open index.html, find `const L = {`
2. Add a key. The prefix is the module's topic code, not its number — `py`, `db`, `ml`, `dl`,
   `tr`, `llm`, `ev`, `ag`, `ma` (M09B), `sys`, `sec`, `ax`, `st`, `f` (bridge + M13B):

   ```js
   'ma:newlesson':{ey:'Module 09B · Multi-Agent Systems',ti:'Title',sub:'One-line subtitle.',
   bd:`<p>Body HTML.</p>`,
   pr:{m:'ma',l:'patterns'},nx:{m:'ma',l:'costs'}}
   ```

3. Add the sidebar entry under the right section header:

   ```html
   <div class="si" data-k="ma:newlesson" onclick="ld('ma','newlesson')">New lesson</div>
   ```

4. The sidebar order is the canonical order — `pr`/`nx` must match it, and the neighbours on
   either side need their pointers updated too. The progress denominator counts sidebar
   entries, so it picks up new lessons automatically.
5. git commit and push — both hosts deploy automatically.
