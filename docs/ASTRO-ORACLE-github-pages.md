# GitHub Pages Transit Calculator

## Current implementation

`web/` is a buildless HTML/CSS/JavaScript application. The primary action calculates
planet-to-natal-planet transits in a Web Worker using a local copy of Astronomy
Engine. The secondary Astro-Seek path opens its website and lets the user import
an ICS. This is not a private API integration, account connection, or automatic sync.
Do not send birth details to Astro-Seek automatically.

Inputs are an explicit birth timestamp with UTC offset, transit month, and display
timezone. The user must determine their historical birth offset. Birthplace,
Ascendant, MC, and houses are not calculated in this version. No birth details or
uploaded calendars are sent to a backend or stored persistently by this app.

The engine calculates tropical, geocentric ecliptic longitudes of date, using
light-time correction and aberration. Ten moving bodies are compared against ten
fixed natal planetary positions for 0°, 60°, 90°, 120°, and 180° aspects.

An hourly scan brackets crossings; bisection refines them to an approximately
one-second time interval. Reject signed-angle discontinuities at 180° away from
the sought longitude. Sextile, square, and trine each search both signed branches.
This does not guarantee detection of tangent contacts or two crossings within a
single scan interval near stations. Refinement precision is not a claim of
one-second astronomical accuracy. Independent comparison with a reference
ephemeris is still required before treating this as production-grade astrology.

Transit month boundaries are UTC, explicitly labeled in the interface. Display
timezone conversion can put a boundary event on a neighboring local date. A later
local-month mode must derive timezone-aware interval boundaries rather than merely
changing display labels. Dates accepted by the interface range from 1900 to 2100.

Generated ICS contains timed transit candidates, not full-month all-day oracle
fortunes. Scoring, assignment, verified Sabian enrichment, and AI writing remain
separate pipeline work. The original month-completeness requirement still applies
to canonical oracle generation, not to this candidate-export utility.

## Sample file findings

The supplied `november_2026_oracle_final_revised.ics` contains 30 all-day VEVENTs
with ranks, descriptions, fortune/meaning sections, natal details, and timing
written into the description. It is a finished output-format reference, not a raw
Astro-Seek source export. Its prose and astronomical statements have not been
independently verified. It does not establish a raw-source parser contract or an
owner-approved template by itself.

The import preview unfolds continuation lines, decodes ICS text escaping, and
renders text without HTML interpretation. It displays original DTSTART values
without claiming to resolve all timezone/recurrence constructs. It is a limited
event preview, not a general recurring-calendar engine. Keep the original fixture
outside `web/` so the Pages artifact does not publish personal chart content.

## Run and verify

```sh
python3 -m http.server 4173 --directory web
```

Open `http://localhost:4173`. A server is required for the worker; opening the HTML
as a `file:` URL is not the supported path.

```sh
node tests/transits.test.cjs
```

Checks cover the 30-event sample, unfolding/text decoding, UTF-8 folding and ICS
round trip, date validation, angular wraparound, crossing residuals below 0.001°,
unique event detections, UTC month bounds, and a seasonal solar-return sanity case.
These are internal consistency checks, not an independent ephemeris comparison.

Browser interaction and calendar-client import checks remain pending. The browser
preview host was unavailable during implementation.

## Deploy to GitHub Pages

The manual `.github/workflows/pages.yml` uploads only `web/`, so assets resolve
under either a repository subpath or a custom domain. No build or external runtime
dependency installation is required.

1. Commit and push the reviewed source to GitHub.
2. In repository Settings → Pages, select GitHub Actions as the publishing source.
3. Run “Deploy Astro Oracle to GitHub Pages” from the Actions tab.
4. Check the returned deployment URL, calculation worker, import, and ICS download.

No push or deployment has been performed by this change. Private birth details must
not be committed to a public repository; leaving the sample out of the Pages
artifact does not make its repository copy private.

GitHub Pages serves static assets; it cannot run the Python pipeline, keep API
secrets, enforce paid access, or verify PayPal captures. GitHub also restricts using
Pages for websites primarily facilitating commercial transactions or commercial
SaaS. Use Pages for the free calculator/project demonstration, and choose appropriate
separate hosting for the commercial application, API, AI generation, and payments.

## Library provenance

Astronomy Engine, Don Cross, MIT license. Downloaded from its official repository
on 2026-11-04 and vendored locally with its license. File SHA-256:

```text
d1b3ab4b86aa409f78c0f0d95162a847496cba7e938eb6f4712cf9c1c45f4a2e
```

The digest pins the included bytes; review upgrades deliberately. No runtime CDN
is needed for the calculation engine. Optional typography currently loads from
Google Fonts and falls back to system fonts.

References: [Astronomy Engine documentation](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md),
[GitHub Pages creation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site),
[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
