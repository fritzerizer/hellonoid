import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const SERVICE_KEY = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim();
const supabase = createClient('https://oqdasylggugfxvotpusi.supabase.co', SERVICE_KEY);

const sql = readFileSync('supabase/migrations/20260310_asset_pipeline.sql', 'utf-8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function run() {
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_raw_sql', { sql: stmt + ';' });
      if (error) {
        // Try direct table creation via management API
        console.log(`Note: ${error.message.slice(0, 80)}`);
      } else {
        console.log(`OK: ${stmt.slice(0, 60)}...`);
      }
    } catch (e: any) {
      console.log(`Skip: ${e.message?.slice(0, 60) || 'unknown'}`);
    }
  }
}
run();
