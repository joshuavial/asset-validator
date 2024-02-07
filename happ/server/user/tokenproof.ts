const TOKENPROOF_APP_ID = '8f4c17b8-ec77-4cf2-9b1d-78e2832141de'

export function addTokenProofRoutes(server, wsServer) {
  server.post('/token-proof', (req, res) => {
    const { nonce, account } = req.body;
    // Assuming there is a global map object to store nonce-account mappings
    global.nonceToAccountMap.set(nonce, account);
    res.status(200).send({ message: 'Nonce mapped to account successfully' });
  })

  server.post('/get-token-proof', async (req, res) => {
    const { signingKey } = req.body;
    try {
      const response = await fetch(`https://auth.tokenproof.xyz/v1/simple/${TOKENPROOF_APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-API-KEY': TOKENPROOF_API_KEY
        },
        body: JSON.stringify({
          nonce: signingKey,
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

}
