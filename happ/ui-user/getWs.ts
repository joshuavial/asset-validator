import { AdminWebsocket, AppAgentWebsocket } from "@holochain/client";

async function getWs() {
  const ADMIN_WS_URL = "ws://localhost:39973";
  const INSTALLED_APP_ID = "asset-validator";

  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const installedApps = await adminWs.listApps({ status_filter: "enabled" });
  const appInfo = installedApps.find(app => app.installed_app_id === INSTALLED_APP_ID);

  if (!appInfo) {
    throw new Error(`App with ID ${INSTALLED_APP_ID} is not installed.`);
  }

  const appAgentWs = await AppAgentWebsocket.connect(
    new URL(`ws://localhost:${appInfo.cell_data[0].cell_id[1]}`),
    INSTALLED_APP_ID
  );

  return { adminWs, appAgentWs };
}

// Example usage:
// getWs().then(connections => {
//   console.log('Admin WebSocket:', connections.adminWs);
//   console.log('App Agent WebSocket:', connections.appAgentWs);
// }).catch(console.error);
