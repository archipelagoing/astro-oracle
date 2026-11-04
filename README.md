# ✧ Astro Oracle

Astro Oracle is a personalized astrology calendar project that turns the changing
sky into a daily moment of reflection. The planned experience combines natal
context, curated transits, concise interpretations, and poetic fortunes in a
calendar you can use alongside everyday life.

The repository currently includes a working browser-based planetary transit
calculator and ICS preview/export tools. The full oracle-generation pipeline,
AI writing, and PayPal access system are still in development.

## What works today

- Calculate planetary transits from a birth timestamp without uploading an
  Astro-Seek calendar.
- Choose a transit month and display results in a selected timezone.
- Use a secondary Astro-Seek link, then import an ICS file for local preview.
- Download calculated transit events as an ICS calendar.
- Run the static application locally or prepare it for GitHub Pages.

The Astro-Seek option is an external-link and file-import workflow. It does not
connect an account or automatically synchronize data.

## Try it locally

Requirements: Python 3 for the local web server; Node.js for the verification script.
No package installation or API key is needed for the current calculator.

```sh
python3 -m http.server 4173 --directory web
```

Open **http://localhost:4173**. Use the server rather than opening the HTML file
directly so the calculation worker can load correctly.

Enter a birth timestamp with an explicit UTC offset, for example
`1990-06-15T14:30:00-04:00`. Use the offset that applied at the birthplace on that
date. The current interface does not determine historical daylight-saving offsets.

Choose a month and select **Calculate my transits**. Alternatively, use
**Open Astro-Seek** and **Import .ics** to preview an existing calendar.

## Current scope and limitations

The calculator supports planetary aspects using tropical, geocentric positions.
Transit months use UTC boundaries; results are displayed in the selected timezone.
An event near a month boundary can therefore display on a neighboring local date.

Current exports contain timed transit candidates. They are not the finished,
ranked, all-day oracle calendar. Ascendant, MC, houses, Sabian enrichment, lucky
numbers, weekly favorites, and AI fortunes are not implemented in the application.
The crossing search has numerical limitations near planetary stations and has
not yet been compared with an independent reference ephemeris.

The supplied November 2026 ICS is a finished-calendar format reference. Its
presence does not mean the application generated it or that its astronomical
claims have been independently verified. Imported calendars are displayed as
supplied, not certified as accurate.

## The planned oracle experience

Astro Oracle will organize selected transits into a personalized daily calendar,
then add practical interpretations, two-line rhyming fortunes, and symbolic details.
A review stage will check factual consistency, completeness, and writing quality
before entries are delivered.

The design separates astronomical source facts from creative interpretation and
keeps approved calendar content independent of purchases. This overview omits
selection formulas, weights, and tuning parameters. The ranking and scheduling
engine itself is not implemented yet.

For the PayPal AI hackathon, the proposed commerce experience includes a free
preview and one-time purchases that unlock date ranges through verified PayPal
sandbox payments. Checkout, entitlements, and AI model integration are planned;
the current site does not accept payments or claim to be a complete submission.

LUNAR is a separate concept and is not required to use the transit calculator.

## Privacy and protection

Birth timestamps and uploaded ICS files are processed in the browser. The current
application does not submit them to a backend or persist them. It loads optional
fonts from Google Fonts; the astronomy engine is included locally.

Readable calendar exports can be copied. Encrypted fortunes and buyer-specific
metadata are design proposals, not implemented copy protection. Any future private
ranking configuration or decryption key must stay outside downloadable browser
code and public repository files.

## Verification

```sh
node tests/transits.test.cjs
```

The checks cover sample-file parsing, ICS text round trips and UTF-8 line folding,
birth-date validation, angular boundary behavior, calculated crossing consistency,
and a seasonal solar-return sanity case. These do not establish independent
astronomical accuracy. Real-browser interaction and target-calendar import testing
remain pending; the browser preview host was unavailable during implementation.

## GitHub Pages

A manual deployment workflow is included in
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). It publishes only
`web/`, with paths suitable for a repository-hosted site. It has not been deployed
as part of this work.

Select **GitHub Actions** in the repository's Pages settings, then run
**Deploy Astro Oracle to GitHub Pages** from Actions after pushing the reviewed
source. See the [setup and hosting notes](docs/ASTRO-ORACLE-github-pages.md).

Pages serves the free static calculator/project demonstration. AI credentials,
private configuration, paid access, and payment verification require separate
infrastructure. GitHub restricts Pages use for commercial transaction sites and
commercial SaaS; see [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Project structure

- `web/` — static interface, local astronomy engine, calculation worker, and ICS tools.
- `tests/` — deterministic calculator and calendar-format checks.
- `docs/` — architecture proposals, requirements, and unresolved design decisions.
- `todoSimple.md` — implementation checklist and current verification status.
- `november_2026_oracle_final_revised.ics` — supplied output-format reference.

## License and acknowledgments

Repository licensing is described in [LICENSE](LICENSE). The bundled
[Astronomy Engine](https://github.com/cosinekitty/astronomy) by Don Cross has its
own [MIT license](web/vendor/ASTRONOMY-LICENSE.txt).

Astro Oracle uses astrology as a reflective practice, not a guarantee of future
outcomes. It is not affiliated with Astro-Seek or endorsed by PayPal.
