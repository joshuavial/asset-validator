import fs from 'fs'

const adminPort = 1234;
const appPort = 2345;

const agentPubKeyFile = 'agent_pubkey.txt';
const dnaHash = 'your_asset_validator_dna_hash_here'; // Replace with your DNA hash
const ADMIN_URL = `ws://127.0.0.1:${adminPort}`;
const WS_URL = `ws://127.0.0.1:${appPort}`;

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
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

