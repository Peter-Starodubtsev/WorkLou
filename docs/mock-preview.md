# Claude mock UI preview

Run this version from the fork branch `codex/figma-claude-review`:

```sh
npm ci
npm run preview:mock
```

Open **http://localhost:3001/today**. The earlier database-backed preview remains on port 3000. `WORKLOU_MOCK_PREVIEW=1` enables an opt-in Next rewrite layer for the A2 routes; without that flag the existing backend pages remain in use. No database, provider key, migration or real transmission is required for the mock preview.

The branch is pushed to [Peter-Starodubtsev/WorkLou](https://github.com/Peter-Starodubtsev/WorkLou/tree/codex/figma-claude-review), a fork of sz-747/WorkLou. Do not merge or push to either main branch as part of this review.

## Review data and behavior

Eight synthetic clients and eight synthetic services populate Today, My clients, shelter beds, referrals and letters. Their initial copy comes from the Claude reference, with explicit corrections where the reference contradicts itself (a no-curfew request cannot match Harbour House's 11 pm curfew). Bed counts and source descriptions are mock examples.

One reducer owns the client records, notes, letters, plans, task decisions, choices, callback records, alerts and service-review requests. Changes are saved to browser localStorage (`worklou-claude-mock-v1`) and synchronized between tabs on the same origin. Each reviewer/browser gets an independent copy; Git pushes share the code and starter fixtures, not a reviewer's browser edits. This is a UI simulation, not concurrent production casework storage. Reset demo restores the starter examples after an explicit confirmation in the UI.

Send and callback controls record **simulated** events. They do not contact services, send SMS/email, make bookings, or write to Postgres. Working is a deterministic housing-review scenario, not an LLM or live background worker. Its Send/Skip gate drives the transition into Done. Every result remains reviewable; a selected shelter is not a booking or guaranteed vacancy.

## Connected screens

- **Today:** three attention items, running task, due follow-ups, bed rail, letters rail; in-place attention/follow-up review with editable saved drafts, local draft checks and Mark reviewed; All overdue / Waiting on service links.
- **Search:** name or LP number results with files, profile, Ask and New case note actions. Natural-language requests identify one client. “Not Maya?” clears the choice; selecting someone else updates the task name and Run target. Multiple named clients require manual selection. An expanded composer supports multiline text and local text-note attachments.
- **Spotlight:** global client/service/file/action/page search, arrow selection, Enter activation, Escape and native dialog focus containment.
- **My clients:** compact Running / Waiting on service / Overdue queue cards and a Mine strip above the existing full-width filtered table. Saved-plan completion counts reflect this demo workspace. Add a person creates a new isolated mock case and updates Today/search/alerts.
- **Client profile:** context bar at top; boxed header; adjacent orange Quick exit, dark Ask, soft-green New case note actions; editable client information; summary, contact history, files, referrals and plan progress.
- **Client plan:** suggestions/toggles and reviews left; quick-exit summary, grouped actions, declined/revisit, freeform additions and support letter right. Checkboxes, additions and reviews persist.
- **Client tabs:** Profile, dedicated Quick exit page, Plan, Shelters, Referrals, Notes and Letters all open populated, case-scoped surfaces. Existing top-level Working/Done URLs lead to My clients; the actual flows are `/clients/:id/working` and `/clients/:id/done`.
- **Shelters:** table, combined filters, request-based eligibility cards, excluded reasons, subtle support/pet/curfew tags, whole-row/card expansion into inline service details, mock capacity/provenance, discovery review requests and call list. Client-scoped selections persist.
- **Working:** compact task header; approval draft; activity toggle. Hiding activity expands the main sheet and moves source links below it. Send simulation saves a message; Skip saves no message; both lead to Done.
- **Done:** three option cards and paper trail in one desktop row; explicit candidate/confirm/cancel states, persisted best fit, callback confirmation with a downloadable private 30-minute calendar reminder, next-step guidance and idempotent Add all three to plan. The calendar file does not invite anyone or synchronize an external calendar. Did/Didn't text reflects actual mock operations.
- **Quick exit:** optional client-specific safety checklist, editable details and persistent confirmations, review notes, print, and simulated safe-phone sharing. Editing a detail clears its confirmation for another review.
- **Draft review:** a deterministic local checklist available beside follow-up, working and letter drafts. It is not a live AI or provider verification. Letter send simulation requires explicit review confirmation.
- **States:** all twenty control families represented across rest/hover/pressed/focus/disabled, using shared controls and real inputs/switches where applicable. This is a state review page, not another casework destination.

The unified Today entry and separate client/task fields are consecutive states of one composer, combining the Today search, two-bars and long-ask references. Intake, standalone notes/letters and follow-up pages extend the shared visual system because the Claude page has no dedicated frames for those full flows. Add and selected profile actions use compact 16px outline icons, a 5px text gap and no icon-container padding. Existing glossy surfaces are deliberately retained; New case note is green per the user's correction. This is not a claim of pixel-identical reproduction of every desktop frame.

## Manual test path

1. Today → All overdue: only Maya and Grace. Switch to Waiting on service: Jasmine, Amara and Grace.
2. Search `Maya` → Open profile. Create a case note, save it, and check recent contact, file count and alert count. Reload: the note remains.
3. Today → type `Find housing for Maya` → Not Maya? → choose Jasmine. Confirm task text and Run target switch to Jasmine. Run → Jasmine's Working page. Quick exit must show Jasmine's plan, not Maya's.
4. Toggle activity off/on. Edit the message and Send · simulate, or Skip. Done shows the corresponding event and no real transmission claim.
5. Choose Bridgewell → Confirm. Reload: Current best fit remains. Book a mock callback and check Referrals, Today and the paper trail. Add all three to plan twice: no duplicate actions.
6. Plan → toggle a suggestion, add a custom action, check it complete, add a review, and draft/save a support letter. Check the profile's progress and Letters tab.
7. Client Shelters → search `dog, no curfew`: Harbour House appears under excluded reasons. Open a service, select an eligible option, and check the saved choice.
8. Add a person. Search their new name or LP reference and verify their empty/new files and quick-exit details are independent.
9. Today → click an attention row: review opens without leaving Today. Save an edited draft and find it under that client’s Referrals. Check draft, then mark reviewed when appropriate.
10. Profile → Edit information; confirm search uses the new name. Quick exit opens a dedicated client page: edit a detail and confirm it; reload to check persistence.
11. Book a mock callback with a specific time, download the calendar file and review its time before importing. Shelter tags and whole-row expansion should preserve the current visual style.
12. Alerts → open the relevant client or Mark all read. Global Search → type a name/service and activate a result with Enter. Escape closes dialogs and returns focus.

For independent test data without altering an active localhost review, use `http://127.0.0.1:3001/today`; it is a separate browser origin and gets separate fixtures.

## Validation and assets

- `npm run test:mock`: 15 deterministic workflow checks covering case isolation, search/ambiguity, filters, saves/alerts, run/Send/Skip, confirmation before booking, persisted serialization, idempotent plan additions, shelter constraints, isolated client edits, quick-exit confirmations/edits, private calendar export, and file-alert routing.
- `npx tsc --noEmit` and a production build with the mock flag.
- Live Chrome checks: Today search results; saved note → recent contact/files/alerts; Working without activity; Send → Done; candidate confirmation; full refresh retains best fit; Add all three → plan; suggestion switch; Overdue and Waiting subsets; Not Maya? → Jasmine → Run; Jasmine quick exit uses her own record. Visual inspection of Today, Profile, Plan, Working without activity, and Done choosing. Not every control was manually exercised at every viewport.
- Follow-up browser checks: preserved glossy My clients overview, inline Harbour House details/tags, dedicated Maya quick-exit page, Today popup stays on Today, and saved follow-up draft feedback.
- Exact Figma SVG exports are committed in `public/figma-claude/`; source URLs are recorded in `sources.json`. Assets render locally rather than depending on expiring Figma URLs. Logo 62.9091×48, search 18×18, return 40×40, spinner 16×16, ring 18×18; check leaf 12×9.5 and status dots 8×8 inside their layout holders. Toggle-on is 36×20. Toggle-off has an exported shadow box of 84×68, positioned at (-24,-16) so its inner 36×20 track retains the designed size. Backdrop preserves its 1440×1000 aspect ratio. The rendered Plan switch/checks and Today/Done shared assets were visually verified.

[Claude reference page](https://www.figma.com/design/7cmuQrKGi1R0VfBchTfuqZ/Lou-s-Place-%E2%80%94-Website-Concepts?node-id=118-2).
