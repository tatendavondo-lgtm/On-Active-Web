import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Double check admin role
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { messages, storeContext } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your Vercel project environment variables.' },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `You are Samkee's personal business assistant for On Active, a premium fitness apparel brand based in Zimbabwe. You have access to real-time store data. Be concise, insightful, and actionable. Always speak in USD unless the user specifically asks about ZiG. Keep responses under 200 words unless a detailed breakdown is requested.

Current store data:
${JSON.stringify(storeContext, null, 2)}`;

  // Convert to Gemini history format (all except last message)
  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err: any) {
        console.error('AI Chat Error:', err);
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        if (err && err.message) {
          errorMessage = `AI Chat Error: ${err.message}`;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = `AI Chat Error: ${JSON.stringify(err)}`;
        } else if (err) {
          errorMessage = `AI Chat Error: ${String(err)}`;
        }
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
