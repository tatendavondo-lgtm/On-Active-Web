import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) key = line.split('=')[1].trim();
}

async function exhaustModels() {
  console.log("Fetching full model list...");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await response.json();
  
  if (!data.models) {
    console.error("No models found or error:", data);
    return;
  }

  const candidates = data.models
    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
    .map(m => m.name);

  console.log(`Found ${candidates.length} candidate models. Testing...`);

  for (const m of candidates) {
    const cleanName = m.replace('models/', '');
    console.log(`Testing ${cleanName}...`);
    try {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
      });
      const testData = await testRes.json();
      if (testRes.ok) {
        console.log(`✅ ${cleanName} is working!`);
        process.exit(0);
      } else {
        console.log(`❌ ${cleanName} failed: ${testData.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ ${cleanName} error: ${err.message}`);
    }
  }
}

exhaustModels();
