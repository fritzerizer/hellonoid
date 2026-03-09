#!/usr/bin/env npx tsx
/**
 * Hellonoid News Pipeline — Fetch, filter and store news as drafts
 * 
 * Usage: npx tsx scripts/fetch-news.ts [--dry-run] [--publish]
 * 
 * Pipeline:
 * 1. Search for humanoid robot news via Brave Search
 * 2. Filter for relevance using keyword matching
 * 3. Store as drafts in Supabase for admin review
 * 
 * Designed to be run via OpenClaw cron 2x/day
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oqdasylggugfxvotpusi.supabase.co';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';

// Read service role from file
import { readFileSync } from 'fs';
import { homedir } from 'os';

const SERVICE_ROLE = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim();
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const DRY_RUN = process.argv.includes('--dry-run');
const AUTO_PUBLISH = process.argv.includes('--publish');

// ── Search Queries ──────────────────────────────────────────────

const SEARCH_QUERIES = [
  'humanoid robot news',
  'humanoid robot launch 2025 2026',
  'Tesla Optimus robot update',
  'Figure AI robot news',
  '1X Technologies NEO robot',
  'Unitree humanoid robot',
  'Boston Dynamics Atlas update',
  'Agility Robotics Digit news',
  'Apptronik Apollo robot',
  'Fourier Intelligence robot',
  'UBTECH Walker robot',
  'Xpeng Iron humanoid',
];

// ── Relevance Keywords ──────────────────────────────────────────

const ROBOT_KEYWORDS = [
  'humanoid', 'bipedal', 'robot', 'optimus', 'figure 0', 'neo',
  'atlas', 'digit', 'apollo', 'walker', 'unitree', 'agility',
  'apptronik', 'fourier', 'ubtech', 'xpeng iron', '1x tech',
  'sanctuary ai', 'menteebot', 'kepler robot',
];

const NOISE_KEYWORDS = [
  'vacuum robot', 'robot vacuum', 'roomba', 'industrial arm',
  'surgical robot', 'chatbot', 'robo-advisor', 'drone',
];

const NOISE_DOMAINS = [
  'wikipedia.org', 'reddit.com', 'linkedin.com', 'x.com', 'twitter.com',
  'youtube.com', 'shop.', 'store.', 'stemfinity.com', 'robostore.com',
  'roboworks.net', 'latinsatelital.com',
];

// ── Types ───────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
  source?: string;
}

interface NewsCandidate {
  title: string;
  source_url: string;
  source_name: string;
  summary: string;
  published_at: string;
  significance: number;
  tags: string[];
  robot_id: number | null;
}

// ── Robot Matching ──────────────────────────────────────────────

// Explicit mapping for reliable robot detection
const ROBOT_PATTERNS: [RegExp, number][] = [
  [/tesla\s*optimus/i, 1],
  [/optimus\s*(gen|robot|humanoid)/i, 1],
  [/1x\s*(neo|technologies)/i, 2],
  [/\bneo\b.*(1x|humanoid|home robot)/i, 2],
  [/figure\s*(0[0-9]|ai)/i, 3],
  [/figure\s*02/i, 3],
  [/figure\s*03/i, 3],
  [/unitree\s*h1/i, 4],
  [/unitree\s*g1/i, 5],
  [/boston\s*dynamics.*atlas/i, 6],
  [/\batlas\b.*(boston|humanoid|electric)/i, 6],
  [/agility.*(digit|robotics)/i, 7],
  [/\bdigit\b.*(agility|humanoid|robot)/i, 7],
  [/apptronik.*apollo/i, 8],
  [/\bapollo\b.*(apptronik|humanoid|robot)/i, 8],
  [/sanctuary\s*ai|phoenix.*(sanctuary|humanoid)/i, 9],
  [/xiaomi.*(cyberone|humanoid)/i, 10],
  [/cyberone/i, 10],
];

function matchRobot(text: string): number | null {
  for (const [pattern, id] of ROBOT_PATTERNS) {
    if (pattern.test(text)) return id;
  }
  return null;
}

// ── Search ──────────────────────────────────────────────────────

async function braveSearch(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('No BRAVE_API_KEY set, using mock results');
    return [];
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&freshness=week`;
  const res = await fetch(url, {
    headers: { 'X-Subscription-Token': BRAVE_API_KEY },
  });

  if (!res.ok) {
    console.error(`Brave search failed for "${query}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.web?.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description,
    published: r.published_date || new Date().toISOString(),
    source: new URL(r.url).hostname.replace('www.', ''),
  }));
}

// ── Filtering ───────────────────────────────────────────────────

function isRelevant(result: SearchResult): boolean {
  const text = `${result.title} ${result.description}`.toLowerCase();
  const url = result.url.toLowerCase();

  // Skip noisy domains (Wikipedia, Reddit, YouTube, shops, etc.)
  if (NOISE_DOMAINS.some(d => url.includes(d))) return false;

  // Skip product pages and homepages (no path or very short path)
  try {
    const pathname = new URL(result.url).pathname;
    if (pathname === '/' || pathname.length < 5) return false;
  } catch {}

  // Must contain at least one robot keyword
  const hasRobot = ROBOT_KEYWORDS.some(k => text.includes(k));
  if (!hasRobot) return false;

  // Must not be noise
  const isNoise = NOISE_KEYWORDS.some(k => text.includes(k));
  if (isNoise) return false;

  // Skip review/comparison listicles that aren't news
  if (text.includes('top 10') || text.includes('top 12') || text.includes('best of')) return false;

  // Skip very short titles (likely homepages or product pages)
  if (result.title.length < 20) return false;

  // Skip order/buy/shop pages
  if (text.includes('order now') || text.includes('buy now') || text.includes('add to cart') || text.includes('price:')) return false;

  // Skip titles that are just product names (no verb/action)
  const titleLower = result.title.toLowerCase();
  if (/^(about|order|discover|product|home)\b/i.test(titleLower)) return false;

  return true;
}

function estimateSignificance(text: string): number {
  const lower = text.toLowerCase();
  if (lower.includes('launch') || lower.includes('unveil') || lower.includes('new model') || lower.includes('announce')) return 3;
  if (lower.includes('partner') || lower.includes('deploy') || lower.includes('funding') || lower.includes('factory')) return 2;
  return 1;
}

function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  if (lower.includes('launch') || lower.includes('unveil') || lower.includes('reveal')) tags.push('product-launch');
  if (lower.includes('partner') || lower.includes('collaboration') || lower.includes('deal')) tags.push('partnership');
  if (lower.includes('funding') || lower.includes('invest') || lower.includes('raise') || lower.includes('million') || lower.includes('billion')) tags.push('funding');
  if (lower.includes('research') || lower.includes('study') || lower.includes('paper')) tags.push('research');
  if (lower.includes('deploy') || lower.includes('factory') || lower.includes('manufactur')) tags.push('deployment');
  if (tags.length === 0) tags.push('news');
  return tags;
}

// ── Deduplication ───────────────────────────────────────────────

async function getExistingUrls(): Promise<Set<string>> {
  const { data } = await supabase.from('news').select('source_url');
  return new Set((data ?? []).map(r => r.source_url));
}

// ── Main Pipeline ───────────────────────────────────────────────

async function main() {
  console.log('🤖 Hellonoid News Pipeline');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : AUTO_PUBLISH ? 'AUTO-PUBLISH' : 'DRAFT (review required)'}`);
  console.log('');

  const existingUrls = await getExistingUrls();
  const allResults: SearchResult[] = [];

  // Search
  console.log('📡 Searching...');
  for (const query of SEARCH_QUERIES) {
    const results = await braveSearch(query);
    allResults.push(...results);
    // Rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allResults.filter(r => {
    if (seen.has(r.url) || existingUrls.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`Found ${allResults.length} results, ${unique.length} unique & new`);

  // Filter
  const relevant = unique.filter(isRelevant);
  console.log(`${relevant.length} relevant after filtering`);

  // Build candidates
  const candidates: NewsCandidate[] = relevant.map(r => {
    const text = `${r.title} ${r.description}`;
    return {
      title: r.title,
      source_url: r.url,
      source_name: r.source || '',
      summary: r.description,
      published_at: r.published || new Date().toISOString(),
      significance: estimateSignificance(text),
      tags: extractTags(text),
      robot_id: matchRobot(text),
    };
  });

  if (candidates.length === 0) {
    console.log('No new articles found.');
    return;
  }

  console.log(`\n📰 ${candidates.length} articles to add:\n`);
  for (const c of candidates) {
    console.log(`  [sig:${c.significance}] ${c.title}`);
    console.log(`    ${c.source_name} | robot_id: ${c.robot_id ?? 'none'} | tags: ${c.tags.join(', ')}`);
    console.log(`    ${c.source_url}`);
    console.log('');
  }

  if (DRY_RUN) {
    console.log('Dry run — not saving.');
    return;
  }

  // Insert as drafts
  const status = AUTO_PUBLISH ? 'published' : 'draft';
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

  const rows = candidates.map(c => ({
    title: c.title,
    slug: slugify(c.title),
    content: c.summary,
    summary: c.summary,
    source_url: c.source_url,
    source_name: c.source_name,
    published_at: c.published_at,
    significance: c.significance,
    tags: c.tags,
    robot_id: c.robot_id,
    status,
    image_url: '',
  }));

  // Insert one by one, skip on any error (duplicate slug, etc.)
  let inserted = 0;
  for (const row of rows) {
    const { error } = await supabase.from('news').insert(row);
    if (!error) {
      inserted++;
    } else if (error.message.includes('duplicate')) {
      // Already exists, skip silently
    } else {
      console.warn(`  Skip: ${row.title} (${error.message})`);
    }
  }

  const data = [{ count: inserted }];

  console.log(`\n✅ Inserted ${inserted} of ${rows.length} articles as "${status}"`);
}

main().catch(console.error);
