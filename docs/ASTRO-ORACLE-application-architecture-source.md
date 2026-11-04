# Astro Oracle — Application Architecture Source

Supplied on 2026-11-04. Preserved verbatim below as design prose and pseudocode,
not executable code. This expands the original architecture; recommendations
and unresolved conflicts are not automatically approved implementation choices.

See [reconciliation notes](ASTRO-ORACLE-application-decisions.md) and the
[project checklist](../todoSimple.md).

```text
✧ Astro Oracle — Application Architecture & Detailed Pseudocode

Astro Oracle should be a personalized astrological fortune-calendar application, powered by deterministic astronomical calculations and AI-assisted interpretation.

Its defining feature isn’t that it generates horoscopes. It’s that it selects, ranks, interprets, and distributes real astrological transits across a calendar, then turns them into concise, poetic, personalized daily fortunes.

For the PayPal hackathon, I’d preserve the entire five-specialist architecture while adding purchasing and calendar delivery as separate application services.

1. The seven most important application components

Priority	Component	Responsibility	Technology
1	Natal Profile Engine	Store chart information, calculate houses, establish personal priorities	Python
2	Filler	Parse transit data and generate personalized meanings	Python + AI
3	Ranker	Score transits and optimize one selection per date	Python + optimization
4	Number	Sabian symbols, lucky numbers, weekly favorites	Python + optional AI
5	Rhymer	Generate meaningful two-line rhyming fortunes	AI
6	Editor	Validate astronomical facts, writing quality, and completeness	Python + AI
7	Commerce + Calendar	Free access, PayPal purchases, entitlements, and ICS export	Backend

The five specialists are modules, not necessarily five autonomous agents. That distinction keeps the system cheaper and easier to test.

2. End-to-end application workflow

User onboarding

Birth chart · Transit ICS · Month · Timezone · House system

Natal Profile + Filler Parse

Normalize astronomical data and establish natal connections

Ranker

Score all candidates → optimize dates → assign global ranks

Filler Interpret → Number → Rhymer

Meaning · Symbolism · Lucky numbers · Rhyming couplets

Editor

Validate, critique, selectively regenerate, approve

Canonical Oracle Dataset

Verified daily entries, independent of presentation or purchase

PayPal Access → Calendar / ICS

Free first week · Daily · Weekly · Monthly · Yearly

3. Data models and database

The central design principle is to separate immutable source facts from generated interpretations.

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional
@dataclass
class NatalProfile:
    user_id: str
    timezone: str
    zodiac_system: str
    house_system: str
    planets: dict
    angles: dict
    house_cusps: dict
    chart_ruler: str
@dataclass
class Transit:
    id: str
    source_uid: str
    exact_at: datetime
    moving_body: str
    target_body: Optional[str]
    aspect: str
    moving_longitude: float
    target_longitude: Optional[float]
    moving_house: Optional[int] = None
    natal_house: Optional[int] = None
    importance_score: float = 0.0
@dataclass
class OracleEntry:
    featured_date: date
    transit_id: str
    rank: int
    fortune: str = ""
    meaning: str = ""
    house_meaning: str = ""
    natal_connection: str = ""
    sabian_symbols: dict = field(default_factory=dict)
    lucky_numbers: list[int] = field(default_factory=list)
    weekly_favorite: bool = False
    favorite_reason: Optional[str] = None
    status: str = "draft"
@dataclass
class Entitlement:
    user_id: str
    starts_on: date
    ends_on: date
    product_type: str
    paypal_order_id: Optional[str]
    status: str

For the database, I’d use PostgreSQL with tables for users, natal_profiles, source_transits, oracle_entries, generation_jobs, orders, and entitlements.

Store sensitive birth information securely and keep PayPal credentials server-side.

4. Natal Profile Engine

The natal profile determines how transits should be personalized.

It should support user-uploaded chart data initially, with automatic natal-chart calculation as a later feature.

def build_natal_profile(chart_input, preferences):
    chart = normalize_chart(chart_input)
    require_fields(
        chart,
        ["planet_positions", "ascendant", "timezone"]
    )
    profile = NatalProfile(
        user_id=preferences.user_id,
        timezone=preferences.timezone,
        zodiac_system=preferences.zodiac_system,
        house_system=preferences.house_system,
        planets=chart["planet_positions"],
        angles=chart["angles"],
        house_cusps=chart.get("house_cusps", {}),
        chart_ruler=find_chart_ruler(
            chart["angles"]["ascendant"]
        )
    )
    validate_chart_consistency(profile)
    return profile
def whole_sign_house(planet_longitude, asc_longitude):
    planet_sign = int(planet_longitude // 30)
    rising_sign = int(asc_longitude // 30)
    return ((planet_sign - rising_sign) % 12) + 1

The whole-sign formula is deterministic. Other house systems require the appropriate cusps or astronomical calculations.

5. Filler — Parse and interpret

Filler has two distinct operations.

Pass A: deterministic parsing

def filler_parse(source_ics, profile):
    raw_events = parse_ics(source_ics)
    transits = []
    for raw in raw_events:
        if not is_supported_astrological_event(raw):
            continue
        transit = normalize_transit(raw)
        transit.exact_at = convert_to_timezone(
            transit.exact_at,
            profile.timezone
        )
        verify_source_positions(transit, profile)
        verify_aspect(transit, profile)
        transit.moving_house = calculate_house(
            transit.moving_longitude,
            profile
        )
        if transit.target_body:
            transit.natal_house = natal_house_for(
                transit.target_body,
                profile
            )
        transits.append(transit)
    return deduplicate_transits(transits)

If an ICS event doesn’t include enough information to verify a degree or aspect, flag it for review or enrich it from a trusted ephemeris. Don’t let an LLM guess.

Pass B: AI interpretation

This runs after Ranker, so only selected entries incur interpretation costs.

def filler_interpret(entries, transits, profile, llm):
    requests = []
    for entry in entries:
        transit = transits[entry.transit_id]
        requests.append({
            "entry_id": entry.transit_id,
            "transit": serialize(transit),
            "natal_context": relevant_natal_context(
                profile, transit
            ),
            "requirements": {
                "meaning": "exactly two concise sentences",
                "tone": "poetic but practical",
                "houses": "explain activated life areas",
                "connection": "explain natal relevance",
                "avoid": [
                    "invented astronomical facts",
                    "certain future predictions",
                    "generic filler"
                ]
            }
        })
    responses = llm.generate_json_batch(
        requests,
        schema=InterpretationSchema
    )
    return merge_by_entry_id(entries, responses)

Example output:

Meaning: Share an unfinished idea or question. A new perspective may reveal something you overlooked.

6. Ranker — The core selection algorithm

This is arguably your most important engineering contribution.

Ranker should evaluate all available transits before choosing the month’s daily entries.

Natal importance scoring

An illustrative weighted formula:

S(t)=0.35N(t)+0.25P(t)+0.20A(t)+0.15E(t)+0.05C(t)

Here, is natal relevance, is transiting-body importance, is aspect importance, is exactness, and is additional chart-specific emphasis.

The weights are configurable editorial choices, not scientifically validated measures of astrological influence.

def ranker_score(transits, profile, weights):
    for transit in transits:
        features = {
            "natal": natal_priority(transit, profile),
            "planet": moving_planet_priority(transit),
            "aspect": aspect_priority(transit.aspect),
            "exactness": exactness_score(transit),
            "chart": chart_emphasis(transit, profile)
        }
        transit.importance_score = (
            weights.natal * features["natal"]
            + weights.planet * features["planet"]
            + weights.aspect * features["aspect"]
            + weights.exactness * features["exactness"]
            + weights.chart * features["chart"]
        )
    return sorted(
        transits,
        key=lambda t: -t.importance_score
    )

Optimize one transit per day

This should be a maximum-weight bipartite assignment, using a solver such as OR-Tools.

def ranker_assign(scored_transits, month, config):
    dates = list_dates_in_month(month)
    model = BinaryOptimizationModel()
    assignments = {}
    for transit in scored_transits:
        exact_day = transit.exact_at.date()
        for day in dates:
            offset = abs((day - exact_day).days)
            if offset <= config.max_shift_days:
                assignments[transit.id, day] = model.binary()
    # Every date must have exactly one primary transit.
    for day in dates:
        model.require(
            sum(
                var for (tid, d), var in assignments.items()
                if d == day
            ) == 1
        )
    # A transit cannot be used as primary twice.
    for transit in scored_transits:
        model.require(
            sum(
                var for (tid, d), var in assignments.items()
                if tid == transit.id
            ) <= 1
        )
    model.maximize(
        sum(
            var * (
                lookup_score(tid)
                - config.shift_penalty
                  * abs((day - lookup_exact_day(tid)).days)
            )
            for (tid, day), var in assignments.items()
        )
    )
    solution = model.solve()
    if not solution.feasible:
        raise CoverageError(
            "Not enough eligible transits for every date"
        )
    entries = solution.to_oracle_entries()
    # Rank globally, independently of featured date.
    for rank, entry in enumerate(
        sorted(
            entries,
            key=lambda e: -lookup_score(e.transit_id)
        ),
        start=1
    ):
        entry.rank = rank
    return sorted(entries, key=lambda e: e.featured_date)

This solves the specific problem you identified: a day with several highly significant transits can lend one to a neighboring day that would otherwise have a much weaker selection.

The system must still preserve the transit’s real exact date and time in the event description.

7. Number — Symbols, lucky numbers, and favorites

Number should use verified data wherever possible.

def sabian_degree(longitude):
    within_sign = longitude % 30
    return int(within_sign) + 1
def number_enrich(entries, transits, symbol_table):
    for entry in entries:
        transit = transits[entry.transit_id]
        moving_sign = sign_of(transit.moving_longitude)
        moving_degree = sabian_degree(
            transit.moving_longitude
        )
        entry.sabian_symbols["transiting"] = (
            symbol_table[moving_sign][moving_degree]
        )
        if transit.target_longitude is not None:
            natal_sign = sign_of(transit.target_longitude)
            natal_degree = sabian_degree(
                transit.target_longitude
            )
            entry.sabian_symbols["natal"] = (
                symbol_table[natal_sign][natal_degree]
            )
        entry.lucky_numbers = derive_three_numbers(
            entry.featured_date,
            transit.moving_house,
            transit.natal_house,
            moving_degree
        )
    return entries

Weekly favorites should be selected from the actual daily entries. The AI may choose the most interesting symbolic connection, but the chosen date must belong to that week.

8. Rhymer — Two-line fortunes

Rhymer is a creative AI specialist.

Its input should include the meaning, transit theme, natal connection, and selected symbolism—not raw, unprocessed ICS text.

def rhymer_generate(entries, llm):
    requests = []
    for entry in entries:
        requests.append({
            "entry_id": entry.transit_id,
            "meaning": entry.meaning,
            "natal_connection": entry.natal_connection,
            "symbols": entry.sabian_symbols,
            "rules": {
                "lines": 2,
                "must_rhyme": True,
                "tone": "fortune-cookie poetry",
                "preserve_meaning": True,
                "no_forced_rhyme": True,
                "no_certain_predictions": True
            }
        })
    results = llm.generate_json_batch(
        requests,
        schema=CoupletSchema
    )
    for result in results:
        entry = find_entry(entries, result.entry_id)
        entry.fortune = result.couplet
    return entries

For example:

A thought once small may stretch its wings, New minds may show what sharing brings.

9. Editor — Quality assurance and targeted repair

Editor should combine hard validation with AI-based editorial judgment.

def editor_validate(entries, transits, month, llm):
    max_attempts = 3
    for attempt in range(max_attempts):
        hard_errors = validate_rules(
            entries,
            transits,
            month,
            rules=[
                "one_entry_per_date",
                "complete_month",
                "unique_ranks",
                "valid_transit_references",
                "unchanged_exact_timestamps",
                "correct_sabian_symbols",
                "three_unique_lucky_numbers",
                "one_favorite_per_week",
                "all_sections_present"
            ]
        )
        if hard_errors:
            entries = repair_with_code(
                entries, hard_errors
            )
        feedback = llm.review(
            entries,
            rubric={
                "symbolic_coherence": 30,
                "usefulness": 25,
                "rhyme": 20,
                "personalization": 15,
                "clarity": 10
            }
        )
        if not hard_errors and feedback.passed:
            return entries
        for issue in feedback.issues:
            if issue.type == "rhyme":
                regenerate_rhyme(issue.entry_id)
            elif issue.type == "meaning":
                regenerate_interpretation(issue.entry_id)
            elif issue.type == "weekly_favorite":
                reselect_weekly_favorite(issue.week_id)
            elif issue.type == "scheduling":
                rerun_ranker()
    raise ReviewRequired("Manual review needed")

In a production implementation, repair functions must return updated entries, and all dependent content must be regenerated when a primary transit changes. A final deterministic validation pass is mandatory before publication.

10. PayPal commerce and access control

The free first seven days should be available without payment. Paid periods unlock only after verified PayPal payment.

Your proposed angel-number pricing:

Product	Price	Access
Free trial	$0.00	First seven days
Daily	$0.22	One day
Weekly	$1.11	Seven days
Monthly	$4.44	One calendar month
Yearly	$33.33	One calendar year

For the MVP, I’d use one-time purchases, not automatic recurring subscriptions.

PRODUCTS = {
    "daily":  {"price": "0.22", "duration": "1_day"},
    "weekly": {"price": "1.11", "duration": "7_days"},
    "monthly":{"price": "4.44", "duration": "1_month"},
    "yearly": {"price": "33.33", "duration": "1_year"}
}
def create_purchase(user_id, product_id, start_date):
    product = PRODUCTS[product_id]
    # Price must come from the server catalog.
    period = calculate_access_period(
        start_date, product["duration"]
    )
    order = paypal_create_order(
        amount=product["price"],
        currency="USD",
        reference_id=create_internal_order_id()
    )
    save_pending_order(
        user_id=user_id,
        paypal_order_id=order.id,
        product_id=product_id,
        period=period,
        amount=product["price"]
    )
    return order.approval_url
def confirm_purchase(internal_order_id, approved_order_id):
    pending = load_pending_order(internal_order_id)
    assert pending.paypal_order_id == approved_order_id
    # Capture and verify server-to-server.
    capture = paypal_capture_order(approved_order_id)
    if not verified_completed_capture(
        capture,
        expected_amount=pending.amount,
        expected_currency="USD"
    ):
        raise PaymentVerificationError()
    # Idempotent transaction prevents duplicate grants.
    with database_transaction():
        if not entitlement_already_granted(capture.id):
            grant_entitlement(
                user_id=pending.user_id,
                period=pending.period,
                product_id=pending.product_id,
                payment_id=capture.id
            )
    return "unlocked"
def can_view_fortune(user_id, requested_date):
    if within_first_free_week(user_id, requested_date):
        return True
    return has_active_entitlement(
        user_id, requested_date
    )

For production, PayPal webhook events should also be verified and reconciled, including refunds and reversals. Never trust a client-side payment-success message as proof of purchase.

11. Calendar and ICS export

Every unlocked date can be exported as an all-day calendar event.

def export_ics(user_id, requested_dates):
    authorized = []
    for day in requested_dates:
        if not can_view_fortune(user_id, day):
            raise AccessDenied(day)
        authorized.append(load_approved_oracle(user_id, day))
    calendar = Calendar()
    calendar.add("version", "2.0")
    calendar.add("prodid", "-//Astro Oracle//EN")
    for entry in authorized:
        transit = load_transit(entry.transit_id)
        event = Event()
        event.add("uid", stable_uid(user_id, entry.featured_date))
        event.add("dtstart", entry.featured_date)
        event.add(
            "dtend",
            entry.featured_date + timedelta(days=1)
        )
        event.add("transp", "TRANSPARENT")
        event.add(
            "summary",
            format_title(
                rank=entry.rank,
                transit=transit,
                favorite=entry.weekly_favorite
            )
        )
        event.add(
            "description",
            format_description(
                fortune=entry.fortune,
                meaning=entry.meaning,
                houses=entry.house_meaning,
                natal=entry.natal_connection,
                sabian=entry.sabian_symbols,
                numbers=entry.lucky_numbers,
                exact_time=transit.exact_at
            )
        )
        calendar.add_component(event)
    return calendar.to_ical()

The resulting ICS must follow iCalendar formatting requirements, including correct escaping, UTF-8 encoding, CRLF line endings, and line folding. A compliant library should handle serialization.

For a yearly product, generate future months incrementally if the available transit data doesn’t yet cover the full year. Don’t imply that the user has received 365 entries until those entries actually exist.

12. Main application screens

I’d keep the interface to five screens.

01 · Your Stars

Upload a natal chart and transit ICS, choose a timezone and house system, and preview the parsed chart.

02 · Your Oracle Calendar

Month grid with daily transit glyphs, importance ranks, weekly favorites, and locked/unlocked dates.

03 · Today’s Fortune

A fortune card with the rhyming couplet and practical meaning first, plus expandable astrological details.

04 · Unlock Your Stars

Select daily, weekly, monthly, or yearly access; complete PayPal checkout; view purchased dates.

05 · Calendar Export

Download an ICS file for unlocked dates, with clear Google Calendar and Apple Calendar import instructions.

13. Master application pseudocode

def generate_oracle(user_id, target_month):
    profile = load_natal_profile(user_id)
    config = load_user_preferences(user_id)
    source = load_transit_ics(user_id, target_month)
    # 1. Parse source data.
    transits = filler_parse(source, profile)
    # 2. Rank and schedule.
    scored = ranker_score(
        transits, profile, config.ranking_weights
    )
    entries = ranker_assign(
        scored, target_month, config
    )
    # 3. Generate interpretations.
    entries = filler_interpret(
        entries,
        index_by_id(transits),
        profile,
        interpretation_llm
    )
    # 4. Enrich symbolism.
    entries = number_enrich(
        entries,
        index_by_id(transits),
        verified_sabian_table
    )
    entries = select_weekly_favorites(
        entries, editorial_llm
    )
    # 5. Generate poetry.
    entries = rhymer_generate(
        entries, creative_llm
    )
    # 6. Validate and selectively repair.
    entries = editor_validate(
        entries,
        transits,
        target_month,
        editorial_llm
    )
    # 7. Store approved canonical records.
    save_oracle_entries(user_id, entries)
    return entries
def get_oracle_for_user(user_id, start_date, end_date):
    entries = load_oracle_entries(
        user_id, start_date, end_date
    )
    return [
        {
            "date": e.featured_date,
            "locked": not can_view_fortune(
                user_id, e.featured_date
            ),
            "content": e if can_view_fortune(
                user_id, e.featured_date
            ) else None
        }
        for e in entries
    ]
def purchase_and_unlock(user_id, product, start_date):
    # Step 1: Create pending order.
    order = create_purchase(
        user_id, product, start_date
    )
    # Step 2: Frontend redirects to PayPal.
    return {
        "checkout_url": order,
        "status": "awaiting_approval"
    }
# Separate authenticated callback/webhook handler:
# verify payment -> grant entitlement -> enable export

14. What to build for the hackathon MVP

Given the time constraint, I’d prioritize these deliverables in order:

* Working astrology pipeline: upload ICS + natal chart, generate seven correct daily entries, preserve source timestamps.
* Five-specialist output: ranking, natal interpretation, symbols, rhyming fortunes, and Editor validation.
* A polished daily calendar UI: seven-day preview with expandable fortune cards.
* Real PayPal Sandbox checkout: purchase a seven-day pass and unlock the correct date range.
* ICS export: download the purchased calendar and successfully import it into Google Calendar.

I’d defer automatic birth-chart calculation, yearly generation, advanced subscription billing, and complex social features until after the hackathon.

The most important architectural decision

Generate the oracle independently of payment, then let PayPal control access to the approved results.

That separation means you can test the entire five-specialist pipeline without involving payments, regenerate a failed fortune without touching a purchase, and change pricing without changing the astrology engine.

It also keeps the product faithful to your original vision: a natal-personalized, globally ranked, carefully balanced, symbolically enriched, rhyming daily oracle, delivered as a real calendar rather than a generic horoscope.
```
