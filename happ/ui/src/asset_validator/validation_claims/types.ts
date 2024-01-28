import type { 
  Record, 
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

export type EntryTypes =
 | ({ type: 'Generator'; } & Generator)
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
  creator: AgentPubKey;
  observed_at: number;
  data: ObservationData;
}

export interface Generator { 
  name: string;
}

