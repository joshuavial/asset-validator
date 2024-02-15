<script lang="ts">
import '@material/mwc-circular-progress';
import type { Observation } from './types';
import '@material/mwc-circular-progress';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';

import {formatTimeAgo} from '../../../../shared/lib';

export let observation: Observation;
</script>


<div style="display: flex; flex-direction: column">
  Observed { formatTimeAgo(observation.observed_at) }
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
