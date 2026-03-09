import { createClient } from '@supabase/supabase-js';
import type { Entity, Robot, RobotSpec, NewsArticle } from '@/data/robots';

// Server-side Supabase client (uses anon key, works in both server & client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Entities / Manufacturers ────────────────────────────────────────

export async function getEntities(): Promise<Entity[]> {
  const { data, error } = await supabase
    .from('manufacturers')
    .select('*')
    .order('name');
  
  if (error) throw new Error(`Failed to fetch entities: ${error.message}`);
  
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    country: row.country ?? '',
    website: row.website ?? '',
    logo_url: row.logo_url ?? '',
    founded_year: row.founded_year ?? 0,
    description: row.description ?? '',
    entity_type: row.entity_type ?? 'manufacturer',
  }));
}

// ── Robots ──────────────────────────────────────────────────────────

function mapRobot(row: Record<string, unknown>): Robot {
  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    entity_id: (row.entity_id ?? row.manufacturer_id) as number,
    manufacturer_id: row.manufacturer_id as number | undefined,
    status: row.status as Robot['status'],
    category: (row.category ?? '') as string,
    hero_image_url: (row.hero_image_url ?? '') as string,
    summary: (row.summary ?? '') as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    country_of_origin: row.country_of_origin as string | null,
    expected_delivery: row.expected_delivery as string | null,
    purchase_url: row.purchase_url as string | null,
    purchase_price_usd: row.purchase_price_usd as number | null,
    capabilities: row.capabilities as Robot['capabilities'],
    dof: row.dof as Robot['dof'],
    ai: row.ai as Robot['ai'],
    battery: row.battery as Robot['battery'],
  };
}

export async function getRobots(): Promise<Robot[]> {
  const { data, error } = await supabase
    .from('robots')
    .select('*')
    .order('id');
  
  if (error) throw new Error(`Failed to fetch robots: ${error.message}`);
  return (data ?? []).map(mapRobot);
}

export async function getRobotBySlug(slug: string): Promise<Robot | null> {
  const { data, error } = await supabase
    .from('robots')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) return null;
  return data ? mapRobot(data) : null;
}

// ── Robot Specs ─────────────────────────────────────────────────────

export async function getSpecsForRobot(robotId: number): Promise<RobotSpec[]> {
  const { data, error } = await supabase
    .from('robot_specs')
    .select('*')
    .eq('robot_id', robotId)
    .order('id');
  
  if (error) throw new Error(`Failed to fetch specs: ${error.message}`);
  return (data ?? []) as RobotSpec[];
}

export async function getAllSpecs(): Promise<RobotSpec[]> {
  const { data, error } = await supabase
    .from('robot_specs')
    .select('*')
    .order('id');
  
  if (error) throw new Error(`Failed to fetch specs: ${error.message}`);
  return (data ?? []) as RobotSpec[];
}

// ── News ────────────────────────────────────────────────────────────

export async function getNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch news: ${error.message}`);
  return (data ?? []) as NewsArticle[];
}

export async function getNewsForRobot(robotId: number): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('robot_id', robotId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch news: ${error.message}`);
  return (data ?? []) as NewsArticle[];
}

// ── Composite Queries ───────────────────────────────────────────────

export async function getRobotWithDetails(slug: string) {
  const robot = await getRobotBySlug(slug);
  if (!robot) return null;

  const [entities, specs, relatedNews] = await Promise.all([
    getEntities(),
    getSpecsForRobot(robot.id),
    getNewsForRobot(robot.id),
  ]);

  const entity = entities.find(e => e.id === robot.entity_id);
  if (!entity) return null;

  return { robot, entity, manufacturer: entity, specs, relatedNews };
}

export async function getAllRobotSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('robots')
    .select('slug');
  
  if (error) throw new Error(`Failed to fetch slugs: ${error.message}`);
  return (data ?? []).map(r => r.slug);
}
