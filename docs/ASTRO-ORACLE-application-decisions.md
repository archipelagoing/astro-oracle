# Astro Oracle — Application Reconciliation Notes

The [new application proposal](ASTRO-ORACLE-application-architecture-source.md)
expands the [original pipeline](ASTRO-ORACLE-architecture-source.md). This records
its implications and unresolved choices without treating all recommendations as
approved. No implementation has been executed.

## Updated architectural direction

- Keep the five specialists as modules. Add a natal-profile engine, commerce,
  entitlement enforcement, and calendar presentation around the pipeline.
- Store approved canonical entries independently of purchases. Payment grants
  access to dates; it does not determine rankings or rewrite fortunes.
- Validate feasibility before generation. Bound generation cost even when a user
  has not purchased access. A purchase and a generation job have separate states.
- Enforce authorization server-side on both content retrieval and export. Locked
  content must not appear in API payloads or previews accessible without entitlement.
- Begin with uploaded natal charts. Automatic birth-chart calculation is deferred.
- Treat PostgreSQL as the new proposed database choice, superseding the earlier
  SQLite suggestion for planning purposes; stack adoption still needs evaluation.

## Commerce proposal and questions

The new catalog proposes USD $0.22 daily, $1.11 weekly, $4.44 monthly, and $33.33
yearly, plus a free first seven days. Purchases are one-time date access, not
recurring subscriptions. These replace the earlier illustrative $5 monthly price
as the current proposal, not a confirmed live offer. Use sandbox for the prototype.

Resolve before implementation:

- What anchors the free seven days: signup date, chosen start date, or a generated
  calendar? Can users reset it by changing chart, month, or timezone?
- Are paid monthly/yearly periods calendar-aligned or rolling? Define date
  intervals explicitly, preferably start-inclusive/end-exclusive, including leap
  years and starts near month ends. Define overlap and duplicate purchases.
- Does the weekly MVP pass unlock a second week after the free week, or another
  explicitly selected range? Demonstrate genuinely locked dates becoming unlocked.
- Which catalog products actually ship in the MVP? The proposal lists all four,
  but its implementation priorities only require the weekly pass.
- What should refunds/reversals do to future access? Previously downloaded static
  ICS files cannot be recalled; communicate that limitation.
- Which generation requests are allowed without purchase, with what limits? Free
  access does not imply unlimited free monthly regeneration.

## Generation scope and ranking conflict

The existing calendar rules require a full canonical month and monthly global
ranks. The new MVP asks for seven correct entries. Choose explicitly between:

1. Generate and validate the full canonical month, show its first seven free days,
   and export only entitled dates. Ranks remain monthly, even in a partial export.
2. Approve a separate seven-day generation mode with explicit ranking scope,
   coverage rules, and favorite behavior. Do not call seven-day ranks monthly ranks.

Until that choice changes the specification, preserve full-month canonical
validation. Export validation checks the authorized requested subset, not a full
month count. Never fabricate missing future data to satisfy a yearly entitlement.

## Math and AI boundaries retained

The new five-feature score is illustrative; it does not resolve normalization,
chart-emphasis definitions, constant exactness, or tie-breaking. The earlier
three-feature formula remains a competing proposal until a score specification
is selected. Neither formula establishes predictive accuracy.

## Later user direction: built-in calculation and GitHub Pages

On 2026-11-04, the user requested built-in transit calculation so Astro-Seek upload
is optional, plus a secondary Astro-Seek action. This supersedes deferring all
automatic planetary natal calculation: the initial browser calculator derives
natal planetary positions from an explicit birth instant. Full birthplace/house
calculation remains unfinished. Both input paths should eventually produce the
same validated candidate schema for the canonical pipeline.

The supplied November ICS is a completed output reference. It does not replace
the need for a raw Astro-Seek fixture. See the [calculator implementation and
hosting notes](ASTRO-ORACLE-github-pages.md). Pages hosts the free static calculator;
commercial services, secret keys, AI generation, and payment verification require
appropriate separate infrastructure.

Keep astronomical geometry, houses, scoring, assignment, Sabian indexing, lucky
numbers, week grouping, and entitlement date arithmetic deterministic. AI writes
interpretations and fortunes and may judge symbolic favorites. AI editorial
scores require human calibration and cannot override hard checks.

Validate absolute longitudes before using modulo; modulo normalization must not
hide invalid or non-finite inputs. Keep original source values and independently
derived/enriched values distinct, with provenance. Specify chart-ruler convention.

## Pseudocode issues to resolve in implementation

- Give entries stable IDs scoped to calendar/profile version and date. A transit
  ID alone is insufficient across different generated calendars or versions.
- Add explicit ownership, generation scope, version, and uniqueness constraints
  to canonical records; prevent one user's chart or purchase from serving another.
- Authenticate purchase handlers and verify order ownership, expected payee,
  amount, currency, capture status, and unique capture identity. Use runtime
  validation rather than Python `assert` for payment security.
- Capture/reconciliation must be idempotent outside the database grant transaction
  too. Retrying an interrupted request must not blindly recapture a paid order.
- Repair functions must return the updated dataset. Recompute hard errors after
  repairs and rerun affected downstream stages; finish with deterministic validation.
- Define natal-chart input keys consistently: the sample requires `ascendant`
  but reads it under `angles`. Do not implement contradictory field paths.
- Support natal Sabian symbols when a target longitude exists, retaining edition
  and original wording. Specify behavior when a supported event lacks a target.
- Preserve the existing two-sentence, 12-words-per-sentence rule; the newer prose
  says only “concise” and does not explicitly revoke that limit.
- Stable ICS identity needs calendar identity, not just user and date. Distinguish
  different charts/calendars while keeping revisions of the same event stable.

## Earlier planning documents

The [proposed answers](ASTRO-ORACLE-proposed-answers.md) remain useful for detailed
defaults, but their payment-before-generation sequence, $5 price, and SQLite
choice are historical alternatives where this new proposal differs. Resolve
open decisions here and in the checklist before coding; do not silently combine
incompatible flows.
