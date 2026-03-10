-- ============================================================
-- Robot Asset Pipeline — Database Schema
-- Kanban #186
-- ============================================================

-- Pipeline steps enum (numbered for UI reference)
CREATE TYPE pipeline_step AS ENUM (
  '01_research',
  '02_duplicate_check',
  '03_create_robot',
  '04_create_storage',
  '05_create_subfolders',
  '06_collect_media',
  '07_validate_media',
  '08_generate_views',
  '09_validate_views',
  '10_upscale_views',
  '11_3d_modeling',
  '12_validate_3d',
  '13_import_blender',
  '14_auto_cleanup',
  '15_manual_adjustments',
  '16_validate_result',
  '17_export_web',
  '18_upload',
  '19_ready_to_publish'
);

-- Pipeline status per robot
CREATE TABLE robot_pipeline (
  id SERIAL PRIMARY KEY,
  robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
  current_step pipeline_step NOT NULL DEFAULT '01_research',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  version INTEGER NOT NULL DEFAULT 1,
  height_confirmed BOOLEAN NOT NULL DEFAULT false,
  height_cm NUMERIC,
  meshy_credits_used NUMERIC DEFAULT 0,
  meshy_generations INTEGER DEFAULT 0,
  max_generations INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  started_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(robot_id, version)
);

-- Pipeline step log (tracks every step transition)
CREATE TABLE pipeline_step_log (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES robot_pipeline(id) ON DELETE CASCADE,
  step pipeline_step NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('enter', 'approve', 'reject', 'skip', 'auto_complete')),
  comment TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sources for robot research (admin-editable)
CREATE TABLE pipeline_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manufacturer', 'news', 'social_media', 'research', 'other')),
  enabled BOOLEAN DEFAULT true,
  search_frequency_hours INTEGER DEFAULT 24,
  last_searched_at TIMESTAMPTZ,
  robots_found INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media files (raw images, reference photos)
CREATE TABLE pipeline_media (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES robot_pipeline(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_backend TEXT DEFAULT 'r2' CHECK (storage_backend IN ('r2', 'vercel', 'local')),
  media_type TEXT NOT NULL CHECK (media_type IN ('reference', 'cropped', 'rigged_view', 'upscaled', '3d_model', 'blender_file', 'export')),
  view_angle TEXT CHECK (view_angle IN ('front', 'back', 'left', 'right', 'three_quarter_front', 'top', 'bottom', NULL)),
  source_url TEXT,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  validation_comment TEXT,
  validated_by TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI model profiles (Gemini, DALL-E, etc.)
CREATE TABLE pipeline_ai_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'flux', 'stability', 'other')),
  model_name TEXT NOT NULL,
  api_key_ref TEXT,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Configurable prompts for image generation
CREATE TABLE pipeline_prompts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  step pipeline_step NOT NULL,
  view_angle TEXT,
  prompt_template TEXT NOT NULL,
  ai_profile_id INTEGER REFERENCES pipeline_ai_profiles(id),
  is_default BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Robot-specific prompt overrides
CREATE TABLE pipeline_robot_prompts (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES robot_pipeline(id) ON DELETE CASCADE,
  prompt_id INTEGER REFERENCES pipeline_prompts(id),
  custom_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blender adjustments (predefined + custom per robot)
CREATE TABLE pipeline_adjustments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('predefined', 'custom')),
  blender_script TEXT,
  parameters JSONB DEFAULT '{}',
  is_global BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Robot-specific adjustments
CREATE TABLE pipeline_robot_adjustments (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES robot_pipeline(id) ON DELETE CASCADE,
  adjustment_id INTEGER REFERENCES pipeline_adjustments(id),
  custom_instructions TEXT,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Export configurations
CREATE TABLE pipeline_export_config (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'webp' CHECK (format IN ('webp', 'png', 'jpg')),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  quality INTEGER DEFAULT 90,
  transparent_bg BOOLEAN DEFAULT true,
  watermark BOOLEAN DEFAULT true,
  watermark_text TEXT DEFAULT 'hellonoid.com',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users with roles
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'agent')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Default data
-- ============================================================

-- Default export sizes
INSERT INTO pipeline_export_config (name, format, width, height, quality, transparent_bg, watermark, description) VALUES
  ('thumbnail', 'webp', 200, 200, 85, true, false, 'Small thumbnail for lists'),
  ('card', 'webp', 400, 400, 90, true, false, 'Robot card image'),
  ('full', 'webp', 1024, 1024, 92, true, true, 'Full size with watermark');

-- Default AI profile (Gemini)
INSERT INTO pipeline_ai_profiles (name, provider, model_name, api_key_ref, is_default, config) VALUES
  ('Gemini 2.0', 'gemini', 'gemini-2.0-flash-exp', '~/.secrets/gemini-api-key', true, '{"temperature": 0.7}');

-- Default admin users
INSERT INTO admin_users (email, name, role) VALUES
  ('f.linder@me.com', 'Fredrik', 'admin'),
  ('julia@hellonoid.com', 'Julia', 'agent');

-- Default prompts for view generation (step 8)
INSERT INTO pipeline_prompts (name, step, view_angle, prompt_template, ai_profile_id, is_default) VALUES
  ('Front view', '08_generate_views', 'front',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from directly in front. White background. Full body visible. Photorealistic rendering matching reference images. Height: {height_cm}cm.',
   1, true),
  ('Side view (left)', '08_generate_views', 'left',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from the left side. White background. Full body visible. Photorealistic rendering matching reference images. Height: {height_cm}cm.',
   1, true),
  ('Back view', '08_generate_views', 'back',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from directly behind. White background. Full body visible. Photorealistic rendering matching reference images. Height: {height_cm}cm.',
   1, true),
  ('Three quarter front', '08_generate_views', 'three_quarter_front',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from a 45 degree angle, front-left. White background. Full body visible. Photorealistic rendering matching reference images. Height: {height_cm}cm.',
   1, true),
  ('Top view', '08_generate_views', 'top',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from above, looking down. White background. Full body visible. Photorealistic rendering matching reference images.',
   1, true),
  ('Bottom view', '08_generate_views', 'bottom',
   'Generate a clean, studio-quality photograph of the {robot_name} humanoid robot from below, looking up. White background. Full body visible. Photorealistic rendering matching reference images.',
   1, true);

-- Default research sources
INSERT INTO pipeline_sources (name, url, source_type, search_frequency_hours) VALUES
  ('IEEE Spectrum Robotics', 'https://spectrum.ieee.org/topic/robotics', 'news', 24),
  ('The Robot Report', 'https://www.therobotreport.com/', 'news', 24),
  ('Humanoid Robotics Technology', 'https://humanoidroboticstechnology.com/', 'news', 24),
  ('Tesla AI', 'https://www.tesla.com/AI', 'manufacturer', 48),
  ('Figure AI', 'https://www.figure.ai/', 'manufacturer', 48),
  ('1X Technologies', 'https://www.1x.tech/', 'manufacturer', 48),
  ('Boston Dynamics', 'https://bostondynamics.com/', 'manufacturer', 48),
  ('Unitree Robotics', 'https://www.unitree.com/', 'manufacturer', 48),
  ('Agility Robotics', 'https://agilityrobotics.com/', 'manufacturer', 48),
  ('Apptronik', 'https://apptronik.com/', 'manufacturer', 48),
  ('Sanctuary AI', 'https://sanctuary.ai/', 'manufacturer', 48),
  ('Fourier Intelligence', 'https://www.fftai.com/', 'manufacturer', 48),
  ('UBTECH Robotics', 'https://www.ubtrobot.com/', 'manufacturer', 48),
  ('Humanoid Press', 'https://www.humanoid.press/', 'news', 12),
  ('Reddit r/robotics', 'https://www.reddit.com/r/robotics/', 'social_media', 24);

-- Predefined Blender adjustments
INSERT INTO pipeline_adjustments (name, description, adjustment_type, is_global) VALUES
  ('Smooth normals', 'Auto-smooth normals for cleaner surface appearance', 'predefined', true),
  ('Material cleanup', 'Standardize material names and remove duplicates', 'predefined', true),
  ('Scale normalization', 'Ensure consistent world-space scaling', 'predefined', true),
  ('UV cleanup', 'Fix UV mapping issues and seams', 'predefined', true),
  ('Ground alignment', 'Align robot feet to ground plane', 'predefined', true);

-- Add pipeline_step column to robots table
ALTER TABLE robots ADD COLUMN IF NOT EXISTS pipeline_step pipeline_step;
ALTER TABLE robots ADD COLUMN IF NOT EXISTS pipeline_version INTEGER DEFAULT 0;

-- Index for fast pipeline queries
CREATE INDEX idx_robot_pipeline_status ON robot_pipeline(status, current_step);
CREATE INDEX idx_pipeline_media_pipeline ON pipeline_media(pipeline_id, media_type);
CREATE INDEX idx_pipeline_step_log_pipeline ON pipeline_step_log(pipeline_id, created_at DESC);
