# Astro Oracle — Implementation Questions

These questions supplement the [architecture source](ASTRO-ORACLE-architecture-source.md), [calendar rules](ASTRO-ORACLE-calendar-rules.md), and [LUNAR rules](LUNAR-rules.md). They do not change the agreed rules.

The companion [proposed answers](ASTRO-ORACLE-proposed-answers.md) addresses every numbered question. Proposed defaults are starting points for implementation, not owner-approved requirements.

## 1. Inputs and finished output

- **1.1** What fields actually exist in a real Astro-Seek ICS export, and which event types will the prototype support?
- **1.2** What natal-chart format and minimum information will the application accept?
- **1.3** What exact title, labels, section order, punctuation, and line breaks should a finished calendar entry use?
- **1.4** What should happen when source fields are missing, ambiguous, duplicated, or contradictory?

## 2. Ranking mathematics

- **2.1** What does each score component mean, and how is it normalized?
- **2.2** What default weights apply to natal targets, transiting bodies, and aspects?
- **2.3** How do overlapping priorities combine without double-counting, such as a Moon that is also the chart ruler?
- **2.4** How should constant features, source confidence, and uncertain records affect scoring?
- **2.5** What deterministic tie-breakers apply?

## 3. Calendar assignment

- **3.1** How far may a transit move from its exact local date, and what is the shift penalty?
- **3.2** May events from an adjacent month supply the first or last days?
- **3.3** What happens if the assignment cannot cover every day?
- **3.4** Does the visible importance rank use the original score or the shift-adjusted score?
- **3.5** How are supporting transits selected, and may they also be primary elsewhere?

## 4. Astronomical validation

- **4.1** Which bodies, aspects, coordinate systems, and house systems are supported?
- **4.2** How are angular distance, aspect tolerances, degree boundaries, and retrograde motion handled?
- **4.3** How are timezones, daylight-saving changes, and date boundaries handled?
- **4.4** What happens when source data disagrees with an independent calculation?

## 5. Reference data and symbolism

- **5.1** Which Sabian edition and wording may be distributed, and where is the verified table?
- **5.2** Which astronomical data source and calculation library will be used?
- **5.3** What exact algorithm produces three distinct, reproducible lucky numbers?
- **5.4** What defines a week, and how is its favorite selected?

## 6. Editing and failure handling

- **6.1** Which checks are mandatory, and what makes the editorial review pass?
- **6.2** Which module repairs each failure, and how many retries are allowed?
- **6.3** What does a user receive if generation cannot finish successfully?

## 7. Implementation and evaluation

- **7.1** What runtime, libraries, model interface, storage, and application entry point should be used?
- **7.2** Which fixtures and tests establish factual correctness and acceptable writing quality?
- **7.3** What records are needed to explain and audit a generated calendar?
- **7.4** How should model cost, latency, privacy, and secrets be managed?

## 8. Hackathon purchase experience

- **8.1** What does the user purchase, and how does PayPal fit into the demonstration?
- **8.2** When does payment happen relative to validation, generation, and delivery?
- **8.3** How are duplicate payment notifications, failed jobs, retries, and interrupted downloads handled?
- **8.4** Is LUNAR required for the calendar prototype, and which LUNAR decisions remain separate?
