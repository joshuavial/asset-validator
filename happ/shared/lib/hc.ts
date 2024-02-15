import { decode } from '@msgpack/msgpack';

export async function get_observations_for_generation(client, generation_hash) {
  const records = await client.callZome({
    cap_secret: null,
    role_name: 'asset_validator',
    zome_name: 'validation_claims',
    fn_name: 'get_observations_for_generation',
    payload: generation_hash,
  });
  return records.map(record => decode((record.entry as any).Present.entry) as Observation);
}
