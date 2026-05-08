import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) key = line.split('=')[1].trim();
}

if (!key) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function testGemini() {
  console.log("Testing Gemini API with model: gemini-2.0-flash...");
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent("Hello, are you working?");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Error with gemini-2.0-flash:", err.message);
    
    console.log("\nRetrying with gemini-1.5-flash...");
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent("Hello, are you working?");
      console.log("Response:", result.response.text());
    } catch (err2) {
      console.error("Error with gemini-1.5-flash:", err2.message);
    }
  }
}

testGemini();
