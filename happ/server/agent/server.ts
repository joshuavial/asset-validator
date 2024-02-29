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
    const energy = energyElement ? energyElement.textContent.trim() : 'Energy value not found';
    fs.writeFileSync('wattbike.html', htmlContent);
    console.log(`Energy value extracted: ${energy}`);
    await browser.close();
    res.send({ htmlContent, energy });
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    res.status(500).send('Failed to fetch HTML content');
  }
}) 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
