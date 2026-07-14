# AGENTS.md

## Project

Akin is a mobile-first app built with web technologies that lets you track streaks for your different goals, with a modern and visually stunning interface, with gamification but without looking cheap. Something more like Duolingo.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Priorities

- Totally dazzling aesthetic design, worthy of a native mobile application developed by a billion-dollar company.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.