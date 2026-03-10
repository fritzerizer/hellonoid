/**
 * Meshy.ai API Client for Hellonoid Pipeline
 * Docs: https://docs.meshy.ai/en/api/image-to-3d
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

function getMeshyKey(): string {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY;
  try { return readFileSync(`${homedir()}/.secrets/meshy-api-key`, 'utf-8').trim(); } catch {}
  return '';
}

export interface MeshyTaskCreate {
  image_url: string;
  ai_model?: 'meshy-5' | 'meshy-6' | 'latest';
  topology?: 'quad' | 'triangle';
  target_polycount?: number;
  should_remesh?: boolean;
  should_texture?: boolean;
  enable_pbr?: boolean;
  pose_mode?: 'a-pose' | 't-pose' | '';
  texture_prompt?: string;
  symmetry_mode?: 'off' | 'auto' | 'on';
}

export interface MeshyTask {
  id: string;
  model_urls: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
  };
  thumbnail_url: string;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  task_error?: { message: string };
  created_at: number;
  finished_at?: number;
  credits_used?: number;
}

async function meshyFetch(path: string, options: RequestInit = {}): Promise<any> {
  const key = getMeshyKey();
  if (!key) throw new Error('Meshy API-nyckel saknas. Spara den i ~/.secrets/meshy-api-key');

  const res = await fetch(`${MESHY_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meshy API-fel ${res.status}: ${err.slice(0, 300)}`);
  }

  return res.json();
}

/** Skapa en ny Image-to-3D-uppgift */
export async function createImageTo3D(params: MeshyTaskCreate): Promise<{ result: string }> {
  return meshyFetch('/image-to-3d', {
    method: 'POST',
    body: JSON.stringify({
      image_url: params.image_url,
      ai_model: params.ai_model || 'latest',
      topology: params.topology || 'triangle',
      target_polycount: params.target_polycount || 100000,
      should_remesh: params.should_remesh ?? false,
      should_texture: params.should_texture ?? true,
      enable_pbr: params.enable_pbr ?? true,
      pose_mode: params.pose_mode || '',
      symmetry_mode: params.symmetry_mode || 'auto',
      texture_prompt: params.texture_prompt,
    }),
  });
}

/** Hämta status för en uppgift */
export async function getImageTo3DTask(taskId: string): Promise<MeshyTask> {
  return meshyFetch(`/image-to-3d/${taskId}`);
}

/** Hämta kreditbalans */
export async function getBalance(): Promise<{ credits: number }> {
  return meshyFetch('/balance');
}

/** Standardinställningar för Hellonoid-pipelinen */
export const HELLONOID_MESHY_DEFAULTS: Partial<MeshyTaskCreate> = {
  ai_model: 'latest',
  topology: 'triangle',
  target_polycount: 100000,
  should_remesh: false,
  should_texture: true,
  enable_pbr: true,
  symmetry_mode: 'auto',
};
