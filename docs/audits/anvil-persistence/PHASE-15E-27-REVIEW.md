# Phase 15E-27 — Identity and Launcher Review

## Historical identity

Historical active.json and review-plan.json were present.

Both referred to a previous Anvil instance and must be
preserved unchanged.

Current verified instance:
0x4c6044f4dc474f36faa7de77f99a13d572b60b2d297e4de25fca807d9e2d7fd4

Historical instance:
0x7711a6779fa9ba7a202c4d5776d23028f9e5a63bfd9ff54292a9b5b31c511239

Marker address:
0xf04b313700000000000000000000000000000001

Marker code: EMPTY

## Original launcher

The original persistent launcher was inspected but
not executed.

Its guard behavior and potential command-line
credential exposure were identified.

## V2 review-only launcher

Local file:
Start-Anvil-Fork-Persistent-V2-REVIEW-ONLY.bat

SHA256:
E84EDAD5AF270136A936B05D0E5D77D75FC3B3485051C0F3AD34698B1C307ABD

84-line static control-flow inspection completed.

FIRST and RESTORE modes contain no Anvil launch,
snapshot import, marker bootstrap or wallet transaction
commands in the inspected content.

The V2 BAT is review-only and is not an approved
production launcher.

## Decision

Static review: PASS

Production launcher: BLOCKED

Historical identity replacement: NOT AUTHORIZED