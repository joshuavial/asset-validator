<script lang="ts">
import type { GenerationWithHash } from './asset_validator/validation_claims/types';
import { formatDistanceToNow } from 'date-fns';

export let activeGeneration: GenerationWithHash;
let timestamp = new Date(activeGeneration.record.signed_action.hashed.content.timestamp);
let timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

</script>

<h1>Your generation</h1>
<p>Generated {timeAgo}</p>
{activeGeneration.record}
