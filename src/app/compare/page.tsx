import { getRobots, getEntities, getAllSpecs } from '@/lib/queries';
import ComparePageClient from './ComparePageClient';

export const revalidate = 60;

export default async function ComparePage() {
  const [robots, entities, specs] = await Promise.all([
    getRobots(),
    getEntities(),
    getAllSpecs(),
  ]);

  return <ComparePageClient robots={robots} entities={entities} robotSpecs={specs} />;
}
