import { robots, manufacturers, robotSpecs, getRobotWithDetails, news } from '@/data/robots';
import SpecTable from '@/components/SpecTable';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faShirt, 
  faBroom, 
  faStairs, 
  faDumbbell, 
  faBox, 
  faBatteryFull, 
  faMicrophone, 
  faMicrophoneSlash, 
  faGamepad, 
  faBolt 
} from '@/lib/fontawesome';

export function generateStaticParams() {
  return robots.map(r => ({ slug: r.slug }));
}

const statusColors: Record<string, string> = {
  shipping: 'bg-green-500/20 text-green-400',
  development: 'bg-yellow-500/20 text-yellow-400',
  announced: 'bg-purple-500/20 text-purple-400',
  discontinued: 'bg-gray-500/20 text-gray-400',
};

export default async function RobotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getRobotWithDetails(slug);
  if (!data) notFound();

  const { robot, manufacturer, specs } = data;
  const relatedNews = news.filter(n => n.robot_id === robot.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-[#666]">
        <a href="/robots" className="hover:text-white">Robots</a>
        <span className="mx-2">›</span>
        <span className="text-[#a0a0a0]">{robot.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main content */}
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[robot.status]}`}>
                {robot.status}
              </span>
              <span className="text-sm text-[#666]">{robot.category}</span>
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{robot.name}</h1>
            <a href="#" className="text-sm text-[#3b82f6] hover:underline">{manufacturer.name}</a>
            <span className="mx-2 text-[#333]">·</span>
            <span className="text-sm text-[#666]">{manufacturer.country}</span>
          </div>

          {/* Hero image placeholder */}
          <div className="mb-8 flex h-64 items-center justify-center rounded-xl border border-[#222] bg-[#111] text-6xl text-[#333]">
            <FontAwesomeIcon icon={faRobot} />
          </div>

          <p className="mb-8 text-lg text-[#a0a0a0]">{robot.summary}</p>

          {/* Capabilities */}
          {robot.capabilities && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Capabilities</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {robot.capabilities.can_fold_laundry === true && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faShirt} className="text-2xl" />
                    <span className="text-sm font-medium">Fold Laundry</span>
                  </div>
                )}
                {robot.capabilities.can_vacuum === true && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faBroom} className="text-2xl" />
                    <span className="text-sm font-medium">Vacuum Cleaning</span>
                  </div>
                )}
                {robot.capabilities.can_climb_stairs === true && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faStairs} className="text-2xl" />
                    <span className="text-sm font-medium">Climb Stairs</span>
                  </div>
                )}
                {robot.capabilities.max_lift_kg && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faDumbbell} className="text-2xl" />
                    <span className="text-sm font-medium">Lift up to {robot.capabilities.max_lift_kg}kg</span>
                  </div>
                )}
                {robot.capabilities.max_carry_kg && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faBox} className="text-2xl" />
                    <span className="text-sm font-medium">Carry up to {robot.capabilities.max_carry_kg}kg</span>
                  </div>
                )}
                {robot.capabilities.autonomous_duration_hours && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                    <FontAwesomeIcon icon={faBatteryFull} className="text-2xl" />
                    <span className="text-sm font-medium">{robot.capabilities.autonomous_duration_hours}h autonomous</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Degrees of Freedom */}
          {robot.dof && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Degrees of Freedom</h2>
              <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {robot.dof.total && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#3b82f6]">{robot.dof.total}</div>
                      <div className="text-sm text-[#666]">Total DOF</div>
                    </div>
                  )}
                  {robot.dof.hands_each && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#10b981]">{robot.dof.hands_each}</div>
                      <div className="text-sm text-[#666]">Per Hand</div>
                    </div>
                  )}
                  {robot.dof.arms_each && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#f59e0b]">{robot.dof.arms_each}</div>
                      <div className="text-sm text-[#666]">Per Arm</div>
                    </div>
                  )}
                  {robot.dof.legs_each && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#ef4444]">{robot.dof.legs_each}</div>
                      <div className="text-sm text-[#666]">Per Leg</div>
                    </div>
                  )}
                  {robot.dof.torso && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#8b5cf6]">{robot.dof.torso}</div>
                      <div className="text-sm text-[#666]">Torso</div>
                    </div>
                  )}
                  {robot.dof.head && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#ec4899]">{robot.dof.head}</div>
                      <div className="text-sm text-[#666]">Head</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI & Brain */}
          {robot.ai && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">AI & Brain</h2>
              <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
                <div className="space-y-4">
                  {robot.ai.model && (
                    <div>
                      <span className="text-sm font-medium text-[#a0a0a0]">AI Model:</span>
                      <p className="mt-1">{robot.ai.model}</p>
                    </div>
                  )}
                  {robot.ai.response_time && (
                    <div>
                      <span className="text-sm font-medium text-[#a0a0a0]">Response Time:</span>
                      <p className="mt-1">{robot.ai.response_time}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    {robot.ai.voice_capable !== null && (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={robot.ai.voice_capable ? faMicrophone : faMicrophoneSlash} 
                          className="text-lg" 
                        />
                        <span className="text-sm">{robot.ai.voice_capable ? 'Voice Capable' : 'No Voice'}</span>
                      </div>
                    )}
                    {robot.ai.autonomy_level && (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={robot.ai.autonomy_level === 'full_autonomous' ? faRobot : 
                                robot.ai.autonomy_level === 'teleoperated' ? faGamepad : faBolt} 
                          className="text-lg"
                        />
                        <span className="text-sm capitalize">{robot.ai.autonomy_level.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Battery */}
          {robot.battery && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Battery & Power</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {robot.battery.capacity_kwh && (
                  <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
                    <div className="text-xl font-bold text-[#10b981]">{robot.battery.capacity_kwh}</div>
                    <div className="text-sm text-[#666]">kWh Capacity</div>
                  </div>
                )}
                {robot.battery.life_hours && (
                  <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
                    <div className="text-xl font-bold text-[#3b82f6]">{robot.battery.life_hours}</div>
                    <div className="text-sm text-[#666]">Hours Runtime</div>
                  </div>
                )}
                {robot.battery.charge_time_hours && (
                  <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
                    <div className="text-xl font-bold text-[#f59e0b]">{robot.battery.charge_time_hours}</div>
                    <div className="text-sm text-[#666]">Hours to Charge</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Traditional Specs */}
          <h2 className="mb-4 text-xl font-semibold">Technical Specifications</h2>
          <SpecTable specs={specs} />

          {/* Related News */}
          {relatedNews.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Related News</h2>
              <div className="space-y-3">
                {relatedNews.map(article => (
                  <div key={article.id} className="rounded-lg border border-[#222] bg-[#161616] p-4">
                    <time className="text-xs text-[#666]">{article.published_at}</time>
                    <h3 className="mt-1 font-medium">{article.title}</h3>
                    <p className="mt-1 text-sm text-[#a0a0a0] line-clamp-2">{article.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Availability & Pricing */}
          <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-medium text-[#a0a0a0]">Availability & Pricing</h3>
            <div className="space-y-3">
              {robot.purchase_price_usd && (
                <div>
                  <span className="text-sm text-[#666]">Price</span>
                  <div className="text-lg font-bold text-[#10b981]">${robot.purchase_price_usd.toLocaleString()}</div>
                </div>
              )}
              {robot.expected_delivery && (
                <div>
                  <span className="text-sm text-[#666]">Expected Delivery</span>
                  <div className="font-medium">{robot.expected_delivery}</div>
                </div>
              )}
              {robot.country_of_origin && (
                <div>
                  <span className="text-sm text-[#666]">Made in</span>
                  <div className="font-medium">{robot.country_of_origin}</div>
                </div>
              )}
              {robot.purchase_url && (
                <a 
                  href={robot.purchase_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-lg bg-[#3b82f6] px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-[#2563eb]"
                >
                  Learn More →
                </a>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-medium text-[#a0a0a0]">Quick Specs</h3>
            {specs.filter(s => ['Height', 'Weight', 'Top Speed', 'Walking Speed', 'Payload', 'Battery Life', 'Price'].includes(s.spec_key)).map(s => (
              <div key={s.id} className="flex justify-between border-b border-[#1a1a1a] py-2 text-sm last:border-0">
                <span className="text-[#666]">{s.spec_key}</span>
                <span className="font-medium">{s.spec_value} {s.spec_unit}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-medium text-[#a0a0a0]">Manufacturer</h3>
            <p className="font-medium">{manufacturer.name}</p>
            <p className="mt-1 text-sm text-[#666]">{manufacturer.country} · Founded {manufacturer.founded_year}</p>
            <p className="mt-2 text-sm text-[#a0a0a0]">{manufacturer.description}</p>
            {manufacturer.website && (
              <a href={manufacturer.website} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-[#3b82f6] hover:underline">
                Website →
              </a>
            )}
          </div>

          <a href={`/compare?robots=${robot.slug}`} className="block rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4 text-center text-sm font-medium text-[#3b82f6] transition hover:bg-[#3b82f6]/20">
            Compare this robot →
          </a>
        </aside>
      </div>
    </div>
  );
}
