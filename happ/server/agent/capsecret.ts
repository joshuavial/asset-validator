import express from 'express'
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

router.get('/agent_ws', async (_, res) => {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const agent_ws_url = await appAgentWsURL(adminWs) 
  await adminWs.client.close()
  res.json({agent_ws_url})
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
  return `ws://127.0.0.1:${appInterfaces[0]}`;
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
