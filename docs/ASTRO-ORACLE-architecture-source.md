# Astro Oracle — Original Architecture Proposal

Preserved as supplied. Design prose and pseudocode, not executable implementation. Exact owner-approved entry formatting remains pending.

Companion planning documents: [implementation questions](ASTRO-ORACLE-implementation-questions.md) and [proposed answers](ASTRO-ORACLE-proposed-answers.md). The original proposal below is preserved; companion defaults are not approved requirements.

```text
✧ Astro Oracle — Five-Agent Architecture

The most efficient order is:

Filler → Ranker → Filler → Number → Rhymer → Editor → ICS Export

You have five specialists, but Filler runs twice. Its first pass extracts facts; its second pass writes interpretations for the selected transits.

The most important architectural rule is that Ranker controls which transit appears on each date, while Editor controls whether the final content is good enough to publish.

1. Complete system architecture

INPUT

Astro-Seek ICS · Natal chart · Month · User preferences

1. FILLER — Parse

Python

Extract events, validate source degrees, calculate houses, identify natal relationships.

2. RANKER

Python

Build natal priority weights, score candidates, assign one featured transit per date, rank globally.

3. FILLER — Interpret

AI

Write the two-sentence meaning, house descriptions, and natal connection for each selected transit.

4. NUMBER

Hybrid

Retrieve exact Sabian symbols, derive three lucky numbers, choose and explain weekly favorites.

5. RHYMER

AI

Generate and select a two-line rhyming fortune faithful to each meaning.

6. EDITOR

Hybrid

Validate all factual constraints, score writing quality, and route failed entries to their responsible specialist.

ICS EXPORT

One all-day fortune per date · Exact transit times preserved

2. Shared data model

All five specialists should operate on the same structured objects, rather than passing unstructured prose between agents.

class NatalProfile:
    birth_chart: dict
    house_system: str
    zodiac_system: str
    timezone: str
    planet_weights: dict
    chart_ruler: str
    angles: dict
class Transit:
    id: str
    exact_datetime: datetime
    transiting_body: str
    transiting_sign: str
    transiting_degree: float
    natal_target: str | None
    natal_sign: str | None
    natal_degree: float | None
    aspect: str
    transiting_house: int | None
    natal_house: int | None
    source_uid: str
    score: float
class DailyOracle:
    featured_date: date
    primary_transit: Transit
    supporting_transits: list[Transit]
    importance_rank: int
    fortune: str
    meaning: str
    houses_activated: str
    natal_connection: str
    sabian_symbols: dict
    lucky_numbers: list[int]
    weekly_favorite: bool
    favorite_explanation: str | None
    validation_status: str

Crucially, exact_datetime and featured_date are separate. This allows the system to feature a significant transit on a neighboring day without falsely claiming it became exact then.

3. FILLER — First pass: parse the source

This pass should use no AI.

def filler_parse(ics_file, natal_chart, config):
    raw_events = parse_icalendar(ics_file)
    profile = build_natal_profile(
        natal_chart,
        house_system=config.house_system,
        zodiac_system=config.zodiac_system
    )
    candidates = []
    for event in raw_events:
        if not is_supported_transit(event):
            continue
        transit = parse_transit_fields(event)
        # Preserve the original source record.
        transit.source_uid = event.uid
        transit.exact_datetime = convert_timezone(
            event.start, profile.timezone
        )
        # Verify rather than silently overwrite source values.
        validate_zodiac_positions(transit)
        validate_aspect_geometry(transit)
        transit.transiting_house = calculate_house(
            transit.transiting_sign,
            transit.transiting_degree,
            profile
        )
        if transit.natal_target:
            transit.natal_house = lookup_natal_house(
                transit.natal_target, profile
            )
        candidates.append(transit)
    return profile, deduplicate_by_source_uid(candidates)

For whole-sign houses, the house can be calculated from the difference between the Ascendant sign and the transiting sign. For quadrant houses, actual house cusps and birth information are needed.

If the source lacks a required value, Filler should flag it rather than invent it.

4. RANKER — Natal importance and calendar optimization

This is the most algorithmically interesting component.

A. Build the natal ranking

Start with a configurable scoring profile. Here’s an illustrative weighting scheme, not an objective astrological law.

Natal target	Base weight
Chart ruler	10
Sun / Moon	9
Ascendant / MC	9
Other natal personal planets	7
Jupiter / Saturn	6
Outer planets	5
IC / Descendant	7

Then adjust for the user’s chart-specific emphasis. For example, a planet that rules the Ascendant can receive additional importance, without double-counting the same criterion.

B. Score every transit

S(t)=0.35N(t)+0.25P(t)+0.20A(t)+0.15E(t)+0.05C(t)

Where all five features are normalized to 0–100:

* : natal target importance.
* : transiting body importance.
* : aspect-type weight.
* : exactness or source confidence.
* : chart-specific relevance.

Because Astro-Seek’s exact-aspect entries are already exact, may be identical across many candidates. In that case, it should not artificially influence the ranking. Source reliability and whether an event is exact versus approximate should be tracked separately.

C. Optimize one transit per date

Your redistribution rule is better implemented as a maximum-weight assignment problem, not a sequence of greedy swaps.

def ranker_schedule(candidates, month, config):
    dates = every_date_in_month(month)
    # Candidate can be featured on its exact date,
    # or within an explicitly allowed neighboring window.
    eligible = {}
    for transit in candidates:
        for day in dates:
            offset = abs(
                (day - transit.exact_datetime.date()).days
            )
            if offset <= config.max_feature_offset_days:
                penalty = offset * config.date_shift_penalty
                eligible[(transit.id, day)] = (
                    transit.score - penalty
                )
    # Binary decision x[t, d]:
    # 1 if transit t is featured on date d.
    model = create_integer_optimization_model()
    x = create_binary_variables(eligible)
    for day in dates:
        model.add_constraint(
            sum(x[t, day] for t in eligible_for(day)) == 1
        )
    for transit in candidates:
        model.add_constraint(
            sum(x[transit.id, day]
                for day in eligible_dates(transit)) <= 1
        )
    model.maximize(
        sum(eligible[t, day] * x[t, day]
            for (t, day) in eligible)
    )
    solution = model.solve()
    if not solution.feasible:
        raise InsufficientTransitCoverage(
            "Cannot cover every date under current constraints"
        )
    schedule = extract_assignments(solution)
    # Rank by importance, not chronological date.
    ranked = sorted(
        schedule,
        key=lambda e: (-e.transit.score,
                       e.transit.exact_datetime,
                       e.transit.id)
    )
    for rank, entry in enumerate(ranked, start=1):
        entry.importance_rank = rank
    return sorted(schedule, key=lambda e: e.featured_date)

The important point is that a higher-scoring transit can displace a lower-scoring one on a neighboring date, but only if the total assignment improves and the shift stays within the permitted window.

Supporting aspects can be attached to a daily entry without consuming another calendar slot. They should be selected based on significance, thematic relevance, and their exact dates.

If the source doesn’t contain enough transits to cover every day, Ranker must flag the gap or use an explicitly authorized fallback, such as a lunar phase. It must not invent a natal aspect.

5. FILLER — Second pass: write the interpretations

Only now do we invoke AI.

The model receives a selected transit and the natal context, plus any supporting aspects.

def filler_interpret(schedule, natal_profile, llm):
    prompts = []
    for entry in schedule:
        prompts.append({
            "transit": serialize(entry.primary_transit),
            "supporting": serialize(entry.supporting_transits),
            "natal_profile": relevant_natal_context(
                natal_profile, entry.primary_transit
            ),
            "requirements": {
                "meaning_sentences": 2,
                "meaning_style": "punchy, actionable",
                "max_words_per_sentence": 12,
                "houses": "concise descriptions",
                "natal_connection": "specific and accurate",
                "no_predictions_as_facts": True
            }
        })
    results = llm.generate_structured_batch(
        prompts,
        schema=InterpretationSchema
    )
    return attach_interpretations(schedule, results)

The target style:

Meaning: “Share an unfinished idea, question, or piece of writing. Someone else’s perspective may reveal a connection you’ve overlooked.”

The AI can interpret symbolism, but it cannot change degrees, dates, aspects, or house numbers.

6. NUMBER — Sabian symbols, lucky numbers, favorites

This module should be mostly deterministic.

Sabian lookup

def sabian_degree(longitude_within_sign):
    # 0°00' through 0°59' maps to degree 1.
    # 12°02' maps to degree 13.
    return floor(longitude_within_sign) + 1
def get_sabian(sign, degree, symbol_table):
    index = sabian_degree(degree)
    return symbol_table[sign][index]

Store the source edition and exact wording of each Sabian symbol. If the project uses a shortened paraphrase, keep the original alongside it for verification.

Lucky numbers

Use a transparent, reproducible algorithm.

def lucky_numbers(entry):
    candidates = [
        entry.primary_transit.transiting_house,
        entry.primary_transit.natal_house,
        entry.featured_date.day,
        sabian_degree(
            entry.primary_transit.transiting_degree
        )
    ]
    numbers = unique_valid_numbers(candidates, min_n=1, max_n=31)
    if len(numbers) < 3:
        numbers += deterministic_fill(
            seed=stable_hash(entry.primary_transit.id),
            existing=numbers,
            count=3-len(numbers)
        )
    return numbers[:3]

Weekly favorite

For this feature, I’d allow one small AI call per week or one batched call for the month.

def select_weekly_favorites(entries, llm):
    weeks = group_by_calendar_week(entries, start="Monday")
    for week in weeks:
        candidates = [
            {
                "date": e.featured_date,
                "meaning": e.meaning,
                "natal_connection": e.natal_connection,
                "sabian_symbols": e.sabian_symbols
            }
            for e in week
        ]
        favorite = llm.choose_one(
            candidates,
            criteria=[
                "interesting symbolic contrast",
                "coherent conceptual connection",
                "practical usefulness",
                "not merely highest transit score"
            ]
        )
        mark_favorite(
            week,
            favorite.date,
            favorite.explanation
        )
    return entries

7. RHYMER — Generate the fortunes

Rhymer sees the final meaning and symbolic themes. It doesn’t need to know how Ranker scored the transit.

def rhymer_compose(entries, llm):
    for batch in chunks(entries, size=10):
        candidates = llm.generate_structured_batch(
            [
                {
                    "meaning": e.meaning,
                    "themes": extract_themes(e),
                    "style": "fortune cookie, poetic, memorable",
                    "format": "two rhyming lines",
                    "candidates": 3,
                    "avoid": [
                        "forced rhymes",
                        "awkward syntax",
                        "generic reassurance",
                        "unfounded predictions"
                    ]
                }
                for e in batch
            ],
            schema=RhymeCandidatesSchema
        )
        for entry, options in zip(batch, candidates):
            entry.fortune = choose_best_rhyme(options)
    return entries

choose_best_rhyme() can combine a simple phonetic rhyme check with an AI preference score. The phonetic check alone is insufficient because two words can rhyme while the couplet makes no sense.

8. EDITOR — Validate, critique, and repair

Editor is the fifth specialist and the final quality gate.

I’d divide it into hard validation and soft editorial review.

def editor_review(entries, source_transits, config, llm):
    for attempt in range(config.max_revisions + 1):
        hard_errors = validate_deterministic_rules(
            entries,
            source_transits,
            rules=[
                "one_event_per_date",
                "correct_month_length",
                "unique_global_ranks",
                "source_transits_unchanged",
                "exact_timestamps_preserved",
                "valid_sabian_lookup",
                "three_unique_lucky_numbers",
                "required_sections_present",
                "weekly_favorites_present"
            ]
        )
        if hard_errors:
            entries = repair_structural_errors(
                entries, hard_errors
            )
        editorial_feedback = llm.review_batch(
            entries,
            rubric={
                "astrological_coherence": 30,
                "practical_usefulness": 25,
                "rhyme_quality": 20,
                "personal_specificity": 15,
                "clarity": 10
            }
        )
        if not hard_errors and editorial_feedback.passed:
            return entries
        for issue in editorial_feedback.issues:
            if issue.category == "rhyme":
                rerun_rhymer(issue.entry_id)
            elif issue.category == "interpretation":
                rerun_filler_interpret(issue.entry_id)
            elif issue.category == "favorite":
                rerun_number_favorite(issue.week_id)
            elif issue.category == "ranking":
                rerun_ranker_and_downstream_steps()
    raise HumanReviewRequired(
        "Unresolved validation or editorial issues"
    )

The AI editor should never be allowed to silently rewrite astronomical facts. It should return structured feedback and send the affected entry back to the responsible module.

Also, deterministic validation must run again after every repair. A passing AI score cannot override a failed hard rule.

9. ICS exporter

This is pure Python. It should use an iCalendar library rather than manually concatenating text.

def export_oracle_ics(entries, month, timezone):
    calendar = Calendar()
    calendar.add("prodid", "-//Astro Oracle//EN")
    calendar.add("version", "2.0")
    for entry in sorted(entries, key=lambda e: e.featured_date):
        event = Event()
        event.add("uid", stable_event_uid(entry))
        event.add("dtstart", entry.featured_date)
        event.add("dtend", entry.featured_date + timedelta(days=1))
        event.add("transp", "TRANSPARENT")
        star = "⭐ " if entry.weekly_favorite else ""
        event.add(
            "summary",
            f"{star}({entry.importance_rank}) "
            f"{format_transit_title(entry)}"
        )
        event.add(
            "description",
            format_oracle_description(
                fortune=entry.fortune,
                meaning=entry.meaning,
                houses=entry.houses_activated,
                natal=entry.natal_connection,
                sabian=entry.sabian_symbols,
                numbers=entry.lucky_numbers,
                favorite=entry.favorite_explanation,
                exact_time=entry.primary_transit.exact_datetime,
                timezone=timezone
            )
        )
        calendar.add_component(event)
    validate_ics(calendar, expected_count=days_in_month(month))
    return calendar.to_ical()

A stable UID should be derived from the calendar identity and featured date, so regenerating the same calendar doesn’t create a new identity for every event. The exporter should also preserve a version or generation timestamp for auditing.

10. Master orchestrator

This is the full end-to-end pseudocode I’d use as the foundation of the application.

def generate_astrology_oracle(
    source_ics,
    natal_chart,
    target_month,
    preferences
):
    # 0. Validate configuration and inputs.
    config = load_config(preferences)
    validate_inputs(source_ics, natal_chart, target_month)
    # 1. FILLER: deterministic extraction.
    profile, transits = filler_parse(
        source_ics, natal_chart, config
    )
    # 2. RANKER: deterministic scoring and scheduling.
    scored = ranker_score(transits, profile, config)
    schedule = ranker_schedule(
        scored, target_month, config
    )
    schedule = attach_supporting_aspects(
        schedule, scored, config
    )
    # 3. FILLER: AI interpretations for selected events.
    entries = filler_interpret(
        schedule, profile, llm=interpretation_model
    )
    # 4. NUMBER: deterministic symbolism and optional AI.
    entries = attach_sabian_symbols(
        entries, verified_sabian_table
    )
    entries = attach_lucky_numbers(entries)
    entries = select_weekly_favorites(
        entries, llm=editorial_model
    )
    # 5. RHYMER: AI poetry.
    entries = rhymer_compose(
        entries, llm=creative_model
    )
    # 6. EDITOR: deterministic checks and AI review.
    entries = editor_review(
        entries,
        source_transits=transits,
        config=config,
        llm=editorial_model
    )
    # 7. Export only if validation passes.
    ics = export_oracle_ics(
        entries,
        month=target_month,
        timezone=profile.timezone
    )
    # 8. Save reproducible outputs.
    save_json("transits_scored.json", scored)
    save_json("calendar_schedule.json", schedule)
    save_json("oracle_entries.json", entries)
    save_file("astro_oracle.ics", ics)
    return {
        "calendar": ics,
        "entries": entries,
        "validation": "passed"
    }

11. What I’d build first

I’d develop it in three stages rather than implementing all five specialists immediately.

Stage	Build	Success criterion
1. Deterministic foundation	Filler parser, Ranker, Sabian lookup, ICS exporter	Correct events, houses, rankings, dates
2. Creative generation	Filler interpreter, Rhymer, weekly favorites	Meaningful and consistently styled fortunes
3. Editorial loop	Editor, targeted revisions, caching	Reliable output without manual rewriting

The key technical decision is to treat the source transit records and natal chart as immutable facts within the pipeline, while treating ranking, interpretation, lucky numbers, and poetry as configurable outputs.

That gives you a system where the same monthly transit data can produce different writing styles without changing the underlying calendar mathematics—and where every decision, from why a transit was ranked first to why a rhyme was selected, can be inspected and reproduced.
```
