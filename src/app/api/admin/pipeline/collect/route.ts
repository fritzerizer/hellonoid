import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

/**
 * POST /api/admin/pipeline/collect
 * Auto-collect reference images for a robot in the pipeline.
 * Uses Brave Image Search with multiple query strategies, filters out
 * logos/icons/diagrams, and stores source URLs + file sizes.
 */

// Domains and patterns that typically serve logos, icons, or non-photo content
const BLOCKED_DOMAINS = [
  'logo', 'icon', 'favicon', 'badge', 'banner',
  'clipart', 'vector', 'emoji',
];

const BLOCKED_URL_PATTERNS = [
  /logo/i, /icon/i, /favicon/i, /badge/i, /banner/i,
  /sprite/i, /thumbnail.*small/i, /avatar/i,
  /\bads?\b/i, /pixel\.gif/i, /tracking/i,
  /chart/i, /diagram/i, /graph\./i, /infographic/i,
  /\.gif$/i,
];

function isLikelyPhoto(url: string, title: string, width?: number, height?: number): boolean {
  // Block known non-photo patterns
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  
  // Block domains with logo/icon in them
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) return false;
  } catch { /* ignore parse errors */ }

  // Minimum dimensions — we want real photos
  if (width && width < 400) return false;
  if (height && height < 400) return false;

  // Very wide or very tall images are likely banners/diagrams
  if (width && height) {
    const ratio = width / height;
    if (ratio > 3.5 || ratio < 0.25) return false;
  }

  // Block SVG and ICO
  if (url.endsWith('.svg') || url.endsWith('.ico')) return false;

  // Title-based filtering
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('logo') || lowerTitle.includes('icon set') || lowerTitle.includes('diagram')) return false;

  return true;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const supabase = getSupabase();
    const { pipeline_id, max_images = 12 } = await req.json();

    if (!pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id required' }, { status: 400 });
    }

    // Get pipeline + robot info
    const { data: pipeline, error: fetchError } = await supabase
      .from('robot_pipeline')
      .select('*, robots(id, name, slug, manufacturer_id, manufacturers!robots_manufacturer_id_fkey(name))')
      .eq('id', pipeline_id)
      .single();

    if (fetchError || !pipeline) {
      return NextResponse.json({ error: `Pipeline not found: ${fetchError?.message || 'no data'}` }, { status: 404 });
    }

    const robot = pipeline.robots as any;
    if (!robot) {
      return NextResponse.json({ error: 'Robot not found for pipeline' }, { status: 404 });
    }

    const robotName = robot.name;
    const manufacturer = robot.manufacturers?.name || '';
    
    // Build comprehensive search queries for different angles and contexts
    const queries = [
      // Full body shots from different angles
      `${manufacturer} ${robotName} humanoid robot full body photo`,
      `${manufacturer} ${robotName} robot front view high resolution`,
      `${manufacturer} ${robotName} robot side view profile`,
      `${manufacturer} ${robotName} robot back view rear`,
      // Press/official photos tend to be high quality
      `${manufacturer} ${robotName} robot press photo official`,
      `${manufacturer} ${robotName} robot product shot studio`,
      // Event photos can show different angles
      `${robotName} robot demo event exhibition`,
      // Close-ups for detail
      `${manufacturer} ${robotName} robot detail close up`,
    ];

    const braveApiKey = process.env.BRAVE_API_KEY || '';
    if (!braveApiKey) {
      return NextResponse.json({ error: 'BRAVE_API_KEY not configured' }, { status: 500 });
    }

    // Collect image URLs from Brave Image Search
    const imageUrls: Array<{ url: string; title: string; source: string; sourcePageUrl: string; width?: number; height?: number; query: string }> = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      if (imageUrls.length >= max_images * 2) break; // Collect extra to account for download failures

      try {
        const searchUrl = new URL('https://api.search.brave.com/res/v1/images/search');
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('count', '8');
        searchUrl.searchParams.set('safesearch', 'strict');
        searchUrl.searchParams.set('spellcheck', 'false');

        const res = await fetch(searchUrl.toString(), {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': braveApiKey,
          },
        });

        if (!res.ok) {
          console.error(`Brave search failed for "${query}": ${res.status}`);
          continue;
        }

        const data = await res.json();
        for (const result of (data.results || [])) {
          if (imageUrls.length >= max_images * 2) break;

          const imgUrl = result.properties?.url || result.url;
          if (!imgUrl || seenUrls.has(imgUrl)) continue;

          const w = result.properties?.width || result.width || 0;
          const h = result.properties?.height || result.height || 0;
          const title = result.title || '';

          // Apply photo filter
          if (!isLikelyPhoto(imgUrl, title, w, h)) continue;

          seenUrls.add(imgUrl);
          imageUrls.push({
            url: imgUrl,
            title,
            source: result.source || '',
            sourcePageUrl: result.page_url || result.url || '',
            width: w || undefined,
            height: h || undefined,
            query,
          });
        }
      } catch (err) {
        console.error(`Search error for "${query}":`, err);
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No suitable images found',
        queries_tried: queries,
      });
    }

    // Download and upload each image (stop at max_images successful downloads)
    const results: Array<{
      url: string;
      success: boolean;
      media?: any;
      error?: string;
      source_url?: string;
      file_size?: number;
      file_size_formatted?: string;
    }> = [];
    const slug = robot.slug || `robot-${robot.id}`;
    let successCount = 0;

    for (let i = 0; i < imageUrls.length && successCount < max_images; i++) {
      const img = imageUrls[i];
      try {
        // Download image with timeout
        const imgRes = await fetch(img.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Hellonoid/1.0; +https://hellonoid.com)',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!imgRes.ok) {
          results.push({ url: img.url, success: false, error: `HTTP ${imgRes.status}`, source_url: img.sourcePageUrl });
          continue;
        }

        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          results.push({ url: img.url, success: false, error: `Not an image: ${contentType}`, source_url: img.sourcePageUrl });
          continue;
        }

        // Skip GIFs (usually animations, not photos)
        if (contentType === 'image/gif') {
          results.push({ url: img.url, success: false, error: 'GIF skipped', source_url: img.sourcePageUrl });
          continue;
        }

        const buffer = Buffer.from(await imgRes.arrayBuffer());

        // Skip if too small (< 15KB probably a thumbnail/icon)
        if (buffer.length < 15360) {
          results.push({ url: img.url, success: false, error: `Too small (${formatBytes(buffer.length)})`, source_url: img.sourcePageUrl });
          continue;
        }

        // Skip if too large (> 20MB probably not useful)
        if (buffer.length > 20 * 1024 * 1024) {
          results.push({ url: img.url, success: false, error: `Too large (${formatBytes(buffer.length)})`, source_url: img.sourcePageUrl });
          continue;
        }

        // Determine extension from content type
        const extMap: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
        };
        const ext = extMap[contentType] || 'jpg';
        const fileName = `ref_${String(successCount + 1).padStart(2, '0')}_${Date.now()}.${ext}`;
        const storagePath = `${slug}/v${pipeline.version}/reference/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('pipeline')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          results.push({ url: img.url, success: false, error: uploadError.message, source_url: img.sourcePageUrl });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('pipeline').getPublicUrl(storagePath);

        // Create pipeline_media entry with source info
        const { data: media, error: dbError } = await supabase
          .from('pipeline_media')
          .insert({
            pipeline_id,
            file_url: urlData.publicUrl,
            file_name: fileName,
            file_size: buffer.length,
            mime_type: contentType,
            storage_backend: 'r2',
            media_type: 'reference',
            view_angle: null,
            width: img.width || null,
            height: img.height || null,
            source_url: img.url,
          })
          .select()
          .single();

        if (dbError) {
          results.push({ url: img.url, success: false, error: dbError.message, source_url: img.sourcePageUrl });
          continue;
        }

        successCount++;
        results.push({
          url: img.url,
          success: true,
          media,
          source_url: img.sourcePageUrl,
          file_size: buffer.length,
          file_size_formatted: formatBytes(buffer.length),
        });
      } catch (err: any) {
        results.push({ url: img.url, success: false, error: err.message, source_url: img.sourcePageUrl });
      }
    }

    // Log the collection
    await supabase.from('pipeline_step_log').insert({
      pipeline_id,
      step: '06_collect_media',
      action: 'auto_collect',
      comment: `Auto-collected ${successCount}/${imageUrls.length} reference images using ${queries.length} search queries`,
      performed_by: user.email,
    });

    return NextResponse.json({
      success: true,
      collected: successCount,
      total_found: imageUrls.length,
      queries_used: queries,
      results,
    });

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Auto-collect error:', error);
    return NextResponse.json({
      error: `Auto-collect failed: ${error.message}`,
    }, { status: 500 });
  }
}
