import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({ 
  token: process.env.UPLOADTHING_SECRET || process.env.UPLOADTHING_TOKEN 
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    
    // Auth check
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload directly to UploadThing
    const response = await utapi.uploadFiles(file);

    if (response.error) {
      console.error('UploadThing error:', response.error);
      return NextResponse.json({ error: response.error.message }, { status: 500 });
    }

    return NextResponse.json({ url: response.data?.url });
  } catch (err: any) {
    console.error('Server error during upload:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
