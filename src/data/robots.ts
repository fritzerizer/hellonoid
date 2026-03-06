// Type definitions for Hellonoid data model
// Data is now served from Supabase — see src/lib/queries.ts for data fetching

export type EntityType = 'manufacturer' | 'news_outlet' | 'content_creator' | 'research_lab' | 'investor' | 'industry_body';

export interface Entity {
  id: number;
  name: string;
  slug: string;
  country: string;
  website: string;
  logo_url: string;
  founded_year: number;
  description: string;
  entity_type: EntityType;
}

/** @deprecated Use Entity instead */
export type Manufacturer = Entity;

export interface Robot {
  id: number;
  name: string;
  slug: string;
  entity_id: number;
  /** @deprecated Use entity_id */
  manufacturer_id?: number;
  status: 'announced' | 'development' | 'shipping' | 'discontinued';
  category: string;
  hero_image_url: string;
  summary: string;
  created_at: string;
  updated_at: string;
  
  // Structured fields (Phase 1)
  country_of_origin?: string | null;
  expected_delivery?: string | null;
  purchase_url?: string | null;
  purchase_price_usd?: number | null;
  
  capabilities?: {
    can_fold_laundry?: boolean | null;
    can_vacuum?: boolean | null;
    can_climb_stairs?: boolean | null;
    max_lift_kg?: number | null;
    max_carry_kg?: number | null;
    autonomous_duration_hours?: number | null;
  };
  
  dof?: {
    total?: number | null;
    hands_each?: number | null;
    arms_each?: number | null;
    legs_each?: number | null;
    torso?: number | null;
    head?: number | null;
  };
  
  ai?: {
    model?: string | null;
    response_time?: string | null;
    voice_capable?: boolean | null;
    autonomy_level?: 'full_autonomous' | 'teleoperated' | 'hybrid' | null;
  };
  
  battery?: {
    capacity_kwh?: number | null;
    life_hours?: number | null;
    charge_time_hours?: number | null;
  };
}

export interface RobotSpec {
  id: number;
  robot_id: number;
  spec_key: string;
  spec_value: string;
  spec_unit: string;
  spec_category: 'dimensions' | 'performance' | 'sensors' | 'battery' | 'actuators' | 'general';
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  robot_id: number | null;
  published_at: string;
  source_url: string;
  image_url: string;
}

// Newsletter types
export interface NewsletterSubscription {
  id: number;
  entity_id: number | null;
  name: string;
  email_address: string;
  signup_url: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'unknown';
  total_received: number;
  first_received_at: string | null;
  last_received_at: string | null;
  status: 'active' | 'paused' | 'unsubscribed';
  notes: string | null;
  created_at: string;
  updated_at: string;
  entities?: Entity | null;
}

export interface NewsletterItem {
  id: number;
  subscription_id: number;
  subject: string;
  sender_email: string | null;
  received_at: string;
  status: 'received' | 'processing' | 'verifying' | 'processed';
  raw_content: string | null;
  created_at: string;
  updated_at: string;
  newsletter_subscriptions?: NewsletterSubscription | null;
}
