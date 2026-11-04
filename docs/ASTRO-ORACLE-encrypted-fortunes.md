# Astro Oracle — Encrypted Fortunes in ICS Metadata

Status: proposed optional design, not an implemented feature or an approved change
to the current calendar-delivery specification.

## What this would do

An ICS file could contain a readable calendar entry plus an encrypted fortune in
custom metadata. Ordinary calendar apps would display the readable portion. Astro
Oracle would read the encrypted portion and unlock it for an authorized buyer.

Someone uploading only that encrypted file to an AI would provide ciphertext,
not the original fortune text. Without access to the decryption key, the AI could
not recover that text from properly implemented encryption alone. However, the
buyer could still copy, screenshot, or share the fortune after unlocking it.
Encryption protects unread content; it cannot prevent imitation of content a
person can already read.

## Example calendar event

This is an illustrative structure, not a complete import-ready ICS file. Bracketed
values are placeholders. A compliant iCalendar library must handle serialization,
escaping, line folding, and line endings.

```text
BEGIN:VEVENT
UID:[stable opaque event ID]
DTSTART;VALUE=DATE:20261104
DTEND;VALUE=DATE:20261105
SUMMARY:Your Astro Oracle fortune
DESCRIPTION:Open Astro Oracle to read your personalized fortune.
URL:https://[your-domain]/oracle/[opaque-entry-ID]
X-ASTRO-ORACLE-VERSION:encrypted-v1
X-ASTRO-ORACLE-PAYLOAD-ID:[opaque payload ID]
X-ASTRO-ORACLE-KEY-ID:[opaque key reference]
X-ASTRO-ORACLE-NONCE:[base64url nonce]
X-ASTRO-ORACLE-CIPHERTEXT:[base64url encrypted payload and authentication tag]
END:VEVENT
```

Custom `X-` properties provide a place for application-specific data. These names
are proposed conventions for Astro Oracle, not standard encryption properties.
Their contents are visible to anyone who opens the file. The ciphertext is secret
because it is encrypted, not because the metadata is hidden.

Do not include the key, a password, a reusable access token, or a buyer's email in
these fields. An opaque ID is a reference, not permission to unlock an entry.

## What gets encrypted

Serialize a versioned JSON payload containing the protected sections:

```json
{
  "schema_version": "fortune-v1",
  "entry_id": "opaque-entry-id",
  "featured_date": "2026-11-04",
  "fortune": ["First line", "Second line"],
  "meaning": ["First sentence.", "Second sentence."],
  "house_meaning": "Personalized explanation",
  "natal_connection": "Personalized explanation",
  "sabian_symbols": {},
  "lucky_numbers": [4, 12, 23]
}
```

The values above illustrate structure only. They are not generated or validated
oracle content. Include any other protected sections required by the approved
template. Decide explicitly which details remain public: putting a transit title,
rank, or birth-chart details in SUMMARY or DESCRIPTION exposes them even when the
fortune payload is encrypted.

## Encryption and delivery workflow

1. Generate and validate the canonical oracle entry independently of payment.
2. Create a versioned payload and encrypt it using a vetted authenticated-encryption
   library, for example AES-256-GCM. Use a cryptographically generated key and a
   unique nonce for every encryption under that key. Never design a custom cipher.
3. Bind the payload to its opaque calendar ID, entry ID, date, payload version, and
   key reference using authenticated associated data. Store those exact values
   server-side so edits or payload swaps fail verification. Use a defined encoding.
4. Put the nonce, ciphertext with authentication tag, and opaque references in the
   ICS metadata. Keep encryption keys in managed server-side key storage, separate
   from exported files, logs, and the public repository.
5. The buyer imports the file. Their calendar shows the public title and an
   authenticated Astro Oracle link, not the decrypted fortune.
6. When the buyer opens the link, require sign-in and check ownership plus the
   free/paid date entitlement server-side. Do not trust dates, IDs, or access claims
   supplied by the calendar file alone.
7. Load the stored payload, or accept an uploaded payload only after matching its
   stored identity and authorization. Verify the authentication tag and associated
   data before using any decrypted content.
8. Render the fortune inside Astro Oracle over an authenticated encrypted connection.
   Keep the decryption key on the server. Do not write the plaintext back into a
   normal calendar event unless the buyer explicitly chooses a readable export.

A simple initial key model is one random data-encryption key per calendar version,
wrapped by a managed master key. Store ownership and entitlement separately from
key references. Rotating or losing keys affects older files; retain required old
keys securely or provide a migration plan. Test the entire key lifecycle before
promising long-term offline-file recovery.

## Important calendar-app limitation

Google Calendar, Apple Calendar, and other ordinary calendar clients should not
be assumed to decrypt this application-specific payload. There is no special
metadata label that automatically makes that happen.

Custom properties may be discarded during import, synchronization, or re-export.
Test each intended client and workflow. Keep a server copy of the encrypted
payload and a stable ordinary URL so losing custom metadata does not necessarily
lose access. A user who wants to decrypt directly from a file can upload the
original ICS to Astro Oracle; that still requires authorization.

If the product promises fortunes readable directly inside ordinary calendar
apps, use a readable export and accept that its text can be copied. An encrypted
export changes that experience into calendar reminders linking to protected
content in Astro Oracle.

## Encryption, signatures, and buyer watermarks

| Mechanism | Purpose | Does not provide |
|---|---|---|
| Authenticated encryption | Conceals the payload and detects unauthorized alteration when verified | Prevention of copying after legitimate decryption |
| Digital signature | Lets a verifier check that a defined payload was signed by Astro Oracle and has not changed | Secrecy, or control over what another AI imitates |
| Buyer-specific watermark | Associates an exported copy with an issuance record | Reliable tracing after removal, paraphrasing, or re-export |

An encryption authentication tag is not a publicly verifiable creator signature.
If public authenticity is needed, add a separate digital signature over a precisely
defined versioned payload/envelope using a vetted signature library. Keep the
private signing key server-side and publish only the verification key. Avoid
signing raw ICS bytes without a serialization strategy: line folding and client
rewrites can change bytes without changing the visible event.

A watermark can use a random export ID mapped to a purchase record on the server.
Avoid personal identifiers. Do not accuse a buyer based solely on a watermark;
files and identifiers can be copied by others. Neither a watermark nor a signature
instructs ChatGPT to refuse imitation, and neither is an access-control mechanism.

## Threat model and limits

- An outsider with only the file should not be able to decrypt the protected text.
- Changing public metadata or substituting ciphertext should not grant access or
  produce trusted modified content.
- A buyer with valid access can read and therefore reproduce the plaintext.
- An expired entitlement can block future app requests, but cannot erase prior
  screenshots, readable exports, decrypted copies, or imported plaintext events.
- A compromised server or exposed key can defeat the protection. Server-side
  encryption is not end-to-end encryption from the operator.
- Encrypted text is not a reliable deterrent against generating similar astrology
  writing from other examples or general knowledge.

## Acceptance checks before implementation is called complete

- Decrypt a valid payload and match it to the validated canonical entry.
- Reject changed ciphertext, authentication tags, nonces, or bound identity fields.
- Confirm encryption never reuses a nonce under the same key.
- Deny unauthenticated users and users lacking ownership/date access, including
  requests that substitute another buyer's entry or payload ID.
- Verify keys and protected plaintext are absent from the ICS public fields,
  ordinary logs, URLs, source control, and browser bundles.
- Test original-file upload, metadata preservation/loss, and URL behavior in named
  calendar clients; document the supported paths.
- Test entitlement changes, key rotation, backup recovery, missing keys, and
  unavailable-service behavior without exposing secrets in error messages.
- Tell the buyer before export whether fortunes will be readable inside their
  calendar or require opening Astro Oracle.

## Simpler alternative

If all unlocking happens online, a normal calendar event containing only an
opaque link to access-controlled server content may be sufficient. Carrying
ciphertext in the ICS is useful only if there is a concrete need to transport the
encrypted payload itself; it adds key-management and compatibility work without
stopping a legitimate reader from copying.

## Decision needed for Astro Oracle

Choose readable ICS, encrypted/link-based ICS, or both. This proposal changes the
current expectation that full fortunes appear in calendar descriptions. Keep it
optional and outside the core hackathon backlog until that delivery choice is
made. It is not a prerequisite for the deterministic astrology pipeline.
