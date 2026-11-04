# LUNAR — Lunar Cycle Token Rules

Status: concept specification for a test-network prototype.

## Purpose

LUNAR connects the experience of watching a digital balance with the Moon's cycle. Its displayed value rises and falls according to a published lunar formula, rather than market demand. The intention is to encourage awareness of the Moon through an experience people already enjoy: checking their balance.

The creator describes LUNAR as a stablecoin. More precisely, this design is a lunar-cycle token with a fixed new-moon transaction price: its displayed value varies, while its permitted purchase and sale price remains fixed.

## Agreed rules

1. The token is called **LUNAR**.
2. The base reference value is **$1.00 USD per token**.
3. At the exact new moon, its displayed lunar value is **$0.50**.
4. At the exact full moon, its displayed lunar value is **$1.50**.
5. Between those points, its displayed value follows a smooth, repeating sinusoidal curve: rising as the Moon waxes and falling as it wanes.
6. No market-price input changes the official lunar value.
7. Buying and selling are permitted **only during a defined new-moon transaction window**.
8. The official purchase and sale price during that window is **$0.50 per LUNAR**, excluding any separately disclosed fees. The transaction price stays fixed throughout the window, even if the displayed lunar value has moved slightly above its exact minimum.
9. There is **no full-moon buying or selling window** under this version of the rules.
10. Holding a token does not automatically increase or decrease the number of tokens owned. Only its displayed lunar value changes.
11. The creator will not subsidize lunar gains or promise cash-out at the higher values displayed between new moons.

## Lunar value calculation

For a base value B = $1.00:

```text
V(t) = B × [1 − 0.5 × cos(θ(t))]
```

Where:

- V(t) is the displayed lunar value of one token.
- θ(t) is the cycle angle: 0 at new moon, π at full moon, and 2π at the following new moon.

The implementation must use a documented astronomical data source. To align both extrema with actual event times, a proposed implementation maps time linearly from 0 to π between consecutive new and full moons, and from π to 2π between that full moon and the next new moon. This is a cosine curve in cycle angle; it does not assume every lunar month or half-cycle has exactly the same duration.

| Cycle point | Displayed value | Official transactions |
|---|---:|---|
| New moon | $0.50 | Open within the defined window, at $0.50 |
| Midway in time from new to full moon | $1.00 | Closed |
| Full moon | $1.50 | Closed |
| Midway in time from full to new moon | $1.00 | Closed |
| Next new moon | $0.50 | Open within the defined window, at $0.50 |

The time midpoints above are not necessarily the exact astronomical quarter moons.

## What balances mean

An account holding 100 LUNAR has:

- **Token balance:** 100 LUNAR throughout the cycle, unless a transaction changes it.
- **Displayed lunar value:** between $50 and $150.
- **New-moon transaction value:** $50 before fees, subject to the chosen sale/redemption mechanism.

The displayed lunar value is not an immediately realizable cash balance. A rise from $50 to $150 does not create $100 of withdrawable profit.

The interface must distinguish token balance, displayed lunar value, and new-moon transaction value. It must also show whether the market is open and when the next window begins and ends.

Example:

```text
Balance: 100 LUNAR
Lunar value: $132.00 — reference value, not available for cash-out
New-moon transaction value: $50.00 before fees
Market: Closed
Next transaction window: [start and end, with timezone]
```

## Buying, selling, and funding

Buying at $0.50 and selling at $0.50 does not generate a guaranteed lunar profit. However, selling and issuer redemption are different mechanisms. The mechanism is not yet decided.

### Option A: Buyer-funded marketplace

Buyers and sellers exchange LUNAR at the official $0.50 price during the new-moon window. A sale requires a matching buyer. The creator does not guarantee liquidity or successful cash-out. Unmatched orders do not constitute completed sales.

### Option B: Reserve-backed redemption

An issuer sells tokens and retains sufficient funds to honor outstanding redemption obligations at $0.50 per token. Purchase proceeds backing redemption cannot also be spent on operations. Fees, payment reversals, and reserve shortfalls must be accounted for separately.

This does not require subsidizing the displayed lunar increase, because redemption never occurs at that higher reference value. It does require funded reserves and an explicit redemption obligation.

Neither option is selected by this document. Until selected and implemented, the product must not promise guaranteed cash-out.

## Test environment and PayPal

- The initial prototype may deploy an actual token contract on a blockchain test network.
- Test-network tokens and simulated dollar amounts have no promised real-money redemption value.
- PayPal sandbox can demonstrate a separate simulated payment workflow. It does not create the token or automatically support it as a PayPal cryptocurrency.
- PayPal-supported crypto payments and custom LUNAR wallet transactions are separate integrations.
- A live launch, real-money reserves, and PayPal support are outside the initial prototype specification.

## Decisions required before implementation

- **New-moon window:** duration and placement around the exact astronomical instant. No duration has been agreed.
- **Time standard:** authoritative timestamps and window boundaries; UTC is a proposed implementation standard, with local-time display.
- **Astronomical source:** provider, calculation method, and behavior if data is unavailable or corrected.
- **Sale mechanism:** buyer-funded marketplace or reserve-backed issuer redemption.
- **Transfers:** whether wallet-to-wallet transfers are blocked outside new-moon windows. Unrestricted transfers can enable unofficial trading outside the app.
- **Other uses:** whether LUNAR can purchase Astro Oracle products between windows, and at what price. No such spending rule has been agreed.
- **Supply:** who can mint or burn tokens, supply limits, and how issuance relates to completed payments.
- **Fees:** who pays payment-processing and blockchain fees, and how they affect net amounts.
- **Technical platform:** blockchain/test network, wallet experience, token precision, and rounding.
- **Controls:** who can change rules, pause transactions, or upgrade the contract, and how changes are communicated.

## Prototype acceptance criteria

- The displayed curve reaches $0.50 at each configured new moon and $1.50 at each configured full moon.
- Token balances do not change solely because the lunar phase changes.
- Buy and sell operations are rejected outside the agreed new-moon window.
- Accepted official trades use $0.50 per token, with fees shown separately.
- Reference values are clearly distinguished from sale or redemption amounts.
- The implementation enforces the selected transfer, issuance, and funding rules.
- No test transaction is presented as a real PayPal payment or real-money cash-out.

## Reference documentation

- [PayPal supported crypto payments](https://developer.paypal.com/platforms/checkout/apm/crypto/)
- [PayPal sandbox overview](https://developer.paypal.com/sandbox-testing/overview)
- [ERC-20 token standard](https://ethereum.org/developers/docs/standards/tokens/erc-20/)
- [Stablecoin concepts](https://ethereum.org/stablecoins/)

These references explain existing platforms and terminology; they do not imply endorsement, listing, or support for LUNAR.
