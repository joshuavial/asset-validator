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
    res.json({capSecret: encodeHashToBase64(capSecret)})
  } catch (e) {
    console.log(e)
    res.status(500)
  }
})

app.get('/agent_ws', async (_, res) => {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const appInterfaces = await adminWs.listAppInterfaces();
  const agent_ws_url = `ws://127.0.0.1:${appInterfaces[0]}`;
  res.json({agent_ws_url})
})


export default app

