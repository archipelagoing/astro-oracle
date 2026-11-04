# Birth Details — Local Onboarding

The initial form accepts a birth date, exact local clock time, and birthplace.
It uses Open-Meteo's geocoding endpoint for city suggestions as the user types, with
GeoNames attribution. A result supplies coordinates and an IANA timezone. Users
select a result explicitly and can edit every field; manual entry needs no lookup.

Suggestions start at three characters after a 350 ms typing pause. Click a result
or use Up/Down and Enter to fill place name, coordinates, and timezone. Escape
and leaving the field dismiss suggestions; a search button remains available.
Editing the query clears the previous place and birth confirmation so stale
coordinates cannot remain approved under a different city name.

Only the city query is sent to the search provider. Birth date/time and imported
calendars are not included in that request. Search requests omit credentials and
referrer information, time out, and ignore stale responses. No profile persistence
or backend submission is implemented. Do not commit personal reference birth data.

## Historical clock-time resolution

The browser's `Intl.DateTimeFormat` timezone database resolves the entered local
date/time into possible UTC instants. Nearby offsets are sampled and each candidate
must reproduce the original local fields exactly. This is tested for normal times,
repeated times, gaps, fractional-hour offsets, and skipped dates.

- One match: display the resolved UTC instant and offset for confirmation.
- Multiple matches: require an explicit occurrence/offset choice. Never silently
  choose the earlier or later occurrence of a repeated clock time.
- No match: block calculation and ask the user to check their record/timezone.
  Never move a nonexistent time forward automatically.

The user confirms place, coordinates, zone, and instant before calculation starts.
Editing an input invalidates that confirmation. Changing coordinates does not
silently select a different timezone. Historical political boundaries and browser
timezone-database versions can affect results, especially older dates. A city
result is a suggested zone, not independent certification of a birth record.

## What is calculated now

After confirmation, the existing worker calculates ten natal planetary longitudes
and displays them immediately while scanning the requested transit month. The
planetary calculation uses the resolved UTC instant. Coordinates are collected and
confirmed in preparation for the whole-sign chart engine; angles and houses are
not yet calculated, and the interface says so.

The full November generation workflow still needs the locally entered reference
birth data, whole-sign angles/houses, source comparison, provisional ranking,
backend generation, and the owner's selected Sabian edition. This form does not
claim to generate a completed oracle.

## Verification

```sh
node tests/birth.test.cjs
node tests/astroseek.test.cjs
node tests/transits.test.cjs
```

Birth tests include New York gaps/folds, Lord Howe half-hour transitions, Samoa's
skipped date, Kathmandu's fractional offset, leap dates, invalid coordinates, and
place-response normalization. A live Berlin lookup returned usable coordinates
and timezone during implementation. This checks the service response, not browser
CORS or click-through behavior. The local page and its JS/CSS assets returned
HTTP 200 in native Chrome, but UI inspection timed out after navigation. Browser
interaction and visual verification therefore remain pending.

The public lookup is for the free prototype. Review the provider's commercial-use
terms and service capacity before connecting the commercial product; paid API
credentials must not be embedded in the Pages frontend.

Reference: [Open-Meteo geocoding documentation](https://open-meteo.com/en/docs/geocoding-api).
