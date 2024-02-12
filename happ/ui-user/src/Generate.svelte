<script lang="ts">
import CreateGeneration from './asset_validator/validation_claims/CreateGeneration.svelte'
import Generations from './asset_validator/validation_claims/Generations.svelte'
import { writable } from 'svelte/store';

</script>

<script>
  export const activeGeneration = writable(null);
</script>

<div>
  <CreateGeneration />
  <Generations />
</div>
