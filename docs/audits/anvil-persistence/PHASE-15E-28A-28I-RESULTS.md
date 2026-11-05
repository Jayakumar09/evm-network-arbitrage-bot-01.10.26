# Anvil Persistence Audit — Phase 15E-28A through 15E-28I

Status: READ-ONLY AUDITS COMPLETED
Production persistence: BLOCKED
State export: NOT AUTHORIZED

## Environment

- Repository branch: fork-test/anvil-mainnet
- Anvil version: 1.8.3
- Anvil executable: C:\Foundry\anvil.exe
- Chain ID: 31337
- Fork block: 26295209
- Fork hash: 0x66c1de0b22b96faf5e499646677d732cb41abf3e9ef4aeb4f549af7d057916a9
- Verified instance ID: 0x4c6044f4dc474f36faa7de77f99a13d572b60b2d297e4de25fca807d9e2d7fd4

## Completed phases

| Phase | Finding |
|---|---|
| 15E-28A | Anvil 1.8.3 and core persistence flags verified |
| 15E-28B | State, load, dump, interval and historical-state semantics verified |
| 15E-28C | CLI documentation inspected; RPC support not established |
| 15E-28D | No snapshot RPC references found in searched repository files |
| 15E-28E | No snapshot RPC references found in searched local documentation |
| 15E-28F | Four RPC method names found in installed Anvil binary |
| 15E-28G | Chain, instance and empty marker reverified |
| 15E-28H | Six live fork and Account 2 safety checks passed |
| 15E-28I | Destination absent; identity files present; 18.02 GB free |

## Persistence CLI options

- --state: load existing state and dump on exit
- --load-state: initialize from a saved snapshot
- --dump-state: dump chain state on exit
- --state-interval: periodic disk dumps
- --preserve-historical-states: include historical in-memory states

## Binary inspection

Anvil executable SHA256:
728DACF28595F57882FA8D8651B611B2C3BDA4428693914C5208D5607A21C33A

Embedded method names found:
- anvil_dumpState
- anvil_loadState
- evm_snapshot
- evm_revert

Binary strings do not prove live RPC availability or safety.

## Safety findings

- Account 2: 0xe28F0FFC4Fe1F20f16D8bB013C403B53c1BD1Eb1
- Account 2 balance: zero
- Account 2 nonce: zero
- Marker: 0xf04b313700000000000000000000000000000001
- Marker code: empty
- Historical active.json: present, stale
- Historical review-plan.json: present, stale
- operation.lock: absent
- State directory: absent
- state.json: absent

## Pending work

1. Phase 15E-28J: Review proposed state-export script offline.
2. Establish live RPC export behavior and serialization safely.
3. Obtain separate authorization before any state export.
4. Validate snapshot integrity and provenance.
5. Design and review production persistence launcher.
6. Resolve identity binding before scanner execution.

## Restrictions

No mainnet transactions.
No wallet funding or signing.
No Anvil restart or process termination.
No marker bootstrap or identity mutation.
No snapshot import/export without separate authorization.
No historical identity file replacement.
No credentials, private keys, RPC URLs containing secrets,
or raw state snapshots in Git.

## Evidence limitation

This report summarizes user-provided PowerShell audit outputs.
It is not a substitute for original console transcripts.
No production recovery or state restoration was performed.