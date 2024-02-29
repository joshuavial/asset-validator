import 'dotenv/config'
import express from 'express'
import http from 'http'

import path from 'path'
import {fileURLToPath} from 'url'

import cors from 'cors'

import capsecretRoutes from './capsecret'

const app = express()
const server = http.createServer(app);

export default server

app.use(cors());
app.options('*', cors()); 
app.use(express.json());

app.use(capsecretRoutes);
import axios from 'axios';
import https from 'https';

app.post('/wattbike', async (req, res) => {
  const { url } = req.body;
  if (typeof url !== 'string' || !url) {
    res.status(400).send('Invalid URL');
    return;
  }
  try {
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    const response = await axios.get(url, { httpsAgent: agent });
    console.log(response.data);
    res.send('HTML content fetched successfully');
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    res.status(500).send('Failed to fetch HTML content');
  }
}) 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
