# Asset Validator
A proof of concept holochain application for validating data that can be referenced onchain using semi-fungible tokens


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
