import fs from 'fs'

const adminPort = 1234;
const appPort = 2345;

const agentPubKeyFile = 'agent_pubkey.txt';
const dnaHash = 'your_asset_validator_dna_hash_here'; // Replace with your DNA hash
const ADMIN_URL = `ws://localhost:${adminPort}`;
const WS_URL = `ws://localhost:${appPort}`;

import { AppAgentWebsocket as WS} from '@holochain/client';

async function main() {
  try {
    const client = await WS.connect(WS_URL, 'asset-validator');
    console.log('Connected to the Holochain conductor.');
    const info = await client.appInfo();
    console.log(info);
    console.log(client);
    const cred = client.getSigningCredentials();
    console.log(cred)

    const payload = {
      observed_at: Math.floor(Date.now()),
      data: {
        EnergyObservation: {
          from: Math.floor(Date.now()),
          to: Math.floor(Date.now()) + 3600000, // Plus one hour in milliseconds
          energy: 1000 // Example energy value in joules
        }
      }
    };

    const response = await client.callZome({
      cap_secret: null, // Ensure this is correct for your app
      role_name: 'asset_validator',
      zome_name: 'validation_claims',
      fn_name: 'create_observation',
      payload,
    });

    console.log('Zome call response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

