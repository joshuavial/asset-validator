import type { SigningCredentials, AppAgentClient} from '@holochain/client';
import {encodeHashToBase64, decodeHashFromBase64, generateSigningKeyPair, setSigningCredentials} from '@holochain/client';

export function getSigningCredentials(cellId) {
    const cellIdB64 = encodeHashToBase64(cellId[0]) + encodeHashToBase64(cellId[1]);
    const signingCredentialsJson = localStorage.getItem(cellIdB64);
    let signingCredentials: SigningCredentials | null = signingCredentialsJson && JSON.parse(signingCredentialsJson);
    return signingCredentials;
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
