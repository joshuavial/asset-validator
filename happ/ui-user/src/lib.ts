import type { SigningCredentials, AppAgentClient} from '@holochain/client';
import {AppAgentWebsocket, encodeHashToBase64, decodeHashFromBase64, generateSigningKeyPair, setSigningCredentials} from '@holochain/client';
import { decode } from '@msgpack/msgpack';

export function cellIdFromClient(client) {
    return client.cachedAppInfo.cell_info.asset_validator[0].provisioned.cell_id;
}

export async function newAppAgentWebsocket() {
    let response = await fetch('http://127.0.0.1:5000/agent_ws');
    let data = await response.json();
    let url = data.agent_ws_url;
    return await AppAgentWebsocket.connect(new URL(url), 'asset-validator');
}

export function saveSigningCredentials(cellId, credentials) {
    const cellIdB64 = encodeHashToBase64(cellId[0]) + encodeHashToBase64(cellId[1]);
    const encodedCredentials = {
      capSecret: encodeHashToBase64(credentials.capSecret),
      signingKey: encodeHashToBase64(credentials.signingKey),
      keyPair: {
        publicKey: encodeHashToBase64(credentials.keyPair.publicKey),
        privateKey: encodeHashToBase64(credentials.keyPair.privateKey),
        keyType: credentials.keyPair.keyType,
      }
    }
    localStorage.setItem(cellIdB64, JSON.stringify(encodedCredentials));
}

export function getSigningCredentials(cellId) {
    const cellIdB64 = encodeHashToBase64(cellId[0]) + encodeHashToBase64(cellId[1]);
    const signingCredentialsJson = localStorage.getItem(cellIdB64);
    let encodedCredentials = signingCredentialsJson && JSON.parse(signingCredentialsJson);
    if (encodedCredentials) {
      return {
        capSecret: decodeHashFromBase64(encodedCredentials.capSecret),
        signingKey: decodeHashFromBase64(encodedCredentials.signingKey),
        keyPair: {
          publicKey: decodeHashFromBase64(encodedCredentials.keyPair.publicKey),
          privateKey: decodeHashFromBase64(encodedCredentials.keyPair.privateKey),
          keyType: encodedCredentials.keyPair.keyType,
        }
      }
    }
    return null
}

export async function getAgentWsUrl() {
  const response = await fetch('http://127.0.0.1:5000/agent_ws');
  if (!response.ok) {
    throw new Error('Failed to fetch agent websocket URL');
  }
  return response.json();
}
export async function createSigningCredentials(cellId) {
    const [keyPair, signingKey] = await generateSigningKeyPair();
    response = await fetch('http://127.0.0.1:5000/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signingKey: encodeHashToBase64(signingKey),
        cellId: [encodeHashToBase64(cellId[0]), encodeHashToBase64(cellId[1])]
      })
    });
    data = await response.json();
    const capSecret = decodeHashFromBase64(data.capSecret);
    signingCredentials = { capSecret, keyPair, signingKey};
    localStorage.setItem(cellIdB64, JSON.stringify(signingCredentials));
    return signingCredentials
}

export async function whoAmI(client: AppAgentClient, signingKey) {
    const record = await client.callZome({
      cap_secret: null,
      role_name: 'asset_validator',
      zome_name: 'eth_user', 
      fn_name: 'who_am_i',
      payload: {
        agent_pub_key: signingKey
      }
    })
    if (record) {
      return decode((record.entry as any).Present.entry) as EthUser;
    } else {
      console.error('Error calling whoAmI zome function:', response);
      return null;
    }

}
