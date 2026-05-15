import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

async function testGemini() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  let apiKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  if (!apiKey) {
    console.error('No API key found in .env.local');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = 'gemini-2.0-flash'; // I'll test 2.0 first because 2.5 is unlikely to exist
  console.log(`Testing model: ${modelName}`);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log(`Success with ${modelName}:`, response.text());
  } catch (err) {
    console.error(`Failed with ${modelName}:`, err.message);
  }

  const userModel = 'gemini-2.5-flash';
  console.log(`\nTesting user requested model: ${userModel}`);
  try {
    const model = genAI.getGenerativeModel({ model: userModel });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log(`Success with ${userModel}:`, response.text());
  } catch (err) {
    console.error(`Failed with ${userModel}:`, err.message);
  }
}

testGemini();
