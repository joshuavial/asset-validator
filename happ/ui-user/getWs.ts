//hacky script to get the appagentwebsocket port
import { AdminWebsocket, AppAgentWebsocket } from "@holochain/client";

export async function getWsURL() {
  //copy the admin ws url from holochain playground
  const ADMIN_WS_URL = "ws://localhost:39973";
  const INSTALLED_APP_ID = "asset-validator";

  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const appInterfaces = await adminWs.listAppInterfaces();
  //paste this into your ui App.svelte
  return (`ws://127.0.0.1:${appInterfaces[0]}`);
}

 //getWsURL().then(console.log);
