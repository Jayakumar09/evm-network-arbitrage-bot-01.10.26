# Security Restrictions and Pending Work

## Permanent audit restrictions

- No mainnet transactions.
- No wallet funding or signing.
- No Anvil restart without explicit authorization.
- No marker bootstrap without explicit authorization.
- No snapshot import or export without authorization.
- No historical identity replacement.
- No secrets or sensitive state snapshots in Git.
- No scanner execution before identity recovery.

## Pending work

1. Review Phase 15E-28J export implementation offline.
2. Establish live export RPC behavior and compatibility.
3. Obtain explicit export authorization if appropriate.
4. Export and validate state without overwriting files.
5. Design production persistence startup and restoration.
6. Resolve instance and marker identity binding.
7. Verify scanner readiness separately.

## Current status

Anvil fork: VERIFIED

Account 2 isolation: VERIFIED

Historical identity: STALE, PRESERVED

Marker: EMPTY

State snapshot: ABSENT

Production launcher: BLOCKED

Scanner: BLOCKED