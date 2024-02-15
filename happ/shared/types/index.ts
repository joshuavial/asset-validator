import type { EthUserEntryTypes } from './eth_user';
import type { ValidationClaimsEntryTypes } from './validation_claims';

export * from './eth_user';
export * from './validation_claims';
export type EntryTypes = EthUserEntryTypes | ValidationClaimsEntryTypes
