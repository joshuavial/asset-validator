import type { SigningCredentials, AppAgentClient } from '@holochain/client';
import { AppAgentWebsocket, encodeHashToBase64, decodeHashFromBase64, generateSigningKeyPair } from '@holochain/client';
import { decode, encode } from '@msgpack/msgpack';

const VITE_AGENT_DOMAIN = import.meta.env.VITE_AGENT_DOMAIN;
if (!VITE_AGENT_DOMAIN) {
  throw new Error('VITE_AGENT_DOMAIN is not defined');
}

export function cellIdFromClient(client) {
    return client.cachedAppInfo.cell_info.asset_validator[0].provisioned.cell_id;
}

export async function newAppAgentWebsocket(password) {
    let response = await fetch('http://' + VITE_AGENT_DOMAIN + '/agent_ws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      return null;
    }
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
  const response = await fetch('http://' + VITE_AGENT_DOMAIN + '/agent_ws');
  if (!response.ok) {
    throw new Error('Failed to fetch agent websocket URL');
  }
  return response.json();
}
export async function createSigningCredentials(cellId, password) {
    const [keyPair, signingKey] = await generateSigningKeyPair();
    const response = await fetch('http://' + VITE_AGENT_DOMAIN + '/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password,
        signingKey: encodeHashToBase64(signingKey),
        cellId: [encodeHashToBase64(cellId[0]), encodeHashToBase64(cellId[1])]
      })
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const capSecret = decodeHashFromBase64(data.capSecret);
    const signingCredentials = { capSecret, keyPair, signingKey};
    saveSigningCredentials(cellId, signingCredentials);
    return signingCredentials
}

export async function whoAmI(client: AppAgentClient, signingKey) {
  try {
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
    }
      throw new Error('User not found')
  } catch (e) {
    console.log(e)
    return null
  }
}

export async function getSensorAllocations() {
  const response = await fetch(`http://${VITE_AGENT_DOMAIN}/sensor_allocations`);
  if (!response.ok) {
    throw new Error('Failed to fetch sensor allocations');
  }
  return response.json();
}

export async function allocateSensor(sensor: string, generationHash: string | null) {
  const generationHashB64 = generationHash ? encodeHashToBase64(generationHash) : null;
  const response = await fetch(`http://${VITE_AGENT_DOMAIN}/allocate_sensor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sensor, generation_hash: generationHashB64 })
  });
  if (!response.ok) {
    throw new Error('Failed to allocate sensor');
  }
  return response.json();
}


export async function submitWattbikeUrl(wattbikeUrl) {
  try {
    const response = await fetch('http://' + VITE_AGENT_DOMAIN + '/wattbike', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: wattbikeUrl })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Handle the response from the API
  } catch (error) {
    console.error('Error submitting wattbike URL:', error);
  }
}
