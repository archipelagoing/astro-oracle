# Astro Oracle TODO

Last updated: 2026-11-04. Specifications and an initial GitHub Pages-compatible
browser calculator exist. It calculates planetary transit candidates, previews ICS,
and exports timed transits. The full daily oracle pipeline and payment integration
remain unimplemented. Internal numerical/parser checks pass; browser QA and
independent ephemeris verification are pending.

## Maintenance instructions

- Keep this as the authoritative project checklist; use `[x]` only with evidence.
- After authorized work changes project state, update affected tasks, progress
  notes, next steps, and the date. The backlog does not authorize executing it.
- Preserve unfinished work and user edits. Record deferrals and reopen tasks when
  verification fails. Keep proposed choices distinct from approved decisions.
- Record checks and limitations briefly. Never store secrets or private birth data.

## Responsibility labels and acceptance

Every task has one primary label:

- **[Calculation]** — numerical rules or optimization executed by code. Accept
  against hand-worked cases, boundary cases, and independently known results.
- **[Engineering]** — deterministic parsing, validation, storage, orchestration,
  payments, or export. Accept against explicit input/output and failure behavior.
- **[AI]** — generated language or subjective editorial judgment. Accept against
  human-reviewed examples and a calibrated rubric, alongside hard code checks.
- **[Human]** — product choices, source review, approvals, and manual evaluation.
  Accept with a recorded decision or review result, not an inferred model score.

The labels describe the work, not who writes the code. Weighted astrological
priorities are human preferences; implementing their formula is calculation.
Repeatable arithmetic does not establish predictive validity. AI receives verified
facts and may explain their symbolic meaning; it must not supply missing facts.

## Next steps

1. Enter the reference November birth details in the local form, then implement
   and independently verify angles/whole-sign houses and source comparison — sections 1 and 3.
2. Resolve house system, birthplace/timezone lookup, backend hosting, and generation defaults —
   sections 1 and 4.
3. Build and verify canonical ranking, assignment, generation, and ICS delivery —
   sections 3 and 4.
4. Build the agreed weekly flippable-card interface after generation works — below.
5. Independently verify astronomical calculations and complete browser QA — section 6.

Both raw Astro-Seek and finished oracle samples are now present. The owner likes
the finished format. Birth date/time/place entry and an OpenAI API backend are approved. House system,
lookup/hosting details, and verified symbol data still require resolution. Raw import and generation take priority over card UI.

## Confirmed onboarding and generation direction

- [x] [Human] Choose birth date, exact time, and birthplace entry as the primary
  natal-input path; the application calculates placements rather than requiring uploads.
- [x] [Human] Choose an OpenAI API backend for AI generation, with keys and private
  ranking settings kept outside the public frontend.
- [x] [Human] Select whole-sign houses, city search with historical-timezone
  confirmation/manual correction, and November 2026 as the first reference workflow.
- [x] [Engineering] Implement birthplace search/manual correction and historical
  birth-time confirmation, rejecting gaps and requiring an explicit fold choice.
- [ ] [Human] Verify the birth-details form in actual browsers, including city
  selection, manual entry, re-confirmation, and ambiguous-time selection.
- [ ] [Human] Select lookup providers, backend host, model, budget, and retention settings.
- [x] [Human] Agree to local birth-detail entry, provisional ranking defaults for
  review, and an owner-supplied/identified Sabian edition.
- [ ] [Human] Enter the matching November birth details when the form is available
  and identify the Sabian edition; neither input has been supplied yet.
- [ ] [Calculation] Choose provisional ranking defaults and produce a clearly labeled
  November selection for owner review after required natal facts are available.

Progress: These input/provider choices were confirmed by the owner on 2026-11-04.
Whole-sign houses, confirmed city/timezone lookup, and the November-first
milestone were also approved. The local birth form is implemented with public city lookup; whole-sign angles,
AI services, and other backend configuration remain unfinished.

## Confirmed weekly card interface

- [x] [Human] Confirm weekly calendar direction and card content with the owner.
- [x] [Engineering] Build a weekly calendar with navigation and one flippable card
  per date; completed imports retain rank, glyph, fortune, meaning, and details.
  Group raw/calculated candidates by day, label them unranked, and do not invent fortunes.
- [ ] [Engineering] Support keyboard/touch flipping, visible focus, reduced-motion
  preferences, and an accessible responsive layout.

Progress: Owner selected this card content and generation-first build order on
2026-11-04. Weekly card rendering is now implemented following the owner’s request to replace
the live list. Canonical ranking and fortune generation remain unfinished.

## 1. Define the product and resolve inputs

- [x] [Human] Identify the project as Astro Oracle and remove unrelated BARTR branding.
- [x] [Human] Document the calendar pipeline and required entry content.
- [x] [Human] Record implementation questions and proposed answers.
- [ ] [Human] Define the first intended user and their main reason for buying a calendar.
- [ ] [Human] Obtain a sanitized real Astro-Seek ICS export, including month-edge coverage.
- [ ] [Human] Obtain a matching sanitized natal-chart fixture and document required fields.
- [x] [Human] Approve the completed November ICS as the section-order and writing-format reference.
- [ ] [Engineering] Extract and version that approved rendering template; preserve
  optional sections and validate factual content separately.
- [ ] [Human] Approve supported bodies, aspects, zodiac, house system, and timezone rules.
- [ ] [Human] Approve score tables, overlap rules, date-shift limits, penalties, and ties.
- [ ] [Human] Approve gap handling and supporting-transit rules.
- [ ] [Human] Select a verified, distributable Sabian edition and complete lookup table.
- [ ] [Human] Select astronomical verification tools and define numeric tolerances.
- [ ] [Human] Confirm the prototype purchase scope, sandbox price, and LUNAR separation.

Progress: On 2026-11-04, reviewed the repository specifications and added
[questions](docs/ASTRO-ORACLE-implementation-questions.md) and
[proposed answers](docs/ASTRO-ORACLE-proposed-answers.md). The user confirmed BARTR
is unrelated. Other new defaults remain proposals.

## Browser calculator and GitHub Pages

- [x] [Engineering] Add a static page with primary transit calculation and secondary
  Astro-Seek external-link/import actions; no account sync is claimed.
- [x] [Calculation] Add natal planetary positions and major-aspect crossing search
  with Astronomy Engine, explicit UTC birth offset, and UTC month bounds.
- [x] [Engineering] Add local finished-ICS preview and timed transit-candidate export.
- [x] [Engineering] Include a manual Pages workflow publishing only `web/`.
- [x] [Engineering] Check sample parsing, UTF-8 ICS round trip, birth date validation,
  angular wraparound, crossing residuals, and a solar-return sanity case.
- [ ] [Human] Review desktop/mobile layout and real-browser calculation/import/export.
- [ ] [Calculation] Compare natal longitudes and event times with an independent
  reference; assess station/tangent missed-crossing behavior before broader claims.
- [ ] [Engineering] Add a validated birthplace/historical-timezone workflow and
  Ascendant/MC/house calculations if replacing all chart-upload requirements.
- [ ] [Engineering] Connect calculated candidates to the canonical scoring and
  monthly assignment pipeline; do not label raw candidates as finished fortunes.
- [x] [Human] Enable GitHub Actions Pages publishing and verify the deployed page
  and autofill scripts match the current source.
- [ ] [Engineering] Use appropriate separate hosting for commercial services and
  server-side secrets/payments.

Progress: 2026-11-04 — `node tests/transits.test.cjs` passed with 30 sample events
and 110 calculated November crossings in the test case. Worker syntax checks and
whitespace checks passed. Browser preview host unavailable; no deployment or
independent astronomical comparison performed. See [implementation notes](docs/ASTRO-ORACLE-github-pages.md).

Birth-form progress: On 2026-11-04, timezone/coordinate/place-response tests and a
live public Berlin geocoding check passed. The form confirms birth instants before
calculation and displays natal planetary placements. Browser interaction and
whole-sign angles/houses remain pending. Native Chrome loaded the local page and
assets successfully, but UI inspection timed out, so click-through/visual QA is
unverified. No private birth data was used or saved.

Birthplace autofill: On 2026-11-04, added debounced city suggestions with mouse
and keyboard selection, automatic coordinate/timezone filling, stale-request
cancellation, and invalidation when a selected city is edited. Birth validation
checks and JS syntax/whitespace checks pass; real-browser autofill QA is pending.

## 2. Set up the foundation

- [ ] [Engineering] Select and pin the runtime and dependencies; document a reproducible setup.
- [ ] [Engineering] Define validated NatalProfile, Transit, DailyOracle, and configuration models.
- [ ] [Engineering] Separate immutable source facts from scores, assignments, and creative fields.
- [ ] [Engineering] Add a CLI for input validation and monthly generation.
- [ ] [Engineering] Add fixture directories and local artifact storage excluded from Git when private.
- [ ] [Engineering] Define model-provider interfaces and server-side secret configuration.

Progress: The static calculator uses vendored Astronomy Engine and plain JavaScript.
The canonical backend data models, Python runtime, and AI provider remain unbuilt.

## 3. Build the deterministic calendar foundation

- [x] [Engineering] Parse raw Astro-Seek ICS into structured transits, preserving
  source identity, UTC timestamps, positions, source house values, and descriptions.
- [ ] [Engineering] Normalize imported and calculated candidates into the shared
  backend schema and enrich/verify them with the locally entered natal chart.
- [ ] [Calculation] Specify longitude normalization, minimal angular distance,
  aspect residuals, and house formulas, including precision-derived tolerances.
- [ ] [Engineering] Validate supported fields and timezone conversion; distinguish
  internal geometric consistency from independent ephemeris verification.
- [x] [Engineering] Collapse identical raw-source UIDs, quarantine conflicting UIDs,
  and report missing natal facts, invalid timestamps/positions, and unsupported events.
- [ ] [Calculation] Calculate houses using the approved chart inputs and house system.
- [ ] [Calculation] Implement normalized score features, approved weights, overlap
  rules, and deterministic ties; reject unsupported or out-of-range inputs.
- [ ] [Engineering] Retain each score component and configuration version so a
  displayed score can be traced to its source facts and selected preferences.
- [ ] [Calculation] Optimize one primary transit per date, each transit at most once,
  with approved eligibility windows, shift penalties, and assignment tie-breakers.
  Keep original importance scores distinct from the scheduling objective.
- [ ] [Engineering] Report infeasible coverage before creative generation or checkout.
- [ ] [Calculation] Apply approved supporting-transit selection and global rank rules.
- [ ] [Calculation] Implement Sabian indexing and lucky-number derivation with
  explicit degree bounds, uniqueness, range, seed encoding, and stable hash rules.
- [ ] [Engineering] Retrieve Sabian wording only from the verified versioned table;
  preserve edition/provenance and fail explicitly on missing entries.
- [ ] [Engineering] Render entries with the approved template.
- [ ] [Engineering] Export all-day ICS events with stable UIDs, exclusive end dates, exact transit
  times, transparent availability, and generation/version metadata.
- [ ] [Engineering] Save scored-transit, schedule, and final-entry JSON for inspection.

Progress: On 2026-11-04, `node tests/astroseek.test.cjs` passed for all 146 raw
source events plus malformed/conflicting-record cases. The browser import now shows
structured source facts and missing natal information. Scoring, assignment,
canonical rendering, symbol enrichment, and generation remain unimplemented.
Browser interaction and independent ephemeris validation remain pending.

## 4. Add AI writing and editorial review

- [ ] [Human] Compare model candidates on a small representative sample; choose quality,
  request limits, cost cap, and latency targets.
- [ ] [Engineering] Supply verified body names, aspects, degrees, dates, house numbers,
  and natal relationships as structured facts; validate generated output schemas.
- [ ] [AI] Write interpretations and symbolic house/natal explanations using those
  facts. Do not calculate houses, infer missing chart data, or alter source values.
- [ ] [AI] Compose and compare fortunes for natural rhyme, meaningful imagery, and
  fidelity to the interpretation. A pronunciation match alone is insufficient.
- [ ] [Human] Define whether a favorite means symbolic interest or highest significance.
  The source currently proposes AI symbolic selection; changing it needs a recorded
  specification decision. Highest-score selection could instead be deterministic.
- [ ] [AI] Under the source's symbolic-interest approach, choose a favorite and explain
  its usefulness or symbolic connection without claiming an objective optimum.
- [ ] [Engineering] Form Monday-based weeks, including partial weeks, and enforce
  exactly one selected date belonging to each group.
- [ ] [Engineering] Implement hard validation of all required content and immutable facts.
- [ ] [Human] Build accepted/rejected writing examples and calibrate the editorial
  rubric and thresholds against owner judgments; record model/human disagreements.
- [ ] [AI] Review coherence, usefulness, specificity, and rhyme using that rubric;
  treat scores as fallible judgments rather than measured factual correctness.
- [ ] [Engineering] Define versioned word/sentence/line counting rules and their
  abbreviation/punctuation limits. Flag uncertain cases for review.
- [ ] [Human] Review factual claims embedded in prose that structured-field checks
  cannot establish; assess automated factual-review performance before relying on it.
- [ ] [Engineering] Route failed content to its responsible module with bounded retries.
- [ ] [Engineering] Revalidate after repairs and rerun dependent stages when schedules change.
- [ ] [Engineering] Cache creative outputs and retain prompts, model versions, responses, and revisions.
- [ ] [Engineering] Block final export when required checks fail; expose actionable review status.

Progress: No model calls or writing-quality evaluations have been performed.
The source's AI favorite selection remains the proposed approach. Structural
validation is deterministic; prose factual fidelity and writing quality require
human-calibrated review and cannot be established by a model score alone.

## 5. Connect the user and PayPal sandbox workflow

Generation produces canonical approved content independently of payment. Commerce
unlocks date ranges; it must not change the underlying entries. See the
[application proposal reconciliation](docs/ASTRO-ORACLE-application-decisions.md).

- [ ] [Human] Resolve full-month generation versus a seven-day MVP; define rank
  scope and partial-export validation without weakening canonical coverage checks.
- [ ] [Human] Define the free-week anchor, reset rules, purchase overlap behavior,
  and inclusive/exclusive boundaries for daily, weekly, monthly, and yearly access.
- [ ] [Human] Confirm the proposed $0.22/$1.11/$4.44/$33.33 catalog and which products
  ship; define a paid demo range distinct from dates already free.
- [ ] [Calculation] Implement entitlement date arithmetic with known results for
  leap years, month ends, overlapping ranges, and timezone changes.
- [ ] [Engineering] Model orders, captures, entitlements, canonical calendar versions,
  and jobs separately, with ownership and database uniqueness constraints.
- [ ] [Engineering] Enforce free/paid access server-side for API content and ICS
  exports; locked entries must not leak through client payloads.
- [ ] [Engineering] Limit unpaid generation requests and reuse approved datasets;
  expose unavailable future dates separately from purchased access.
- [ ] [Human] Define refund/reversal access policy and explain that downloaded
  static calendars cannot be recalled.
- [ ] [Engineering] Verify and reconcile sandbox payment notifications, refunds,
  and reversals according to the selected access policy.

- [ ] [Engineering] Build input upload, preferences, validation report, and product preview screens.
- [ ] [Engineering] Integrate sandbox checkout with server-side payment verification.
- [ ] [Engineering] Associate confirmed purchases with immutable product/date ranges and grant
  entitlements independently of generation-job state.
- [ ] [Engineering] Handle repeated notifications and interrupted checkout without duplicate charges or jobs.
- [ ] [Engineering] Add independent generation progress, failure messages, and retries that preserve
  existing purchases and entitlements without charging again.
- [ ] [Engineering] Deliver validated ICS through an access-controlled result page and repeat download.
- [ ] [Engineering] Show sandbox status clearly and keep credentials out of client code and logs.
- [ ] [Human] Define personal-data retention, deletion, and artifact access controls.
- [ ] [Human] Review the journey for readability, keyboard access, and mobile use.

Progress: On 2026-11-04, incorporated the expanded application proposal into this
backlog. Canonical generation is separate from payment; the new free-week/catalog
proposal replaces the earlier $5 payment-first flow as the planning direction.
Pricing, period semantics, and MVP generation scope still need decisions. No payment
behavior, web interface, or external integration has been verified.

## 6. Validate the complete result

- [ ] [Engineering] Check parser output against manually reviewed source and natal fixtures.
- [ ] [Calculation] Verify hand-worked score cases, including overlapping priorities,
  normalized feature bounds, constant-feature removal, and deterministic ties.
- [ ] [Calculation] Compare solver results with exhaustive enumeration on small
  cases, including a case where greedy assignment loses to the global optimum.
- [ ] [Calculation] Verify insufficient total candidates and sufficient total candidates
  with impossible local coverage both produce an infeasible result.
- [ ] [Engineering] Test leap February, daylight-saving changes, month edges, ties, and infeasible coverage.
- [ ] [Calculation] Check 359°/1° angular wraparound, exact aspect angles, tolerance
  boundaries, whole-sign house wraparound, and Sabian indices at 0° and just below
  30°. Reject within-sign 30°; verify lucky-number range, uniqueness, and replay.
- [ ] [Engineering] Test invalid inputs and conflicting UIDs with expected error reports.
- [ ] [Engineering] Verify complete coverage, unique ranks, preserved facts, favorites, and word/line limits.
- [ ] [Engineering] Round-trip exported ICS; compare event count, dates, UIDs, and
  descriptions against the validated entries.
- [ ] [Human] Import the ICS into named target clients; record all-day display,
  exact-time readability, and behavior when importing a revised calendar.
- [ ] [Human] Review a full representative month for usefulness, specificity, natural
  rhyme, and prose factual fidelity. Record rubric results and unresolved examples;
  do not require exact generated-string matches or accept AI scores as proof.
- [ ] [Engineering] Verify sandbox payment success, rejection, duplicate notifications, failed generation,
  retry, and interrupted download scenarios.
- [ ] [Engineering] Measure generation time and cost against the chosen limits.
- [ ] [Human] Review recorded results and resolve blocking findings before claiming a working prototype.

Progress: Documentation coverage and whitespace checks passed on 2026-11-04.
Those checks do not establish application correctness or integration readiness.
On 2026-11-04, clarified calculation/engineering/AI/human responsibilities and
added acceptance criteria; mathematical examples and evaluation tasks remain
unexecuted.

## 7. Prepare the hackathon submission

- [x] [Human] Replace generic hackathon-heavy README content with accurate product
  status, high-level architecture, setup, usage, and limitations; omit ranking math.
- [ ] [Human] Provide a working demo through reproducible local instructions or a hosted URL.
- [ ] [Human] Confirm the public repository contains required source, permitted assets,
  dependencies, and accurate license information.
- [ ] [Human] Explain how AI and PayPal each contribute to the functioning product.
- [ ] [Human] Record a public demo video under three minutes showing the actual workflow.
- [ ] [Human] Prepare submission text, tool disclosures, and known limitations.
- [ ] [Human] Recheck current official submission requirements before submission.
- [ ] [Human] Complete submission when authorized and verify its links and access.

Progress: On 2026-11-04, replaced generic hackathon copy with an accurate README
for the implemented calculator and planned oracle service, without ranking formulas
or parameter values. Detailed source documents still contain proposed formulas;
README editing alone does not conceal those files or Git history. Local HTTP and
automated calculator checks passed previously; no hosted demo, video, or submission
has been verified. Publishing and submission remain separate authorized actions.

## Future priorities

- [ ] [Human] Evaluate richer chart-context scoring after baseline ranking is reviewed.
- [ ] [Human] Evaluate additional house/zodiac systems and event types with adequate fixtures.
- [ ] [Human] Decide whether LUNAR belongs in a later product milestone; resolve its separate
  window, funding, transfer, issuance, platform, and fee decisions before building it.

These are deferred until the core calendar prototype works. Calendar purchases
have no established token-spending rule. A live-money launch is outside the
initial sandbox prototype.

## Blockers and decisions

- **New source:** [Application architecture and detailed pseudocode](docs/ASTRO-ORACLE-application-architecture-source.md),
  supplied 2026-11-04, preserved verbatim. See reconciliation notes for conflicts.
- **Scope conflict:** Existing full-month generation versus new seven-day MVP;
  resolve before implementing coverage, ranks, and favorite behavior.
- **Commerce decisions:** Free-week anchor, product-period boundaries, paid demo
  range, refund policy, and unpaid generation limits remain open.
- **Database proposal:** Evaluate PostgreSQL from the new application proposal;
  the earlier SQLite suggestion is an alternative, not an adopted stack.

- **Input dependency:** Both November ICS files are available. Full natal-chart
  information is still needed for facts the raw export omits. Treat both source
  files as potentially personal data rather than automatically public fixtures.
- **Content dependency:** Final formatting and a distributable verified Sabian table
  remain unresolved.
- **Open decisions:** Proposed stack, scoring defaults, model, pricing, and operating
  limits need evaluation or approval; see the proposed answers document.
- **Decision:** 2026-11-04 — BARTR is unrelated; project identity is Astro Oracle.

Deployment progress — 2026-11-04: Published commit `be90b10` to `main`, switched
Pages from root-branch publishing to GitHub Actions, and enabled deployment on site
changes. Run 41920645150 succeeded. Public HTML, app.js, and birth.js matched the
local source byte-for-byte. Live URL: https://archipelagoing.github.io/astro-oracle/.
The personal raw Astro-Seek file remains outside this publication commit. Browser
click-through verification is still pending.

Weekly card deployment — 2026-11-04: Commit `3cf4cbf` deployed successfully in
Actions run 41921926052. Live HTML and calendar.js match the source. All 30 completed
sample entries pass fortune/meaning/rank extraction and date-grouping checks.
Calculated/raw entries show unranked candidates, not invented fortunes. Native
Chrome inspection timed out; visual/click-through QA remains unverified.

Calculation-flow fix — 2026-11-04: Observed the previous Calculate action being
blocked by an easy-to-miss confirmation prerequisite. Calculate now opens an
explicit confirmation dialog and Confirm & calculate starts the worker. Added
an application-wiring regression test covering visible cards and flip/back.
Removed external font loading. Browser inspection remains unreliable; this fix
is verified by application-flow, birth, parser, and calendar checks.
