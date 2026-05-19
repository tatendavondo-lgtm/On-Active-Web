import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

async function testChat() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  let apiKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    console.log('Starting chat with gemini-2.5-flash...');
    const chat = model.startChat({
      history: [],
      systemInstruction: {
        role: 'system',
        parts: [{ text: 'You are a helpful assistant.' }]
      }
    });

    const result = await chat.sendMessage('Hello, are you working?');
    const response = await result.response;
    console.log('Success:', response.text());
  } catch (err) {
    console.error('Error with gemini-2.5-flash startChat:', err.message);
  }

  // Also test gemini-1.5-flash or gemini-2.0-flash
  const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  try {
    console.log('\nStarting chat with gemini-1.5-flash...');
    const chat = fallbackModel.startChat({
      history: [],
      systemInstruction: {
        role: 'system',
        parts: [{ text: 'You are a helpful assistant.' }]
      }
    });

    const result = await chat.sendMessage('Hello, are you working?');
    const response = await result.response;
    console.log('Success with gemini-1.5-flash:', response.text());
  } catch (err) {
    console.error('Error with gemini-1.5-flash startChat:', err.message);
  }
}

testChat();
