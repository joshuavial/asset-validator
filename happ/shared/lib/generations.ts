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
