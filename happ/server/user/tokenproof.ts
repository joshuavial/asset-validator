import 'dotenv/config'
import url from 'url'
import WebSocket from 'ws'

const TOKENPROOF_APP_ID = process.env.TOKENPROOF_APP_ID
const USER_DOMAIN = process.env.USER_DOMAIN

const keyToWs = new Map()
const keyToAddress = new Map()

export function addTokenProofRoutes(app, wss) {
  app.post('/token-proof', (req, res) => {
    const { account } = req.body;
    const nonce = req.body.nonce.substring(0, req.body.nonce.lastIndexOf('-'));
    const client = keyToWs.get(nonce);
    keyToAddress.set(nonce, account);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({address: account}));
    } else {
      console.log(`Client with key ${nonce} not found or connection is not open.`);
    }
    res.sendStatus(200)
  })

  app.post('/get-token-proof', async (req, res) => {
    const { signingKey } = req.body;
    try {
      const response = await fetch(`https://auth.tokenproof.xyz/v1/simple/${TOKENPROOF_APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-API-KEY': TOKENPROOF_API_KEY
        },
        body: JSON.stringify({
          nonce: signingKey + '-' + Date.now(),
          back_url: 'http://' + USER_DOMAIN + ':8080/?action=register'
        })
      });

      if (!response.ok) {
        throw new Error(`Tokenproof API request failed: ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Tokenproof API error:', error);
      res.status(500).send({ message: 'Tokenproof API request failed' });
    }
  })

  wss.on('connection', (ws, request) => {
    const { query } = url.parse(request.url, true);
    const signingKey = query.signingKey;
    console.log('connecting')

    if (!signingKey) {
      ws.close();
      return;
    }
    console.log('connected', signingKey)
    console.log(keyToAddress);

    keyToWs.set(signingKey, ws);

    if (keyToAddress.has(signingKey)) {
      console.log('address found')
      ws.send(JSON.stringify({address: keyToAddress.get(signingKey)})); 
    }

    ws.on('close', () => {
      keyToWs.delete(signingKey);
      console.log(`Connection with client ${signingKey} closed`);
    });
  });

  

}
