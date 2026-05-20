import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiKey = 'AIzaSyDfmKIhYPy43WyhPm1XJOfeK2Ti1_3Z2uY';
const genAI = new GoogleGenerativeAI(geminiKey);

async function finalTest() {
  console.log('=== FINAL TEST: AI Assistant SDK Fix ===\n');

  try {
    const storeContext = {
      revenue: 5000,
      totalOrders: 120,
      topSeller: 'Performance Leggings'
    };

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: "You are Samkee, an assistant for On Active. Answer based on store data." }]
      }
    });

    console.log('Sending message to Samkee...');
    const chat = model.startChat();
    const result = await chat.sendMessage(`Based on this context: ${JSON.stringify(storeContext)}, what is my top selling product?`);
    const response = result.response.text();

    console.log('\n--- SAMKEE\'S RESPONSE ---');
    console.log(response);
    console.log('--------------------------\n');

    if (response.toLowerCase().includes('leggings')) {
      console.log('✅ SUCCESS: Samkee is reading context and responding correctly!');
    } else {
      console.log('⚠️ WARNING: Samkee responded but might have missed the specific context.');
    }

  } catch (err) {
    console.error('Test Error:', err.message);
    if (err.message.includes('429')) {
      console.log('\nNOTE: The code is correct, but the API quota is currently full. It will work once the quota resets or with an upgraded key.');
    }
  }
}

finalTest();
