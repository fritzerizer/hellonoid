import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { homedir } from 'os';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    try { key = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim(); } catch {}
  }
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function getGeminiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try { return readFileSync(`${homedir()}/.secrets/gemini-api-key`, 'utf-8').trim(); } catch {}
  return '';
}

// POST: Generate rigged views using Gemini
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { pipeline_id, view_angle, custom_prompt } = await req.json();

  if (!pipeline_id) {
    return NextResponse.json({ error: 'pipeline_id required' }, { status: 400 });
  }

  // Get pipeline + robot info
  const { data: pipeline } = await supabase
    .from('robot_pipeline')
    .select('*, robots(id, name, slug)')
    .eq('id', pipeline_id)
    .single();

  if (!pipeline) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  // Get approved reference images
  const { data: refMedia } = await supabase
    .from('pipeline_media')
    .select('file_url, view_angle')
    .eq('pipeline_id', pipeline_id)
    .eq('media_type', 'reference')
    .eq('validation_status', 'approved');

  if (!refMedia || refMedia.length === 0) {
    return NextResponse.json({ error: 'Inga godkända referensbilder. Ladda upp och godkänn bilder först.' }, { status: 400 });
  }

  // Get prompt template
  const angles = view_angle ? [view_angle] : ['front', 'left', 'back', 'three_quarter_front', 'top', 'bottom'];
  const results = [];

  for (const angle of angles) {
    // Get prompt for this angle
    let prompt = custom_prompt;
    if (!prompt) {
      const { data: promptData } = await supabase
        .from('pipeline_prompts')
        .select('prompt_template')
        .eq('step', '08_generate_views')
        .eq('view_angle', angle)
        .eq('is_default', true)
        .single();

      prompt = promptData?.prompt_template || `Generate a studio-quality image of the ${pipeline.robots?.name} humanoid robot from ${angle} view. White background. Full body.`;
    }

    // Replace template variables
    const robotName = pipeline.robots?.name || 'robot';
    const heightCm = pipeline.height_cm || 'unknown';
    prompt = prompt
      .replace(/{robot_name}/g, robotName)
      .replace(/{height_cm}/g, String(heightCm));

    // Add reference image context
    const refUrls = refMedia.map(r => r.file_url).slice(0, 4);
    const fullPrompt = `${prompt}\n\nUse these reference images as the basis for the robot's appearance: ${refUrls.join(', ')}`;

    // Call Gemini API
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API-nyckel saknas' }, { status: 500 });
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: fullPrompt },
                // Include reference images as inline data if available
                ...refUrls.slice(0, 2).map(url => ({
                  text: `Reference image: ${url}`
                })),
              ],
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              temperature: 0.7,
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        results.push({ angle, error: `Gemini API-fel: ${err.slice(0, 200)}` });
        continue;
      }

      const geminiData = await geminiRes.json();

      // Extract image from response
      const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith('image')
      );

      if (!imagePart?.inlineData) {
        results.push({ angle, error: 'Gemini returnerade ingen bild' });
        continue;
      }

      // Upload to Supabase Storage
      const slug = pipeline.robots?.slug || `robot-${pipeline.robot_id}`;
      const fileName = `${slug}_${angle}_v${pipeline.version}.png`;
      const storagePath = `${slug}/v${pipeline.version}/rigged_view/${fileName}`;

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

      await supabase.storage.from('pipeline').upload(storagePath, imageBuffer, {
        contentType: imagePart.inlineData.mimeType,
        upsert: true,
      });

      const { data: urlData } = supabase.storage.from('pipeline').getPublicUrl(storagePath);

      // Save to pipeline_media
      const { data: media } = await supabase
        .from('pipeline_media')
        .insert({
          pipeline_id,
          file_url: urlData.publicUrl,
          file_name: fileName,
          file_size: imageBuffer.length,
          mime_type: imagePart.inlineData.mimeType,
          storage_backend: 'vercel',
          media_type: 'rigged_view',
          view_angle: angle,
        })
        .select()
        .single();

      results.push({ angle, success: true, media });
    } catch (err: any) {
      results.push({ angle, error: err.message });
    }
  }

  return NextResponse.json({ results });
}
