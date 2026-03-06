import { getRobots, getEntities } from '@/lib/queries';
import RobotsPageClient from './RobotsPageClient';

export const revalidate = 60;

export default async function RobotsPage() {
  const [robots, entities] = await Promise.all([
    getRobots(),
    getEntities(),
  ]);

  return <RobotsPageClient robots={robots} entities={entities} />;
}
