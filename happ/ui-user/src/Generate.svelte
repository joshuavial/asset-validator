<script lang="ts">
import CreateGeneration from './asset_validator/validation_claims/CreateGeneration.svelte'
import Generations from './asset_validator/validation_claims/Generations.svelte'
import ActiveGeneration from './ActiveGeneration.svelte'
import type {GenerationWithHash} from './asset_validator/validation_claims/types';

import { writable } from 'svelte/store';

const activeGeneration = writable<GenerationWithHash>(null);

function setActiveGeneration(event) {
  activeGeneration.set(event.detail.activeGeneration);
}

</script>

<div>
{#if $activeGeneration}  
  <ActiveGeneration activeGeneration={$activeGeneration} on:setActiveGeneration={setActiveGeneration} />
{:else}
  <CreateGeneration />
{/if}
  <Generations on:setActiveGeneration={setActiveGeneration} />
</div>
