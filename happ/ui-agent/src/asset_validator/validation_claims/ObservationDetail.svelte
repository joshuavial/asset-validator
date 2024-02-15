<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { Observation, EnergyData } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

import {formatTimeAgo} from '../../../../shared/lib';

export let observation: Observation;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

</script>


<div style="display: flex; flex-direction: column">
  {observation.observed_at}
  Observed at { formatTimeAgo(observation.observed_at) }
  {#if observation.data.EnergyObservation}
  <div style="margin-bottom: 16px">
    <span>
      <strong>Energy Usage:</strong> { observation.data.EnergyObservation.energy } joules from
      { new Date(observation.data.EnergyObservation.from * 1000).toLocaleString() } to
      { new Date(observation.data.EnergyObservation.to * 1000).toLocaleString() }
    </span>
  </div>
  {/if}
  {#if observation.data.ImageObservation}
  <div style="margin-bottom: 16px">
    <img src={observation.data.ImageObservation.image_data} alt="Observed Image" width="400" height="400">
  </div>
  {/if}

</div>
