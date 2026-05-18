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

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function testSystemInstruction() {
  console.log("Testing with systemInstruction as object...");
  try {
    const chat = model.startChat({
      history: [],
      systemInstruction: {
        role: 'system',
        parts: [{ text: "You are a helpful assistant." }]
      }
    });
    const res = await chat.sendMessage("Hi");
    console.log("Success with object systemInstruction! Response:", res.response.text());
  } catch (err) {
    console.error("Failed with object systemInstruction:", err.message);
    
    console.log("\nTesting with systemInstruction as string...");
    try {
      const chat = model.startChat({
        history: [],
        systemInstruction: "You are a helpful assistant."
      });
      const res = await chat.sendMessage("Hi");
      console.log("Success with string systemInstruction! Response:", res.response.text());
    } catch (err2) {
      console.error("Failed with string systemInstruction:", err2.message);
    }
  }
}

testSystemInstruction();
