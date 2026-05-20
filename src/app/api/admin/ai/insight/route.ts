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

  const { storeContext } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { insight: '⚠️ GEMINI_API_KEY is missing in Vercel. Please add it to Environment Variables.' },
      { status: 200 } // Return 200 so the UI can display the message safely
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a business intelligence assistant for On Active, a fitness apparel brand in Zimbabwe. Based on the following store data, generate ONE concise actionable insight (2-3 sentences max). Focus on the most important trend, risk, or opportunity right now. Be specific with numbers.

Store data:
${JSON.stringify(storeContext, null, 2)}

Respond with ONLY the insight text. No preamble.`;

  try {
    const result = await model.generateContent(prompt);
    const insight = result.response.text();
    return Response.json({ insight });
  } catch {
    return Response.json({ insight: 'Unable to generate insight at this time.' });
  }
}
