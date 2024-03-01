import 'dotenv/config'
import express from 'express'
import http from 'http'
import fs from 'fs'

import path from 'path'
import {fileURLToPath} from 'url'

import cors from 'cors'

import {addTokenProofRoutes} from './tokenproof'
import capsecretRoutes from './capsecret'

import Websocket from 'ws'

const app = express()
const server = http.createServer(app);
const wss = new Websocket.Server({ server });

export default server

app.use(cors());
app.options('*', cors()); 
app.use(express.json());

addTokenProofRoutes(app, wss);
app.use(capsecretRoutes);

app.post('/waiver', (req, res) => {
  const {waiver} = req.body;
  fs.appendFile('waiver.txt', `${JSON.stringify(waiver)}\n`, (err) => {
    if (err) {
      console.error('Error appending to waiver.txt:', err);
      res.status(500).send('Error writing waiver');
      return;
    }
    res.status(200).send('Waiver recorded');
  });
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
