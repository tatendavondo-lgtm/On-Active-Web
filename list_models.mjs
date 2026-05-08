import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) key = line.split('=')[1].trim();
}

const genAI = new GoogleGenerativeAI(key);

async function listModels() {
  console.log("Listing available models...");
  try {
    // Note: The SDK doesn't have a direct listModels, we have to use the REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
