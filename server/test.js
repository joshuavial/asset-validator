WS_URL = 'ws://localhost:34783'
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:34783';

const ws = new WebSocket(WS_URL);

ws.on('open', function open() {
  console.log('Connected to the server.');
  const createGeneratorMessage = {
    type: 'create_generator',
    payload: {
      name: 'Example Generator Name'
    }
  };
  ws.send(JSON.stringify(createGeneratorMessage));
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
