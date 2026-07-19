# AGENTS.md

## Project

Akin is a mobile-first app built with web technologies that lets you track streaks for your different goals, with a modern and visually stunning interface, with gamification but without looking cheap. Something more like Duolingo.

We speak to the user in a playful way; we don't intend to be an overly serious professional tool.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Priorities

- Totally dazzling and unique aesthetic design, worthy of a native mobile application developed by a billion-dollar company. We are allergic to generic HTML styles in menus, selects, inputs, buttons, etc. We always strive to create our own that perfectly fit the site's aesthetics and are completely original—none of those typical, basic, AI-generated designs.
- Look and feel like a native web application with excellent performance and UX.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.
