import express from 'express'
import { GrantedFunctionsType, AppAgentWebsocket, AdminWebsocket, CellType,  decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";

const ADMIN_WS_PORT = process.env.WC_ADMIN_PORT
const ADMIN_WS_URL = new URL(`ws://127.0.0.1:${ADMIN_WS_PORT}`);

const router = express.Router()
export default router

router.post('/grant', async (req, res) => {
  const {signingKey, cellId} = req.body
  try {
    const decodedSigningKey = decodeHashFromBase64(signingKey);
    const decodedCellId = [decodeHashFromBase64(cellId[0]), decodeHashFromBase64(cellId[1])]
    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const capSecret = await adminWs.grantSigningKey(
      decodedCellId,
      { [GrantedFunctionsType.Listed]: [
        ['asset_validator', 'create_generation'],
        ['asset_validator', 'get_generations'],
        ['asset_validator', 'get_latest_generation'],
        ['eth_user', 'who_am_i'],
      ] },
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

router.get('/agent_ws', async (_, res) => {
  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const agent_ws_url = await appAgentWsURL(adminWs) 
  await adminWs.client.close()
  res.json({agent_ws_url})
})

router.post('/login_or_register', async(req, res) => {
  const { handle, ethAddress, signingKey } = req.body;
  const decodedSigningKey = decodeHashFromBase64(signingKey);
  try {
    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const cellId = await getCellId('asset_validator', adminWs);
    await authoriseCell('asset_validator', adminWs);
    const appAgentWs = await getAppAgentWS(adminWs);
    const existingUser = await appAgentWs.callZome({
      cap: null,
      cell_id: cellId,
      zome_name: 'eth_user',
      fn_name: 'get_eth_user_by_address',
      provenance: decodedSigningKey,
      payload: ethAddress,
    });

    const ethUser = { handle, eth_address: ethAddress, current_pub_key: decodedSigningKey };

    if (existingUser) {
      const updateInput = {
        original_eth_user_hash: existingUser.signed_action.hashed.hash,
        updated_eth_user: ethUser 
      };
      await appAgentWs.callZome({
        cap: null,
        cell_id: cellId,
        zome_name: 'eth_user',
        fn_name: 'update_eth_user',
        provenance: decodedSigningKey,
        payload: updateInput,
      });
    } else {
      await appAgentWs.callZome({
        cap: null,
        cell_id: cellId,
        zome_name: 'eth_user',
        fn_name: 'create_eth_user',
        provenance: decodedSigningKey,
        payload: ethUser,
      });
    }
    const capSecret = await grantCapSecret(adminWs, decodedSigningKey, cellId);
    res.status(200).send({ 
      message: 'Authentication successful',
      capSecret: encodeHashToBase64(capSecret),
    });
    await adminWs.client.close()
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).send({ message: 'Authentication failed' });
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
