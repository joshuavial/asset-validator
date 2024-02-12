<script lang="ts">
import CreateGeneration from './asset_validator/validation_claims/CreateGeneration.svelte'
import Generations from './asset_validator/validation_claims/Generations.svelte'
import { writable } from 'svelte/store';
import { createEventDispatcher } from 'svelte';

const activeGeneration = writable(null);
const dispatch = createEventDispatcher();

function setActiveGeneration(event) {
  activeGeneration.set(event.detail.activeGeneration);
}

</script>

<div>
  <CreateGeneration />
  <Generations on:setActiveGeneration={setActiveGeneration} />
</div>
