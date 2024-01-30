import { decode } from '@msgpack/msgpack';
import {getAppAgentWs} from './lib.js'

import express from 'express'
import bodyParser from 'body-parser'
const app = express()

app.use(bodyParser.json())

const {cell_id, appAgentWs} = await getAppAgentWs()

app.post('/observation', async (req, res) => {
  console.log(req.body)
  const {from, to, energy} = req.body
  const payload = {
    observed_at: Math.floor(Date.now()),
    data: { EnergyObservation: { from, to, energy } }
  };
  const response = await appAgentWs.callZome({
    cell_id,
    cap_secret: null, // Ensure this is correct for your app
    zome_name: 'validation_claims',
    fn_name: 'create_observation',
    payload,
  });
  res.json((response.map(r => decode(r.entry.Present.entry))))
})

app.get('/observations', async (_, res) => {
  const response = await appAgentWs.callZome({
    cell_id,
    cap_secret: null, // Ensure this is correct for your app
    zome_name: 'validation_claims',
    fn_name: 'get_all_observations',
    payload: null,
  });
  res.json((response.map(r => decode(r.entry.Present.entry))))
})

app.get('*', async (_, res) => {

})

app.listen(3000, '0.0.0.0', () => {
  console.log('http://192.168.1.99:3000/observations')
})
