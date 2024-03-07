import fs from 'fs'

const adminPort = 1234;
const appPort = 2345;

const agentPubKeyFile = 'agent_pubkey.txt';
const dnaHash = 'your_asset_validator_dna_hash_here'; // Replace with your DNA hash
const ADMIN_URL = `ws://127.0.0.1:${adminPort}`;
const WS_URL = `ws://127.0.0.1:${appPort}`;

import { AppAgentWebsocket as WS} from '@holochain/client';
import {getAppAgentWs} from './lib.js'



async function main() {
  try {
		const {cell_id, appAgentWs, adminWs} = await getAppAgentWs();
		const dnas = await adminWs.listDnas();
    console.log('hi');
		console.log(dnas);
    const client = await WS.connect(WS_URL, 'asset-validator');
    console.log('Connected to the Holochain conductor.');
		const info2 = await client.appInfo();
		console.log('info 2: ',info2);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

