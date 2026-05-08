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

async function findWorkingModel() {
  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'];
  
  for (const m of models) {
    console.log(`Checking ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("test");
      console.log(`✅ ${m} is working:`, result.response.text());
      process.exit(0);
    } catch (err) {
      console.log(`❌ ${m} failed:`, err.message);
    }
  }
  console.log("No standard models working with this key.");
}

findWorkingModel();
