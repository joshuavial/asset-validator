import 'dotenv/config'
import express from 'express'
import http from 'http'
import {getAppAgentWS, getCellId} from './capsecret'

import { GrantedFunctionsType, AppAgentWebsocket, AdminWebsocket, CellType,  decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";

const ADMIN_WS_PORT = process.env.WC_ADMIN_PORT
const ADMIN_WS_URL = new URL(`ws://127.0.0.1:${ADMIN_WS_PORT}`);

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
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';

app.post('/wattbike', async (req, res) => {
  const { url, generation_hash } = req.body;
  if (typeof url !== 'string' || !url) {
    res.status(400).send('Invalid URL');
    return;
  }
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.goto(url);
    // Wait for the specific element that indicates the page has loaded
    await page.waitForSelector('.summary__segment h4 + .summary__value--large', { timeout: 10000 });
    const htmlContent = await page.content();
    const dom = new JSDOM(htmlContent);
    const energyElements = dom.window.document.querySelectorAll('.summary__segment h4 + .summary__value--large');
    const energyElement = energyElements.length > 5 ? energyElements[5] : null; // Get the sixth element
    const energyText = energyElement ? energyElement.textContent.trim() : 'Energy value not found';
    let energy = parseFloat(energyText);
    // Convert kcal to joules (1 kcal = 4184 J)
    energy = !isNaN(energy) ? energy * 4184 : 0;

    // Extract duration
    const durationElement = dom.window.document.querySelector('div[class="laps-summary-header__segment"] h3 + p');
    const durationText = durationElement ? durationElement.textContent.trim() : '0:00';

    // Convert durationText from "HH:MM:SS" or "MM:SS" to seconds
    const timeParts = durationText.split(':').map(Number);
    const durationInSeconds = timeParts.length === 3
      ? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
      : timeParts[0] * 60 + timeParts[1];

    // Extract start time
    const startTimeElement = dom.window.document.querySelector('.heading__user-date');
    const startTimeText = startTimeElement ? startTimeElement.textContent.match(/— (\d{2}\/\d{2}\/\d{2}, \d{2}:\d{2} [APM]{2}) —/)[1] : '';
    // Convert start time to a Date object
    const startTime = startTimeText ? new Date(startTimeText.replace(/(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2}) ([APM]{2})/, '20$1-$2-$3T$4:$5:00')) : new Date();
    // Convert the Date object to a Unix timestamp
    const startTimeStamp = Math.floor(startTime.getTime() / 1000);

    // Calculate the 'from' timestamp by adding the duration in seconds to the 'to' timestamp
    const fromTimeStamp = startTimeStamp + durationInSeconds;

    // Save the new observation
    let observedAt: number = Math.floor(Date.now() / 1000);
    const payload = { observed_at: observedAt, generation_hash, data: {EnergyObservation: {
      energy: energy, from: fromTimeStamp, to: startTimeStamp 
    }}};

    await browser.close();

    const adminWs = await AdminWebsocket.connect(ADMIN_WS_URL);
    const appAgentWs = await getAppAgentWS(adminWs);
    const cell_id = await getCellId('asset_validator', adminWs);
    await adminWs.authorizeSigningCredentials(cell_id);
    const record = await appAgentWs.callZome({
      cell_id,
      cap_secret: null, // Ensure this is correct for your app
      zome_name: 'validation_claims',
      fn_name: 'create_observation',
      payload,
    });
    res.send({ record });
    //await browser.close();
    //res.send({ energyText, energy, eventTimeString, durationText });
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    res.status(500).send('Failed to fetch HTML content');
  }
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
