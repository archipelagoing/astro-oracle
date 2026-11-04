# Astro Oracle — Calendar Rules

Status: proposed specification. Exact final formatting awaits an owner-supplied example.

Implementation planning: [open questions](ASTRO-ORACLE-implementation-questions.md) and [proposed answers and defaults](ASTRO-ORACLE-proposed-answers.md). These supplements do not establish owner approval for new choices.

## Inputs and output

Inputs: Astro-Seek ICS, natal chart, target month, timezone, house and zodiac systems, and preferences. Inspect an actual export before assuming fields exist.

Output: one all-day oracle event per date of the target month. Keep the featured date separate from the exact transit timestamp.

## Required entry content

- Primary transit and optional supporting transits.
- Unique global importance rank, based on significance rather than chronology.
- Two-line rhyming fortune, faithful to the interpretation.
- Two-sentence interpretation, actionable and at most 12 words per sentence.
- Concise activated-house descriptions and specific natal connection.
- Verified Sabian symbols, retaining edition and original wording; identify paraphrases.
- Three distinct symbolic lucky numbers from 1 to 31.
- Weekly-favorite marker and explanation when applicable.
- Actual exact transit time and timezone.

Interpretations are symbolic reflections, not factual predictions. Lucky numbers promise no outcomes.

## Fixed formatting

Use a versioned template with fixed labels, section order, line breaks, and structural constraints. AI fills designated fields; code renders and validates the result.

The exact calendar title and description layout, punctuation, symbols, spacing, and optional-section behavior remain pending an owner-supplied example. Do not treat an invented layout as approved.

## Pipeline

Filler (parse) → Ranker → Filler (interpret) → Number → Rhymer → Editor → ICS export.

Five specialists share structured records; Filler runs twice. They can be modules in one application.

1. **Filler / parse — deterministic:** Parse ICS, preserve source UID, normalize timezones, validate positions/aspects, calculate houses, deduplicate. Flag missing facts instead of inventing them. Quadrant houses require actual cusps and adequate birth data.
2. **Ranker — deterministic:** Score using configurable natal, body, aspect, and chart-context weights. Track source confidence separately from exactness. Use maximum-weight assignment for one primary transit per day, with configurable neighboring-day limits and shift penalties. Each transit is primary at most once. Preserve actual exact times. Apply deterministic tie-breaking. Flag insufficient coverage or use an explicitly approved fallback; never invent natal aspects.
3. **Filler / interpret — AI:** Write interpretations and natal/house explanations from selected immutable records. Never alter dates, degrees, aspects, or house numbers.
4. **Number — mostly deterministic:** Sabian index is floor(degrees within sign) + 1. Retrieve verified symbols. Generate three distinct numbers reproducibly using relevant houses, date, degree, and a documented fallback. Select one favorite per Monday-based calendar week represented in the month, with an explanation; it need not be highest-ranked.
5. **Rhymer — AI:** Generate alternatives and choose a meaningful two-line rhyme. Avoid forced rhyme, awkward syntax, generic reassurance, and unsupported predictions.
6. **Editor — hybrid:** Enforce hard constraints and review coherence, usefulness, rhyme, specificity, and clarity. Route structured feedback to the responsible module. Ranking repairs rerun downstream steps. Revalidate after every repair. AI approval cannot override failed hard rules. Bound retries; unresolved problems require human review.
7. **Exporter — deterministic:** Export validated content using an iCalendar library.

## Shared data and reproducibility

Maintain structured NatalProfile, Transit, and DailyOracle records as detailed in the architecture source. Source records are immutable after validation. Retain source IDs, scores, scheduling decisions, creative outputs, and validation status.

Save scored-transit, schedule, and final-entry JSON alongside the ICS. Illustrative ranking weights in the source are configurable proposals, not objective laws.

## ICS and validation rules

- Exactly one event per date and correct month length, including leap years.
- All-day DTSTART with exclusive DTEND on the following date.
- TRANSP:TRANSPARENT so entries do not block availability.
- Stable UID from calendar identity and featured date.
- Preserve exact transit timestamp in the description; distinguish it from any shifted featured date.
- Include generation/version information for auditing.
- Proposed source title: optional favorite star, importance rank, transit title. Final format awaits approval.
- Test target calendar imports; stable UIDs do not guarantee identical update behavior in every client.
- Validate coverage, unique ranks, unchanged source facts, timestamps, symbols, distinct valid numbers, required sections, weekly favorites, sentence/line limits, template conformity, and ICS validity.
- Publish only after all required checks pass.

## Payments and LUNAR

Calendar generation and LUNAR are separate specifications. No token spending rule, exchange rate for readings, or subscription is established here. PayPal sandbox may demonstrate calendar purchases; it does not imply custom-token support.

See [LUNAR rules](LUNAR-rules.md) and [the original architecture proposal](ASTRO-ORACLE-architecture-source.md).

## Build sequence

1. Parsing, ranking, Sabian lookup, and ICS export.
2. Interpretations, rhymes, and weekly favorites.
3. Editorial repairs, caching, reproducibility, and the owner-approved fixed template.
