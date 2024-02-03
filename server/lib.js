import { CellType, AppAgentWebsocket, AdminWebsocket} from "@holochain/client";
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { dirname } from 'path';

export async function getAppAgentWs() {
  const installed_app_id = "asset-validator";
  const adminWs = await AdminWebsocket.connect(new URL("ws://localhost:1234"));
  const appInfo = await findOrInstallHapp(adminWs, installed_app_id);
  const cell_id = await activateCell(appInfo, adminWs);
  const appAgentWs = await appAgentWebsocket(adminWs, installed_app_id);
  return {cell_id, appAgentWs}
}

/*** internal functions **/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HAPP_PATH = path.join(__dirname, '../happ/workdir/asset-validator.happ')
const AGENT_PUB_KEY_PATH = path.join(__dirname, 'agent-pub-key.txt');

async function loadAgentPubKey() {
  try {
    return readFileSync(AGENT_PUB_KEY_PATH, 'utf8');
  } catch (error) {
    console.error('Error reading agent public key from file:', error);
    return null;
  }
}

async function saveAgentPubKey(agentPubKey) {
  try {
    writeFileSync(AGENT_PUB_KEY_PATH, agentPubKey, 'utf8');
    console.log('Agent public key saved to file.');
  } catch (error) {
    console.error('Error writing agent public key to file:', error);
  }
}

async function findOrInstallHapp(adminWs, installed_app_id) {
  let agent_key = await loadAgentPubKey();
  if (!agent_key) {
    agent_key = await adminWs.generateAgentPubKey();
    await saveAgentPubKey(agent_key);
  }
  let appInfo;
  const installedApps = await adminWs.listApps({ status_filter: "enabled" });
  const isAppInstalled = installedApps.some(app => app.installed_app_id === installed_app_id);

  let app;
  if (!isAppInstalled) {
      appInfo = await adminWs.installApp({
        agent_key, 
        installed_app_id,
        membrane_proofs: {},
        //network_seed: 'test-1',
        path: HAPP_PATH,
      }); 
      await adminWs.enableApp({ installed_app_id });
  }
  else {
    app = installedApps.find(app => app.installed_app_id === installed_app_id);
    if (!app) {
      throw new Error(`Installed app with ID ${installed_app_id} not found.`);
    }
    appInfo = app;
  }
  await adminWs.enableApp({ installed_app_id });
  return appInfo
}

async function activateCell(appInfo, adminWs) {
  if (!(CellType.Provisioned in appInfo.cell_info.asset_validator[0])) {
    process.exit();
  }
  const { cell_id } = appInfo.cell_info.asset_validator[0][CellType.Provisioned];
  await adminWs.authorizeSigningCredentials(cell_id);
  return cell_id
}

async function appAgentWebsocket(adminWs, installed_app_id) {
  try {
    await adminWs.attachAppInterface({ port: 2345 });
  } catch (e) {
    console.log(e)
  }
  const appAgentWs = await AppAgentWebsocket.connect(
    new URL("ws://localhost:2345"),
    installed_app_id
  );
  return appAgentWs
}
