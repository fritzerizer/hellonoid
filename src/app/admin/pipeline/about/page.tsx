import Link from 'next/link';

const steps = [
  {
    num: 1, name: 'Research',
    description: 'Search for new robots on manufacturer websites, news outlets, and social media. All sources are stored in the database and can be managed by admin.',
    details: [
      'Cron-based updates for robots under research',
      'Logging of last search per source',
      'Support for manufacturer sites, news sites, Reddit, and more',
    ],
    automated: true,
  },
  {
    num: 2, name: 'Duplicate Check',
    description: 'Verify the robot does not already exist in the hellonoid.com database. Matches on name, manufacturer, and slug.',
    details: ['Fuzzy matching to catch name variants'],
    automated: true,
  },
  {
    num: 3, name: 'Create Robot',
    description: 'Create a new robot entry in the database with status "researching". Basic information is filled in: name, manufacturer, category.',
    details: [
      'Status set to "researching"',
      'Height pulled from specs if available',
      'Pipeline version started (v1)',
    ],
    automated: false,
  },
  {
    num: 4, name: 'Create Storage',
    description: 'Create a dedicated storage folder for the robot\'s assets. The folder name is based on the robot\'s database ID and slug.',
    details: ['Cloudflare R2 for raw materials and 3D models', 'Supabase Storage for intermediate steps'],
    automated: true,
  },
  {
    num: 5, name: 'Subfolders',
    description: 'Create standardized subfolders: raw materials, 3D model, and export.',
    details: ['raw/ — original images and reference material', '3d-model/ — GLB, FBX, and Blender files', 'export/ — final web-ready images'],
    automated: true,
  },
  {
    num: 6, name: 'Collect Media',
    description: 'Collect images covering the entire robot — front, back, sides — in the highest resolution possible. Images are cropped so only the robot is visible.',
    details: [
      'Automatic search via manufacturer sites and press images',
      'Manual upload by admin with type and angle selection',
      'Target angles: front, back, left, right, three-quarter front',
      'Supports JPG, PNG, WebP',
    ],
    automated: false,
  },
  {
    num: 7, name: 'Validate Media',
    description: 'Admin reviews and approves collected images. Checks that all angles are covered and resolution is sufficient.',
    details: [
      'Approve or reject each image with a freetext comment',
      'Comments carry forward to any regeneration attempts',
      'If the material is insufficient — back to step 6',
    ],
    automated: false,
  },
  {
    num: 8, name: 'Generate Rigged Views',
    description: 'Create consistent images in fixed angles using AI (Gemini). Six standard angles are generated based on approved reference images.',
    details: [
      'Standard angles: front, side, back, three-quarter front, top, bottom',
      'Configurable prompts per angle — editable in admin',
      'AI profiles: Gemini as default, support for other models',
      'Robot-specific prompt overrides when needed',
    ],
    automated: true,
  },
  {
    num: 9, name: 'Validate Rigged Views',
    description: 'Review the AI-generated views. If quality is not sufficient, the robot is sent back to step 6 for better reference material.',
    details: [
      'Freetext comments that carry forward to regeneration',
      'Compare against reference images for consistency',
    ],
    automated: false,
  },
  {
    num: 10, name: 'Upscale',
    description: 'Create high-resolution versions of each approved view separately. Maximizes image quality before 3D modeling.',
    details: ['AI-based upscaling', 'Individual image per view angle'],
    automated: true,
  },
  {
    num: 11, name: '3D Modeling',
    description: 'Send materials to Meshy.ai for automatic 3D model generation. Uses the best front-view image as input.',
    details: [
      'Meshy.ai API with model "latest" (Meshy-6)',
      '100K polygons, triangulated mesh',
      'PBR textures (metallic, roughness, normal)',
      'Automatic symmetry',
      'Max 3 generations per robot (configurable)',
      'Cost: ~30 credits per generation (mesh + texture)',
      'Current balance: displayed in the pipeline detail view',
    ],
    automated: true,
  },
  {
    num: 12, name: 'Validate 3D Model',
    description: 'Review the generated 3D model. Check proportions, details, and texture quality.',
    details: ['3D preview in admin', 'If the model is not good enough — new generation or back to step 6'],
    automated: false,
  },
  {
    num: 13, name: 'Import to Blender',
    description: 'Import the approved 3D model (GLB) into Blender for post-processing.',
    details: ['Blender 5.0.1 via headless Python script', 'Automatic GLB format import'],
    automated: true,
  },
  {
    num: 14, name: 'Auto Cleanup',
    description: 'Run predefined Blender scripts to improve model quality automatically.',
    details: [
      'Smooth normals (30° auto-smooth)',
      'Remove loose vertices',
      'Material cleanup',
      'UV fixes',
      'Ground alignment (feet on the floor)',
      'Predefined adjustments can be enabled/disabled per robot',
    ],
    automated: true,
  },
  {
    num: 15, name: 'Manual Adjustments',
    description: 'Option to make additional adjustments as needed. Predefined adjustments are available, plus the ability to add custom ones per robot.',
    details: [
      'Predefined: smooth normals, material cleanup, scale normalization, UV cleanup, ground alignment',
      'Admin can add custom instructions per robot',
      'All adjustments logged with timestamps',
    ],
    automated: false,
  },
  {
    num: 16, name: 'Validate Result',
    description: 'Final validation of the finished 3D model after all adjustments. Last chance to send it back for improvement.',
    details: ['Compare with reference images', 'Check proportions and details'],
    automated: false,
  },
  {
    num: 17, name: 'Export for Web',
    description: 'Export images optimized for hellonoid.com. Proportional sizing, transparent background, and watermark.',
    details: [
      'Proportional scaling: reference height 180cm = 100% image height',
      'A robot at 150cm takes up 83% of the image height',
      'Height is pulled from specs — unconfirmed height is flagged',
      'Three export sizes: thumbnail (200px), card (400px), full (1024px)',
      'Three standard views: front, left side, three-quarter front',
      'Transparent background (WebP with alpha)',
      'Watermark "hellonoid.com" on full size',
      'Professional 3-point lighting with contact shadows',
    ],
    automated: true,
  },
  {
    num: 18, name: 'Upload',
    description: 'Upload the finished images to hellonoid.com. Updates the robot\'s hero image and gallery.',
    details: ['Automatic upload to Vercel/Supabase', 'Update of the robots table'],
    automated: true,
  },
  {
    num: 19, name: 'Ready to Publish',
    description: 'The robot is marked as ready to publish. Admin does a final review and publishes.',
    details: [
      'Preview of how the robot looks live',
      'Robot status changed to published',
      'Pipeline version marked as completed',
    ],
    automated: false,
  },
];

export default function PipelineAboutPage() {
  const automatedCount = steps.filter(s => s.automated).length;
  const manualCount = steps.filter(s => !s.automated).length;

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Asset Pipeline</h1>
            <p className="mt-2 text-gray-400">
              19 steps from research to publication. Every robot goes through this process
              to ensure consistent, high-quality images on hellonoid.com.
            </p>
          </div>
          <Link href="/admin/pipeline" className="rounded-md bg-[#239eab] px-4 py-2 text-sm text-white hover:bg-[#1e8a95] transition">
            Open Pipeline →
          </Link>
        </div>

        {/* Summary */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-[#239eab]">19</div>
            <div className="text-sm text-gray-400">Total Steps</div>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{automatedCount}</div>
            <div className="text-sm text-gray-400">Automated</div>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{manualCount}</div>
            <div className="text-sm text-gray-400">Manual Review</div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="mb-10 rounded-lg border border-[#239eab]/20 bg-[#239eab]/5 p-6">
          <h2 className="mb-3 text-lg font-semibold">Key Concepts</h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">Proportional Sizing</h3>
              <p>All robots are rendered in proportion to each other. A 170cm robot takes up more of the image than a 120cm one. Reference height: 180cm = 100%.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Versioning</h3>
              <p>Each time a robot goes through the pipeline, the version is incremented. Previous versions are kept — you can always compare and roll back.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Reprocessing</h3>
              <p>Already published robots can be run through the pipeline again to improve quality. Better images, better 3D model, better specs — everything can be refined.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">AI Profiles</h3>
              <p>Gemini is the default for image generation, but other models can be configured. Prompts are editable per angle and per robot.</p>
            </div>
          </div>
        </div>

        {/* All Steps */}
        <h2 className="mb-6 text-xl font-bold">All Steps in Detail</h2>
        <div className="space-y-4">
          {steps.map(step => (
            <div key={step.num} className="rounded-lg border border-[#222] bg-[#161616] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#239eab]/20 text-[#239eab] font-bold">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{step.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      step.automated
                        ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                        : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                    }`}>
                      {step.automated ? 'Automated' : 'Manual Review'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{step.description}</p>
                  {step.details.length > 0 && (
                    <ul className="space-y-1">
                      {step.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#239eab]" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="mt-10 rounded-lg border border-[#222] bg-[#161616] p-6">
          <h2 className="mb-4 text-lg font-semibold">Tech Stack</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Supabase — Database and file storage
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Gemini 2.0 — AI image generation
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Meshy.ai — 3D model generation
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Blender 5.0 — 3D post-processing
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Next.js 15 — Admin interface
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Vercel — Hosting and CDN
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Last updated: 2026-03-10
        </div>
      </div>
    </div>
  );
}
