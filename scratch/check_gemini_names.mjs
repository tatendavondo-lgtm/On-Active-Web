import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('GEMINI_API_KEY=')) {
    key = line.split('=')[1].trim();
  }
}

async function listGeminiModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await response.json();
  if (data.models) {
    const allNames = data.models.map(m => m.name);
    console.log("Is 'models/gemini-2.5-flash' present?", allNames.includes('models/gemini-2.5-flash'));
    
    const matching25 = allNames.filter(n => n.includes('2.5-flash') || n.includes('gemini-1.5-flash') || n.includes('gemini-2.0-flash'));
    console.log("Matching Flash models:", matching25);
  } else {
    console.log("Error or empty:", data);
  }
}

listGeminiModels();
