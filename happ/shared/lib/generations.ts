import { decode } from '@msgpack/msgpack';
import type { AppAgentClient, Record, ActionHash } from '@holochain/client';
import type { Generation, GenerationWithHash } from '../types';

export async function fetchGenerations(client: AppAgentClient): Promise<Array<GenerationWithHash>> {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_generations',
      payload: null,
    });
    const hashes = links.map(l => l.target);
    const generations = await Promise.all(hashes.map(async (hash) => {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'validation_claims',
        fn_name: 'get_latest_generation',
        payload: hash,
      });
      let g = decode((record.entry as any).Present.entry) as Generation;
      return {generation: g, hash, action: record.signed_action} as GenerationWithHash;
    })) as Array<GenerationWithHash>;
    return generations;
  } catch (e) {
    throw e;
  }
}

export async function fetchGeneration(client: AppAgentClient, generationHash: ActionHash): Promise<{record: Record, generation: Generation, timeAgo: string, observations: Observation[]}> {
  let loading = true;
  let error: any = undefined;
  let record: Record | undefined;
  let generation: Generation | undefined;
  let timeAgo: string | undefined;
  let observations: Observation[] = [];

  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'get_latest_generation',
      payload: generationHash,
    });
    if (record) {
      generation = decode((record.entry as any).Present.entry) as Generation;
      timeAgo = formatTimeAgo(record.signed_action.hashed.content.timestamp);
      observations = await get_observations_for_generation(client, generationHash);
    }
  } catch (e) {
    error = e;
    throw e;
  }

  loading = false;
  return { record, generation, timeAgo, observations };
}

export async function updateGenerationStatus(client: AppAgentClient, originalGenerationHash: ActionHash, generationWithHash: GenerationWithHash, status: string) {
    const input = {
      original_generation_hash: originalGenerationHash,
      previous_generation_hash: generationWithHash.hash,
      updated_generation: {
        ...generationWithHash.generation,
        status: {type: status},
      }
    };
    try {
      const updatedRecord = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'validation_claims',
        fn_name: 'update_generation',
        payload: input,
      });
      return updatedRecord.entry as GenerationWithHash;
    } catch (error) {
      console.error('Error updating generation status:', error);
      throw error;
    }
  };
