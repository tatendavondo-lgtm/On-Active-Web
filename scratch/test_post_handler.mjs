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

async function testPostHandler() {
  console.log("Mocking POST handler...");
  
  const messages = [
    { role: 'user', content: 'What is our focus for On Active?' }
  ];
  const storeContext = {
    revenue: 1250,
    pendingOrdersCount: 2,
    productsInStock: 45,
    lowStockItems: 1,
    zigRate: 13.5
  };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemInstruction = `You are Samkee's personal business assistant for On Active, a premium fitness apparel brand based in Zimbabwe. You have access to real-time store data. Be concise, insightful, and actionable. Always speak in USD unless the user specifically asks about ZiG. Keep responses under 200 words unless a detailed breakdown is requested.

Current store data:
${JSON.stringify(storeContext, null, 2)}`;

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ 
      history, 
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }]
      } 
    });

    console.log("Sending message stream...");
    const result = await chat.sendMessageStream(lastMessage.content);
    let full = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      full += text;
    }
    console.log("Stream successfully complete! Response:\n", full);
  } catch (err) {
    console.error("Caught error in POST execution:", err);
  }
}

testPostHandler();
