const { AppWebsocket } = require('@holochain/conductor-api');
const { AppWebsocket } = require('@holochain/conductor-api');

const WS_URL = 'ws://localhost:34783';

let appWebsocket;

ws.on('open', function open() {
  console.log('Connected to the server.');
  AppWebsocket.connect(WS_URL).then(appWs => {
    const createObservationMessage = {
      type: 'create_observation',
      payload: {
        observed_at: Math.floor(Date.now() / 1000),
        data: {
AppWebsocket.connect(WS_URL).then(appWs => {
  appWebsocket = appWs;
  console.log('Connected to the Holochain conductor.');
  const createObservationMessage = {
    type: 'create_observation',
    payload: {
      observed_at: Math.floor(Date.now() / 1000),
      data: {
        EnergyObservation: {
          from: Math.floor(Date.now() / 1000),
          to: Math.floor(Date.now() / 1000) + 3600,
          energy: 1000 // Example energy value in joules
        }
      }
    }
  };
  appWebsocket.callZome(/* parameters for the zome call here */);
});

ws.on('message', function incoming(data) {
  console.log('Received message:', data);
});
ws.on('close', function handleClose(code, reason) {
  console.log(`WebSocket closed with code: ${code} and reason: ${reason}`);
});
