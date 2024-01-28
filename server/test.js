const WebSocket = require('ws');

const WS_URL = 'ws://localhost:34783';

const ws = new WebSocket(WS_URL);

ws.on('open', function open() {
  console.log('Connected to the server.');
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
  ws.send(JSON.stringify(createObservationMessage));
});

ws.on('message', function incoming(data) {
  console.log('Received message:', data);
});

ws.on('error', function handleError(error) {
  console.error('WebSocket error:', error);
});

ws.on('close', function handleClose(code, reason) {
  console.log(`WebSocket closed with code: ${code} and reason: ${reason}`);
});
