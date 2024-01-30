import { AdminWebsocket, AppAgentWebsocket, CellType } from "@holochain/client";
import { warn } from "console";

async function main() {
  const adminWs = await AdminWebsocket.connect(new URL("ws://127.0.0.1:1234"));
  const agent_key = await adminWs.generateAgentPubKey();
  const role_name = "role";
  const installed_app_id = "asset-validator";
  let appInfo;
  const installedApps = await adminWs.listApps({ status_filter: "enabled" });
  const isAppInstalled = installedApps.some(app => app.installed_app_id === installed_app_id);

  let app;
  if (!isAppInstalled) {
      appInfo = await adminWs.installApp({
        agent_key, 
        installed_app_id,
        membrane_proofs: {},
        path: '/home/jv/clients/holo/asset-validator/happ/workdir/asset-validator.happ',
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
  if (!(CellType.Provisioned in appInfo.cell_info.asset_validator[0])) {
    process.exit();
  }
  const { cell_id } = appInfo.cell_info.asset_validator[0][CellType.Provisioned];
  await adminWs.authorizeSigningCredentials(cell_id);
  await adminWs.attachAppInterface({ port: 2345 });
  const appAgentWs = await AppAgentWebsocket.connect(
    new URL("ws://127.0.0.1:2345"),
    installed_app_id
  );

  const payload = {
    observed_at: Math.floor(Date.now()),
    data: {
      EnergyObservation: {
        from: Math.floor(Date.now()),
        to: Math.floor(Date.now()) + 3600000, // Plus one hour in milliseconds
        energy: 1000 // Example energy value in joules
      }
    }
  };

  const response = await appAgentWs.callZome({
    cell_id,
    cap_secret: null, // Ensure this is correct for your app
    role_name: 'asset_validator',
    zome_name: 'validation_claims',
    fn_name: 'create_observation',
    payload,
  }, 30000);
  console.log(response)

  await appAgentWs.appWebsocket.client.close();
  await adminWs.client.close();
}

main().catch(err => console.error(err));
