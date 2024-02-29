import express from 'express'
import { decode } from '@msgpack/msgpack';
import { GrantedFunctionsType, AppAgentWebsocket, AdminWebsocket, CellType,  decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";

const ADMIN_WS_PORT = process.env.WC_ADMIN_PORT
const ADMIN_WS_URL = new URL(`ws://127.0.0.1:${ADMIN_WS_PORT}`);

const SENSOR_1 = 'sensor_1';
const SENSOR_2 = 'sensor_2';

const sensor_allocations = {
  [SENSOR_1]: null,
  [SENSOR_2]: null,
}

const router = express.Router()
export default router

router.post('/grant', async (req, res) => {
  const {signingKey, cellId} = req.body
  try {
    const decodedSigningKey = decodeHashFromBase64(signingKey);
    const decodedCellId = [decodeHashFromBase64(cellId[0]), decodeHashFromBase64(cellId[1])]
    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const capSecret = await grantCapSecret(adminWs, decodedSigningKey, decodedCellId);
    await adminWs.client.close()
    res.json({capSecret: encodeHashToBase64(capSecret)})
  } catch (e) {
    console.log(e)
    await adminWs.client.close()
    res.status(500)
  }
})

router.post('/allocate_sensor', async (req, res) => {
  const {sensor, generation_hash} = req.body
  sensor_allocations[sensor] = generation_hash
  res.json(sensor_allocations);
})

router.get('/sensor_allocations', async (_, res) => {
  res.json(sensor_allocations)
})

router.post('/agent_ws', async (_, res) => {
  //TODO check for password in the body that matches ADMIN_SECRET env var
  //return 403 if it does not match
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const agent_ws_url = await appAgentWsURL(adminWs) 
  await adminWs.client.close()
  res.json({agent_ws_url})
})

router.get('/network', async (_, res) => {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const response = await adminWs.dumpNetworkStats();
  await adminWs.client.close()
  res.json(JSON.parse(response))
})

router.post('/observation', async(req, res) => {
  console.log(req.body);
  try {
    const {from, to, energy, sensor} = req.body
    if (!sensor_allocations[sensor]) {
      console.log('no sensor', sensor);
      console.log(sensor_allocations);
      res.status(400).send('no generation allocated to this sensor');
      return
    }
    const payload = {
      observed_at: Math.floor(Date.now() / 1000),
      generation_hash: sensor_allocations[sensor],
      data: { EnergyObservation: { from, to, energy } }
    };
    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const appAgentWs = await getAppAgentWS(adminWs);
    const cell_id = await getCellId('asset_validator', adminWs);
    await adminWs.authorizeSigningCredentials(cell_id);
    const response = await appAgentWs.callZome({
      cell_id,
      cap_secret: null, // Ensure this is correct for your app
      zome_name: 'validation_claims',
      fn_name: 'create_observation',
      payload,
    });
    res.json(decode(response.entry.Present.entry))
    adminWs.client.close();
  } catch (e) {
    console.log(e)
    res.status(500)
  }
})

async function authoriseCell(role, adminWs) {
  const cell_id = await getCellId(role, adminWs)
  await adminWs.authorizeSigningCredentials(cell_id);
}

async function getAppAgentWS(adminWs) {
  return await AppAgentWebsocket.connect(
    await appAgentWsURL(adminWs),
    'asset-validator'
  )
}

async function appAgentWsURL(adminWs) {
  const appInterfaces = await adminWs.listAppInterfaces();
  console.log(appInterfaces[0]);
  return `ws://${process.env.USER_DOMAIN}:${process.env.AGENT_APP_AGENT_WS_PROXY_PORT}`;
}

async function grantCapSecret(adminWs, signingKey, cellId) {
  const capSecret = await adminWs.grantSigningKey(
    cellId,
    { [GrantedFunctionsType.All]: null },
    signingKey
  );
  return capSecret

}

async function getCellId(role, adminWs) {
  const appInterfaces = await adminWs.listApps({});
  const appInfo = appInterfaces[0];
  if (!(CellType.Provisioned in appInfo.cell_info[role][0])) {
    console.log(`${asset_validator} cell not provisioned`)
    return
  }
  const { cell_id } = appInfo.cell_info[role][0][CellType.Provisioned];
  return cell_id
}
