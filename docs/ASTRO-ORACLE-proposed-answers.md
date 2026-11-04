# Astro Oracle — Proposed Implementation Answers

This document answers the [implementation questions](ASTRO-ORACLE-implementation-questions.md) with a coherent prototype plan. **Every new choice below is a proposal, not an approved change to the source specifications.** Existing calendar and LUNAR rules take precedence until explicitly revised.

Some questions require artifacts or owner decisions that are not in the repository. Those are identified as **pending** rather than presented as settled facts. No application, payment integration, verified dataset, or completed calendar is supplied by this document.

## 1. Inputs and finished output

**1.1 — Source file.** Pending: obtain a real Astro-Seek export and a sanitized fixture that may be committed. Inspect its properties before writing its adapter. Initially accept only explicitly recognized natal-aspect events with the required bodies, positions, aspect, source identity, and exact timestamp. Report unsupported events separately. Do not infer missing degrees from event titles unless a tested source-format rule supports that extraction.

**1.2 — Natal chart.** Propose a versioned JSON input containing timezone, zodiac system, house system, natal body positions, Ascendant, and an explicit chart-ruler field. Start with tropical, whole-sign houses. Require birth-data provenance or confirmation that the supplied chart is authoritative. Accept no silent defaults for unknown positions or timezone. A sanitized natal fixture is pending.

**1.3 — Finished entry.** Owner approval remains pending. Use the following only as a reviewable draft template; placeholders are not a valid generated entry. Store approved templates with a version identifier.

```text
TITLE: [optional ⭐ ]([importance rank]) [primary transit]

Fortune:
[rhyming line 1]
[rhyming line 2]

Meaning:
[sentence 1, at most 12 words] [sentence 2, at most 12 words]

Houses: [concise activated-house descriptions]
Natal connection: [specific explanation]
Sabian symbols: [positions, edition, and verified wording]
Lucky numbers: [n1], [n2], [n3]
[Weekly favorite: explanation — include only for favorites]
Featured date: [YYYY-MM-DD]
Exact transit: [timestamp with UTC offset and named timezone]
[Supporting transits: descriptions and exact timestamps — omit if none]
```

**1.4 — Invalid inputs.** Preserve the original file. Produce a structured report identifying the record, field, and issue. Collapse identical repeated UIDs; reject conflicting records sharing a UID. Quarantine incomplete or ambiguous events and show their exclusion before payment. Block generation if required natal data is missing or the remaining eligible events cannot cover the month. Never invent replacement facts.

## 2. Ranking mathematics

**2.1 — Score definition.** Use three normalized features initially:

```text
S(t) = 0.50 N(t) + 0.30 P(t) + 0.20 A(t)
```

Each lookup weight below is on a 0–10 scale; multiply it by 10 to obtain a 0–100 feature. N means natal-target priority, P means transiting-body priority, and A means aspect priority. These express product preferences, not measured astrological truth. Unsupported values fail configuration validation.

**2.2 — Starting weights.** Propose the following complete tables for the initial supported set:

| Feature | Raw weights |
|---|---|
| Natal target N | Chart ruler 10; Sun/Moon/Ascendant/MC 9; IC/Descendant/Mercury/Venus/Mars 7; Jupiter/Saturn 6; Uranus/Neptune/Pluto 5 |
| Transiting body P | Pluto/Neptune/Uranus 10; Saturn 9; Jupiter 8; Mars 6; Sun/Mercury/Venus 5; Moon 3 |
| Aspect A | Conjunction/opposition 10; square 9; trine 7; sextile 6 |

These defaults favor slower transits and challenging major aspects; calibrate them against reviewed example months before claiming they suit a user's preferences.

**2.3 — Overlap.** For N, take the maximum applicable weight rather than adding weights. A Moon that is also the chart ruler receives 10. Use the explicit chart-ruler input until a rulership convention is agreed.

**2.4 — Constant and uncertain features.** Omit exactness from the initial score because supported events represent exact source events. Do not add chart-context scoring until it has a defined rule. Track parsing confidence and independent verification status separately; only records passing required validation are eligible. This proposed three-feature formula replaces the illustrative five-feature formula only if adopted.

**2.5 — Ties.** Rank equal scores by exact UTC timestamp, then stable transit ID. Quantize scores to integer hundredths for optimization. Among assignments with equal total objective, choose the lexicographically smallest chronological sequence of transit IDs as a secondary objective, without changing the primary objective.

## 3. Calendar assignment

**3.1 — Window and penalty.** Propose a maximum offset of one local calendar day and a penalty of 5 score points per shifted day. Optimize the whole month:

```text
maximize Σ (S(t) − 5 × |featured_date − exact_local_date|) × x[t,d]
subject to:
  exactly one primary transit per target date;
  each transit is primary at most once;
  x[t,d] exists only when the date offset is at most one day.
```

Date differences are calendar-day differences, not elapsed 24-hour intervals. Penalty and window are configurable and recorded; the defaults need calibration.

**3.2 — Month edges.** Permit source events from one day before and after the month. Require the input to provide sufficient boundary coverage or report the missing coverage. Export events only for target-month dates.

**3.3 — Coverage gaps.** Run a feasibility check before paid generation. An adequate total event count alone does not guarantee coverage. Return uncovered constraints and request additional source data or an explicit settings change. No lunar or other fallback is enabled by default.

**3.4 — Visible rank.** Rank selected primary transits using original S(t), with the tie-breakers above. Shift penalties affect placement only. Assign contiguous unique ranks from 1 through the number of days in the month.

**3.5 — Supporting events.** Select at most two other validated transits exact on the featured local date, ordered by score and the same tie-breakers. A supporting event may be primary elsewhere; label its exact date clearly. This initial objective rule avoids an undefined thematic-similarity threshold.

## 4. Astronomical validation

**4.1 — Supported scope.** Initially support Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto as transiting bodies. Natal targets additionally include Ascendant, MC, IC, and Descendant. Support conjunction, sextile, square, trine, and opposition; tropical zodiac and whole-sign houses only. Reject unsupported configurations explicitly.

**4.2 — Geometry and boundaries.** For absolute longitudes a and b in degrees:

```text
δ = abs(((a − b + 180) mod 360) − 180)
residual = abs(δ − aspect_angle)
aspect_angle ∈ {0, 60, 90, 120, 180}
whole_sign_house = ((transiting_sign_index − ascendant_sign_index) mod 12) + 1
```

Require within-sign degrees in [0, 30), mapping signs to indices 0–11. Keep sufficient numeric precision; do not silently round 29.999… into the next sign. Define geometric tolerance from the documented precision of each input: at minimum, account for both longitude rounding errors and any timestamp/computation error. Pending: sample inspection and the independent-calculation choice must establish numeric tolerances. Preserve supplied retrograde flags; infer motion only from adequate time-separated position data. Retrograde status does not change angular-distance arithmetic.

**4.3 — Time.** Preserve the original timestamp and its timezone metadata, store a normalized UTC instant, and derive dates using the user's IANA timezone. Reject ambiguous floating times unless an explicit source-timezone rule resolves them. Use timezone-aware conversions across daylight-saving transitions. Export featured events as all-day dates with exclusive next-day ends.

**4.4 — Disagreement.** Keep source and calculated values separately. Flag discrepancies exceeding the documented tolerance, exclude affected records, and require resolution before export. Never silently overwrite source positions or claim independent verification when it was not performed.

## 5. Reference data and symbolism

**5.1 — Sabian symbols.** Pending: select a distributable edition and verify permission or applicable licensing. Store all 360 entries with sign, index, edition, exact wording, and provenance. Block final export if required verified symbols are unavailable; do not fill gaps with model-generated quotations. Index = floor(within-sign degrees) + 1.

**5.2 — Astronomy source.** Pending technical selection: evaluate a maintained ephemeris library, its data files, license, coordinate conventions, and supported calculations against the actual source export. Pin the selected versions and document tolerances. Do not substitute an unverified provider choice for this evaluation. The first parser can validate internal source geometry, but must label that separately from independent ephemeris verification.

**5.3 — Lucky numbers.** Build an ordered list from transiting house, natal-target house, featured day of month, and the primary transiting position's Sabian index. Keep the first occurrence of each integer in 1–31. If fewer than three remain, calculate SHA-256 over UTF-8 `lucky-v1|calendar_id|featured_date|transit_id|counter`, starting counter at 0. Interpret each digest as an unsigned big-endian integer; take `(integer mod 31) + 1`, skipping duplicates until three numbers exist. Return the first three. This is symbolic and reproducible, not a claim about winning probabilities.

**5.4 — Favorites.** Group target-month dates by the Monday starting their local calendar week, including partial weeks. AI chooses exactly one entry in each group using symbolic coherence, practical usefulness, and specificity, and supplies an explanation. Validate that the chosen date belongs to the group. Cache the choice; use the bounded repair process on invalid output rather than silently choosing the highest score.

## 6. Editing and failure handling

**6.1 — Passing criteria.** All calendar-rule hard checks must pass: complete daily coverage, unique primaries and ranks, unchanged source facts, preserved times, valid symbols and numbers, required fields, exactly one favorite per represented week, two fortune lines, and two meaning sentences of at most 12 words each. Define word counting as whitespace-separated tokens after trimming; version the sentence-counting rule and test abbreviations. For a proposed AI rubric, score coherence/usefulness/rhyme/specificity/clarity using the source's 30/25/20/15/10 allocation. Require at least 80/100 and no category below half its maximum. Scores are editorial judgments; calibrate them with human examples. AI scores never override hard failures.

**6.2 — Repairs.** Route source failures to input resolution, coverage and ranking failures to Ranker, interpretation failures to Filler, symbols/numbers/favorites to Number, and rhyme failures to Rhymer. Rerun dependent stages after changed inputs or scheduling. Allow at most two repair rounds per generation job; revalidate after every round. Exhaustion marks the job as requiring review. Missing source facts and unavailable reference data are blockers, not creative repair tasks.

**6.3 — User outcome.** Display a clear status and actionable error report. Retain intermediate artifacts for review, but provide a downloadable final ICS only after all checks pass. For failed paid sandbox jobs, offer a retry using the existing purchase record. Do not imply a refund has occurred unless a confirmed refund flow exists.

## 7. Implementation and evaluation

**7.1 — Stack.** Propose Python 3.12+, typed validation models, an iCalendar library, and a maximum-weight matching or min-cost-flow solver. Start with a CLI accepting source ICS, natal JSON, month, and preferences; add a minimal web interface and Python API for the hackathon purchase flow. Put model access behind an interface for schema-validated generation and review. Provider/model selection remains pending a small quality-and-cost trial. Use SQLite for local job/payment metadata and per-job artifact directories for the single-instance prototype. Pin dependencies after selection.

**7.2 — Evaluation.** Commit sanitized fixtures covering February in a leap year, a daylight-saving transition, month edges, duplicate/conflicting UIDs, insufficient assignment coverage, equal scores, and degrees near sign boundaries. Assert expected parser facts, assignments, symbol indices, and ICS round trips. Manually import an exported file into target calendar clients and record results. Have the owner review a representative month for specificity, usefulness, and natural rhyme. Evaluate writing against the rubric rather than exact model-generated strings.

**7.3 — Audit trail.** Save source hashes, immutable parsed records, input/config/template/reference versions, score components, assignments and offsets, model identifiers, prompts, responses, repair history, validation reports, and final JSON/ICS. Use stable event UIDs derived from calendar identity plus featured date. Record generation time and export revision. Deterministic stages should replay exactly; archived AI responses support replay, while fresh model calls may differ even with matching settings.

**7.4 — Operating limits.** Batch generation, cache by versioned inputs, record token usage, and enforce a per-job request and spending cap before starting. Set timeouts and surface resumable job status. Select actual budget and latency targets after a trial month. Keep credentials in server-side environment configuration; exclude secrets and personal birth data from Git and routine logs. Restrict artifact retrieval to the owning session/account and define retention/deletion settings before a hosted demonstration.

## 8. Hackathon purchase experience

**8.1 — Product.** Demonstrate one personalized monthly calendar purchased through PayPal sandbox for a proposed simulated price of $5 USD. Clearly label the sandbox environment. Payment buys the calendar generation/delivery workflow; AI meaningfully produces its interpretations, fortunes, and editorial review.

**8.2 — Sequence.** Upload inputs → validate facts and scheduling feasibility → show month, product, and sandbox price → complete sandbox checkout/capture → verify payment server-side → enqueue generation → show progress → deliver validated ICS and an entry preview. Exact SDK/API selection and request shapes require implementation-time verification against official PayPal documentation.

**8.3 — Reliability.** Associate a unique purchase record with an immutable generation request. Verify amount, currency, product, and completed payment status before starting a job. Use idempotency and unique identifiers so repeated callbacks or notifications cannot create duplicate captures or jobs. Never trust a client-side success flag alone. Reconcile interrupted payment attempts with the payment service before retrying capture. Retrying a failed job reuses its confirmed purchase. Provide an authenticated result page for later download; status tracking must not depend on keeping a tab open.

**8.4 — LUNAR.** Keep it outside the calendar purchase path for this prototype. Do not add a token exchange rate, token spending rule, subscription, or redemption promise. Its transaction window, astronomy source, sale mechanism, transfer restrictions, issuance, fees, platform, and controls remain separate decisions in the LUNAR specification.

## Decisions that still need evidence or owner input

- Actual source export and natal-chart fixture: 1.1–1.2.
- Final entry-template approval: 1.3.
- Ranking/window defaults and writing acceptance calibration: 2–3 and 6.1.
- Numeric validation tolerances and independently verified ephemeris stack: 4.2 and 5.2.
- Distributable, verified Sabian edition/table: 5.1.
- Model selection, operating budget, retention settings, and sandbox product price: 7–8.

All questions have an answer or an explicit resolution path here. The pending items remain open; this file does not represent their approval or completion.
