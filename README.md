# Asset Validator
A proof of concept holochain application for validating data that can be referenced onchain using semi-fungible tokens

## Installation
- install nix
- `nix flake update` to make sure you have most recent version of holochain
- `nix develop` to launch a shell with holochain

## Running
- `npm run start` to launch holochain playground
- `npm run start:user` to launch user facing application


# Design notes
- Generator creates generation claim
  - {start time, end time, power generated}
  - set of observations
- Observer publishes observations (maybe device, maybe person)
  - {time, volts, amps }
- Issuer publishes issuance
  - generator claim (with reference back)
  - link to onchain transaction (including to / from address)
- Auditor (/public)
  - search based on on chain data - to / from address, transaction id


Issuance
- issuer offers - links to generator claim
- generator accepts, passes in payment address - freezes claim, updates claim with link to issuance entity
- issuer updates with transaction record, issuance complete
- TBC logic if issuer ghosts transaction?

## MVP
- 
- SFT testnet - https://sft-template-git-pvblox-demo-hardingjam.vercel.app/token/0x4af2cb3580ddd8b29ec83b809af01d7508d9a4c9
