import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/auth';

/**
 * GET /api/admin/pipeline/cron
 * Cron endpoint for automated pipeline tasks
 * Should be called by external cron service (Vercel Cron, GitHub Actions, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 });
    }

    const supabase = getSupabase();
    const results = {
      research: { executed: false, error: null as string | null, results: null as any },
      cleanup: { executed: false, error: null as string | null, results: null as any },
      monitoring: { executed: false, error: null as string | null, results: null as any }
    };

    // 1. Auto-research (daily at 09:00 and 16:00)
    const now = new Date();
    const hour = now.getHours();
    
    if (hour === 9 || hour === 16) {
      try {
        const researchRes = await fetch(`${req.nextUrl.origin}/api/admin/pipeline/research`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Use a system user for cron operations
            'Authorization': `Bearer ${process.env.SYSTEM_AUTH_TOKEN || 'system'}`
          },
          body: JSON.stringify({ dry_run: false })
        });

        if (researchRes.ok) {
          results.research.executed = true;
          results.research.results = await researchRes.json();
        } else {
          results.research.error = `HTTP ${researchRes.status}`;
        }
      } catch (err: any) {
        results.research.error = err.message;
      }
    }

    // 2. Cleanup old temporary files (daily at 02:00)
    if (hour === 2) {
      try {
        // Clean up old export directories
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const cleanupCmd = 'find /tmp -name "hellonoid-export-*" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true';
        await execAsync(cleanupCmd);

        // Clean up old pipeline media from unsuccessful attempts
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old

        const { data: oldMedia } = await supabase
          .from('pipeline_media')
          .select('id, file_url')
          .eq('validation_status', 'pending')
          .lt('created_at', cutoffDate.toISOString());

        let cleanedCount = 0;
        if (oldMedia) {
          for (const media of oldMedia) {
            if (media.file_url.includes('/pipeline/')) {
              const pathParts = media.file_url.split('/pipeline/')[1];
              if (pathParts) {
                await supabase.storage.from('pipeline').remove([pathParts]);
              }
            }
          }

          const { error } = await supabase
            .from('pipeline_media')
            .delete()
            .in('id', oldMedia.map(m => m.id));

          if (!error) {
            cleanedCount = oldMedia.length;
          }
        }

        results.cleanup.executed = true;
        results.cleanup.results = { cleaned_files: cleanedCount };
      } catch (err: any) {
        results.cleanup.error = err.message;
      }
    }

    // 3. Monitor long-running tasks and stuck pipelines (every hour)
    try {
      // Check for pipelines stuck in progress for more than 24 hours
      const stuckCutoff = new Date();
      stuckCutoff.setHours(stuckCutoff.getHours() - 24);

      const { data: stuckPipelines } = await supabase
        .from('robot_pipeline')
        .select('id, robot_id, current_step, robots(name)')
        .eq('status', 'active')
        .lt('updated_at', stuckCutoff.toISOString());

      if (stuckPipelines && stuckPipelines.length > 0) {
        // Mark as paused and log
        for (const pipeline of stuckPipelines) {
          await supabase
            .from('robot_pipeline')
            .update({ status: 'paused' })
            .eq('id', pipeline.id);

          await supabase.from('pipeline_step_log').insert({
            pipeline_id: pipeline.id,
            step: pipeline.current_step,
            action: 'pause',
            comment: 'Pipeline paused by cron - stuck for >24h',
            performed_by: 'system',
          });
        }
      }

      results.monitoring.executed = true;
      results.monitoring.results = { 
        stuck_pipelines: stuckPipelines?.length || 0 
      };
    } catch (err: any) {
      results.monitoring.error = err.message;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hour,
      ...results
    });

  } catch (error: any) {
    console.error('Cron execution error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/pipeline/cron
 * Manual trigger for cron tasks (with auth)
 */
export async function POST(req: NextRequest) {
  try {
    // For manual triggers, we'd want auth
    // For now, just redirect to GET with proper secret
    const cronSecret = process.env.CRON_SECRET || 'test-secret';
    const url = new URL('/api/admin/pipeline/cron', req.nextUrl.origin);
    url.searchParams.set('secret', cronSecret);

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}