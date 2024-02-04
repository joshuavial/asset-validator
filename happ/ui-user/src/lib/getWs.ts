//hacky script to get the appagentwebsocket port
import { AdminWebsocket, AppAgentWebsocket } from "@holochain/client";

export async function getWsURL() {
  //copy the admin ws url from holochain playground
  console.log(process)
export async function getWsURL() {
  const ADMIN_WS_URL = `ws://127.0.0.1:${import.meta.env.VITE_WC_ADMIN_PORT}`;
  const INSTALLED_APP_ID = "asset-validator";

  const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
  const appInterfaces = await adminWs.listAppInterfaces();
  //paste this into your ui App.svelte
  return (`ws://127.0.0.1:${appInterfaces[0]}`);
}

 //getWsURL().then(console.log);
