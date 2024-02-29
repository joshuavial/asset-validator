import 'dotenv/config'
import express from 'express'
import http from 'http'
import fs from 'fs'

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
  const { url } = req.body;
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

    console.log(`Duration extracted: ${durationText} (${durationInSeconds} seconds)`);

    console.log(`Energy value extracted: ${energyText} kcal which is ${energy} joules`);
    // Save the new observation
    const observation = { timestamp: new Date(), energyJoules: energy, durationSeconds: durationInSeconds };
    const observation = { timestamp: new Date(), energyJoules: energy };
    await browser.close();
    res.send({ observation});
    //await browser.close();
    //res.send({ energyText, energy, eventTimeString, durationText });
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    res.status(500).send('Failed to fetch HTML content');
  }
})
}) 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
