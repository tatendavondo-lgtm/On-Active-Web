// Direct test of the /api/admin/ai/chat endpoint using gemini-flash-latest
// Run with: node scratch/test_chat_endpoint_direct.mjs

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  let apiKey = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  console.log('API key found:', apiKey.slice(0, 8) + '...');

  const models = ['gemini-flash-latest', 'gemini-flash-lite-latest'];

  for (const modelName of models) {
    console.log(`\n--- Testing model: ${modelName} ---`);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemInstruction = `You are Samkee's personal business assistant for On Active, a premium fitness apparel brand based in Zimbabwe. 
Current store data: { "revenue": 38, "pendingOrdersCount": 0, "productsInStock": 1, "lowStockItems": 0, "zigRate": 13500, "topSeller": "Vest" }`;

      const chat = model.startChat({
        history: [],
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
      });

      let full = '';
      const result = await chat.sendMessageStream('Which products are selling fastest this month?');
      for await (const chunk of result.stream) {
        const text = chunk.text();
        process.stdout.write(text);
        full += text;
      }
      console.log(`\n\n✅ ${modelName} streaming SUCCESS (${full.length} chars)`);
      break; // stop on first success

    } catch (err) {
      const msg = err?.message ?? String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        console.log(`❌ ${modelName}: QUOTA EXCEEDED (429)`);
      } else {
        console.log(`❌ ${modelName}: ${msg.slice(0, 200)}`);
      }
    }
  }
}

main();
