<script lang="ts">
import { createEventDispatcher, getContext } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Generation } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

export let generationRecord: Record<Generation>;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();
const dispatch = createEventDispatcher();

let imageData: string | ArrayBuffer | null = '';
let errorSnackbar: Snackbar;

async function uploadImage() {
  if (typeof imageData === 'string') {
    try {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'validation_claims',
        fn_name: 'create_observation',
        payload: {
          observed_at: Math.floor(Date.now() / 1000),
          data: {
            ImageObservation: {
              image_data: imageData
            }
          },
          // Assuming the generationRecord contains the necessary link information
          // for the observation to be associated with the generation.
          // This might need to be adjusted based on the actual data structure.
          generation_record: generationRecord
        },
      });
      dispatch('image-uploaded', { observationHash: record.signed_action.hashed.hash });
    } catch (e) {
      errorSnackbar.labelText = `Error uploading the image: ${e}`;
      errorSnackbar.show();
    }
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageData = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

<div style="display: flex; flex-direction: column">
  <input type="file" id="imageInput" accept="image/*" on:change={handleFileChange} />
  <mwc-button 
    raised
    label="Upload Image"
    on:click={uploadImage}
    disabled={!imageData}
  ></mwc-button>
</div>
