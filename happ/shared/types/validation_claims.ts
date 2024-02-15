import type { 
  Record, 
  Action,
  ActionHash,
  DnaHash,
  SignedActionHashed,
  EntryHash, 
  AgentPubKey,
  Create,
  Update,
  Delete,
  CreateLink,
  DeleteLink
} from '@holochain/client';

export type ValidationClaimsSignal = {
  type: 'EntryCreated';
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: 'EntryUpdated';
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: 'EntryDeleted';
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: 'LinkCreated';
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: 'LinkDeleted';
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

export type ValidationClaimsEntryTypes =
 | ({ type: 'Generation'; } & Generation)
 | ({  type: 'Observation'; } & Observation);

export interface ImageData {
  image_data: string;
}

export interface EnergyData {
  from: number; // Timestamp in milliseconds
  to: number; // Timestamp in milliseconds
  energy: number; // joules, +ve = generation, -ve = consumption
}

export type ObservationData = { ImageObservation: ImageData } | { EnergyObservation: EnergyData };

export interface Observation {
  observed_at: number;
  data: ObservationData;
}

export interface GenerationStatus {
  type:  
    | 'Active' | 'Complete' | 'Cancelled' | 'Processed'
    ;
}

export interface Generation { 
  user_handle: string
  user_address: string;
  status: GenerationStatus;
  signature?: string;
}

export interface GenerationWithHash {
  generation: Generation;
  hash: ActionHash;
  action: Action;
}

