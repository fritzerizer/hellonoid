import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

interface ResearchSource {
  id: number;
  name: string;
  url: string;
  source_type: string;
  enabled: boolean;
  search_query?: string;
  last_searched_at?: string;
}

interface ResearchResult {
  source_id: number;
  source_name: string;
  robots_found: number;
  new_robots: Array<{
    name: string;
    manufacturer?: string;
    description?: string;
    external_url?: string;
  }>;
  errors: string[];
}

/**
 * POST /api/admin/pipeline/research
 * Execute automated research (Step 1) across all enabled sources
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const { source_ids, dry_run = false } = await req.json();

    const supabase = getSupabase();

    // Get enabled research sources
    let sourcesQuery = supabase
      .from('pipeline_sources')
      .select('*')
      .eq('enabled', true);

    if (source_ids && source_ids.length > 0) {
      sourcesQuery = sourcesQuery.in('id', source_ids);
    }

    const { data: sources } = await sourcesQuery;

    if (!sources || sources.length === 0) {
      return NextResponse.json({ 
        error: 'No enabled research sources found' 
      }, { status: 400 });
    }

    const results: ResearchResult[] = [];
    const existingRobots = await getExistingRobots(supabase);

    for (const source of sources) {
      const result: ResearchResult = {
        source_id: source.id,
        source_name: source.name,
        robots_found: 0,
        new_robots: [],
        errors: []
      };

      try {
        const robotsFound = await searchSource(source);
        result.robots_found = robotsFound.length;

        // Filter out duplicates
        const newRobots = robotsFound.filter(robot => 
          !isRobotDuplicate(robot, existingRobots)
        );

        result.new_robots = newRobots;

        // Create robot entries if not dry run
        if (!dry_run && newRobots.length > 0) {
          for (const robot of newRobots) {
            try {
              await createRobotFromResearch(supabase, robot, source, user.email);
            } catch (err: any) {
              result.errors.push(`Failed to create ${robot.name}: ${err.message}`);
            }
          }
        }

        // Update last searched timestamp
        await supabase
          .from('pipeline_sources')
          .update({ 
            last_searched_at: new Date().toISOString(),
            robots_found: result.robots_found 
          })
          .eq('id', source.id);

      } catch (err: any) {
        result.errors.push(err.message);
      }

      results.push(result);
    }

    const totalFound = results.reduce((sum, r) => sum + r.robots_found, 0);
    const totalNew = results.reduce((sum, r) => sum + r.new_robots.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      dry_run,
      sources_searched: sources.length,
      robots_found: totalFound,
      new_robots: totalNew,
      errors: totalErrors,
      results
    });

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Research error:', error);
    return NextResponse.json({ 
      error: `Research failed: ${error.message}` 
    }, { status: 500 });
  }
}

async function getExistingRobots(supabase: any) {
  const { data } = await supabase
    .from('robots')
    .select('name, manufacturer, slug');
  return data || [];
}

async function searchSource(source: ResearchSource): Promise<any[]> {
  // Implement different search strategies based on source type
  switch (source.source_type) {
    case 'brave_search':
      return searchBrave(source);
    case 'rss_feed':
      return searchRSS(source);
    case 'web_scrape':
      return searchWebScrape(source);
    default:
      throw new Error(`Unknown source type: ${source.source_type}`);
  }
}

async function searchBrave(source: ResearchSource): Promise<any[]> {
  // Use web_search tool functionality
  const query = source.search_query || 'new humanoid robot announcement';
  
  try {
    const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract robot information from search results
    const robots = [];
    for (const result of (data.results || []).slice(0, 10)) {
      const robotData = extractRobotFromSearchResult(result);
      if (robotData) {
        robots.push(robotData);
      }
    }

    return robots;
  } catch (err: any) {
    throw new Error(`Brave search error: ${err.message}`);
  }
}

async function searchRSS(source: ResearchSource): Promise<any[]> {
  // RSS feed parsing would go here
  return [];
}

async function searchWebScrape(source: ResearchSource): Promise<any[]> {
  // Web scraping logic would go here
  return [];
}

function extractRobotFromSearchResult(result: any): any | null {
  const { title, description, url } = result;
  
  // Simple extraction - could be made more sophisticated
  const robotPattern = /(\w+)\s+(robot|humanoid|android)/i;
  const match = title.match(robotPattern);
  
  if (!match) return null;

  return {
    name: match[1],
    description: description?.substring(0, 500),
    external_url: url,
    manufacturer: extractManufacturer(title, description)
  };
}

function extractManufacturer(title: string, description?: string): string | undefined {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Known manufacturers
  const manufacturers = [
    'boston dynamics', 'honda', 'toyota', 'tesla', 'figure', 'agility',
    'softbank', 'hanson robotics', 'pal robotics', 'unitree', '1x'
  ];

  for (const manufacturer of manufacturers) {
    if (text.includes(manufacturer)) {
      return manufacturer;
    }
  }

  return undefined;
}

function isRobotDuplicate(newRobot: any, existingRobots: any[]): boolean {
  const newName = newRobot.name.toLowerCase();
  
  return existingRobots.some(existing => {
    const existingName = existing.name.toLowerCase();
    
    // Exact match
    if (existingName === newName) return true;
    
    // Similar names (fuzzy matching)
    const similarity = calculateSimilarity(existingName, newName);
    return similarity > 0.8;
  });
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function createRobotFromResearch(
  supabase: any, 
  robotData: any, 
  source: ResearchSource, 
  userEmail: string
): Promise<void> {
  // Create robot with status "researching"
  const { data: robot } = await supabase
    .from('robots')
    .insert({
      name: robotData.name,
      slug: generateSlug(robotData.name),
      manufacturer: robotData.manufacturer || 'Unknown',
      category: 'Humanoid',
      status: 'researching',
      description: robotData.description,
      hero_image_url: null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (!robot) {
    throw new Error('Failed to create robot');
  }

  // Create pipeline for the robot (starts at research step)
  const { data: pipeline } = await supabase
    .from('robot_pipeline')
    .insert({
      robot_id: robot.id,
      version: 1,
      current_step: '01_research',
      status: 'active',
      started_by: userEmail,
    })
    .select()
    .single();

  if (!pipeline) {
    throw new Error('Failed to create pipeline');
  }

  // Log the research finding
  await supabase.from('pipeline_step_log').insert({
    pipeline_id: pipeline.id,
    step: '01_research',
    action: 'complete',
    comment: `Robot discovered via ${source.name}. URL: ${robotData.external_url}`,
    performed_by: 'system',
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}