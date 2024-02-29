import { AdminWebsocket as WS} from '@holochain/client';

const WS_URL = 'ws://localhost:1234'

async function main() {
  const client = await WS.connect(WS_URL);
  console.log('Connected to the Holochain admin server.');

  const cellIds = await client.listCellIds()
  console.log(cellIds)
  //const pubKeyBuf = await client.generateAgentPubKey()
  //console.log(pubKeyBuf)
  //const app = await client.installApp({
    //installed_app_id: 'asset-validator',
    //agent_key: pubKeyBuf,
    //membrane_proofs: {},
    //path: '/home/jv/clients/holo/asset-validator/happ/workdir/asset-validator.happ',
  //}) 
  //console.log(app)
  //const iface = await client.attachAppInterface({ port: 2345 })
  //console.log(iface)
}


main();
