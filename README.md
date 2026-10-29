# MindCare — Dementia Care Application

React + TypeScript + Vite application.

## Run locally

1. Install Node.js (LTS).
2. Extract this ZIP and open the folder that contains `package.json` in VS Code.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown in the terminal.

## Patient Portal activities

- **Working Memory Challenge** — 120 generated picture-sequence recall cases with level progression.
- **Tower of Hanoi** — 100 levels; disk count increases gradually, goal peg changes, and the selected top disk lifts visibly.
- **Rule Switching** — 120 picture-first sorting cases with category rules that change over levels.
- **Everyday Conversation** (listed as Verbal Fluency in the portal) — familiar daily situations with supportive response choices.
- **Spatial Reasoning** — 120 levels of the 3×3 sliding-number puzzle, arranging tiles 1–8 with one empty square. Arrangements are generated through legal moves so they remain solvable.
- **Scene Investigator** — 120 generated picture-scene recall cases.
- **Family Recognition** — preserved without changes.
- **Voice & Music** — 120 distinct familiar-word prompts, speech playback/recognition, and a gentle tone that varies between levels.
- This is last commit

Progress and completed game sessions are saved locally in the browser. The Caretaker Portal Performance Analysis includes a daily performance graph for the last 7 days, a monthly performance graph for the last 6 months, a filter to view one game or all games, average performance per game, session counts, and recent completed sessions. Days/months without completed sessions show no accuracy point (rather than misleading 0% accuracy). Tower of Hanoi records move-efficiency as its performance score and stores the level/challenge with the session. Activities are intended for engagement and practice, not diagnosis or treatment; caregivers should adapt difficulty and support to the person's preferences and abilities.
