import express from 'express'
import cors from 'cors'
import { GrantedFunctionsType, AdminWebsocket, decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";

const ADMIN_WS_PORT = process.env.WC_ADMIN_PORT
const ADMIN_WS_URL = new URL(`ws://127.0.0.1:${ADMIN_WS_PORT}`);

const app = express()
app.use(cors());
app.use(express.json());
app.options('*', cors()); 

app.post('/grant', async (req, res) => {
  const {signingKey, cellId} = req.body
  try {
    const decodedSigningKey = decodeHashFromBase64(signingKey);
    const decodedCellId = [decodeHashFromBase64(cellId[0]), decodeHashFromBase64(cellId[1])]
    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const capSecret = await adminWs.grantSigningKey(
      decodedCellId,
      { [GrantedFunctionsType.All]: null },
      decodedSigningKey
    );
    await adminWs.client.close()
    res.json({capSecret: encodeHashToBase64(capSecret)})
  } catch (e) {
    console.log(e)
    await adminWs.client.close()
    res.status(500)
  }
})

app.get('/agent_ws', async (_, res) => {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const appInterfaces = await adminWs.listAppInterfaces();
  const agent_ws_url = `ws://127.0.0.1:${appInterfaces[0]}`;
  res.json({agent_ws_url})
  await adminWs.client.close()
})

app.post('/register', async(req, res) => {
  const { handle, password, ethAddress } = req.body;
  // Here you would add the logic to handle the registration, e.g., storing the user data.
  // This is a placeholder for the actual registration logic.
  try {
    // Placeholder for registration logic
    // For example: await registerUser(handle, password, ethAddress);
    res.status(200).send({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send({ message: 'Registration failed' });
  }
})

}


export default app

