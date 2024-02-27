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
  if (!imageData) {
    errorSnackbar.labelText = 'No image selected.';
    errorSnackbar.show();
    return;
  }

  // Ensure the image is resized and under the 2MB limit
  console.log(imageData);
  if (imageData.length * (3/4) > 2 * 1024 * 1024) {
    errorSnackbar.labelText = 'Image is too large after resizing. Please select a smaller image.';
    errorSnackbar.show();
    return;
  }

  if (typeof imageData === 'string') {
    try {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'asset_validator',
        zome_name: 'validation_claims',
        fn_name: 'create_observation',
        payload: {
          observation: {
            observed_at: Math.floor(Date.now() / 1000),
            data: {
              ImageObservation: {
               image_data: imageData
              }
            },
          },
          generation_hash: generationRecord.signed_action.hashed.hash,
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
      resizeImage(input.files[0]).then(resizedImage => {
        imageData = resizedImage;
      }).catch(error => {
        errorSnackbar.labelText = `Error resizing the image: ${error}`;
        errorSnackbar.show();
      });
  }
}
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate the new dimensions to maintain the aspect ratio
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to desired file format
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
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

