//shared generation code to go here
import type { AppAgentClient, ActionHash } from '@holochain/client';
import type { GenerationWithHash } from '../types';

export async function updateGenerationStatus(client: AppAgentClient, generationWithHash: GenerationWithHash, status: string) {
    const input = {
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
