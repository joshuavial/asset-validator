<script lang="ts">
import type { GenerationWithHash } from './asset_validator/validation_claims/types';
import { formatDistanceToNow } from 'date-fns';

export let activeGeneration: GenerationWithHash;
let timestamp = new Date(activeGeneration.action.hashed.content.timestamp / 1000);
let timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

</script>

<h1>Your generation</h1>
<p>Created {timeAgo}</p>
<p>Status : {activeGeneration.generation.status.type} </p>
