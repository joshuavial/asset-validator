import express from 'express'
import cors from 'cors'
import { GrantedFunctionsType, AdminWebsocket} from "@holochain/client";

const ADMIN_WS_PORT = process.env.WC_ADMIN_PORT
const ADMIN_WS_URL = new URL(`ws://127.0.0.1:${ADMIN_WS_PORT}`);

const app = express()
app.use(cors());
app.use(express.json());
app.options('*', cors()); 

export async function getAgentWsURL() {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const appInterfaces = await adminWs.listAppInterfaces();
  return (`ws://127.0.0.1:${appInterfaces[0]}`);
}

app.post('/grant', async (req, res) => {
  const {signingKey, keyPair} = req.body
  const cell_id = ''
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const capSecret = await adminWs.grantSigningKey(
    cell_id,
    { [GrantedFunctionsType.All]: null },
    signingKey
  );
  const signingCredentials = {
    capSecret,
    keyPair,
    signingKey,
  };
  res.json({signingCredentials})
})

app.get('/agent_ws', async (_, res) => {
  const agent_ws_url = await getAgentWsURL()
  res.json({agent_ws_url})
})


export default app
