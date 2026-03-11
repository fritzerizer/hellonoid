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
    requirements: 'Robot must be identified and sourced from a reliable reference.',
    tips: 'Start with manufacturer press releases — they usually have the best photos and specs.',
  },
  {
    num: 2, name: 'Duplicate Check',
    description: 'Verify the robot does not already exist in the hellonoid.com database. Matches on name, manufacturer, and slug.',
    details: ['Fuzzy matching to catch name variants'],
    automated: true,
    requirements: 'No existing robot with same name and manufacturer.',
    tips: 'Check both the robot name and any alternate names (e.g., "Optimus Gen 2" vs "Tesla Bot Gen 2").',
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
    requirements: 'Robot name, manufacturer, and category must be provided.',
    tips: 'Get the height right from the start — it affects proportional sizing in export (step 17).',
  },
  {
    num: 4, name: 'Create Storage',
    description: 'Create a dedicated storage folder for the robot\'s assets. The folder name is based on the robot\'s database ID and slug.',
    details: ['Cloudflare R2 for raw materials and 3D models', 'Supabase Storage for intermediate steps'],
    automated: true,
    requirements: 'Robot must exist in database.',
    tips: 'This step is automatic — just approve to continue.',
  },
  {
    num: 5, name: 'Subfolders',
    description: 'Create standardized subfolders: raw materials, 3D model, and export.',
    details: ['raw/ — original images and reference material', '3d-model/ — GLB, FBX, and Blender files', 'export/ — final web-ready images'],
    automated: true,
    requirements: 'Storage folder must exist.',
    tips: 'This step is automatic — just approve to continue.',
  },
  {
    num: 6, name: 'Collect Media',
    description: 'Collect images covering the entire robot — front, back, sides — in the highest resolution possible. The auto-collect feature uses Brave Image Search with multiple query strategies and filters out logos/icons/diagrams automatically.',
    details: [
      'Auto-collect searches 8+ different queries for different angles',
      'Filters: minimum 400px, no SVG/ICO/GIF, no logos/icons/banners',
      'Shows source URL and file size for every collected image',
      'Manual upload with drag-and-drop support',
      'Target angles: front, back, left, right, three-quarter front',
      'Supports JPG, PNG, WebP',
    ],
    automated: false,
    requirements: 'At least 4-6 high-quality images covering all major angles. Minimum resolution: 800x800px recommended.',
    tips: 'Use auto-collect first, then manually upload any missing angles. Press photos from manufacturer sites are usually the best quality. The more angles you cover, the better the 3D model will be.',
  },
  {
    num: 7, name: 'Validate Media',
    description: 'Admin reviews and approves collected images. The interface shows which required angles are covered (front, back, left, right) and lets you batch approve/reject multiple images at once.',
    details: [
      'Batch approve/reject: select multiple images and approve all at once',
      'Missing angle indicator shows which views still need to be covered',
      'Click any image to enlarge in lightbox with arrow key navigation',
      'Drag-and-drop upload for quick additions',
      'Source URL displayed for every auto-collected image',
      'File size shown on every image',
      'If the material is insufficient — back to step 6',
    ],
    automated: false,
    requirements: 'All 4 required angles (front, back, left, right) must have at least one approved image.',
    tips: 'Reject blurry images, images with heavy watermarks, or images that don\'t clearly show the robot. Use batch approve for quick workflows.',
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
    requirements: 'At least one approved reference image (front view preferred).',
    tips: 'More approved reference images = better AI-generated views. The AI uses all approved images as context.',
  },
  {
    num: 9, name: 'Validate Rigged Views',
    description: 'Review the AI-generated views. If quality is not sufficient, the robot is sent back to step 6 for better reference material.',
    details: [
      'Freetext comments that carry forward to regeneration',
      'Compare against reference images for consistency',
    ],
    automated: false,
    requirements: 'All generated views must look accurate and consistent with the real robot.',
    tips: 'Pay attention to proportions, color accuracy, and missing details. If one angle is off, you can regenerate just that angle.',
  },
  {
    num: 10, name: 'Upscale',
    description: 'Create high-resolution versions of each approved view separately. Maximizes image quality before 3D modeling.',
    details: ['AI-based upscaling', 'Individual image per view angle'],
    automated: true,
    requirements: 'All rigged views must be approved.',
    tips: 'This step is automatic. If results are blurry, consider going back to improve source material.',
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
    ],
    automated: true,
    requirements: 'Approved, upscaled front view image.',
    tips: 'If the first generation isn\'t great, try again — each attempt can produce different results. You have up to 3 attempts.',
  },
  {
    num: 12, name: 'Validate 3D Model',
    description: 'Review the generated 3D model. Check proportions, details, and texture quality.',
    details: ['3D preview in admin', 'If the model is not good enough — new generation or back to step 6'],
    automated: false,
    requirements: '3D model must look proportionally correct and have acceptable texture quality.',
    tips: 'Rotate the model to check all sides. Common issues: missing fingers, wrong proportions, texture artifacts.',
  },
  {
    num: 13, name: 'Import to Blender',
    description: 'Import the approved 3D model (GLB) into Blender for post-processing.',
    details: ['Blender 5.0.1 via headless Python script', 'Automatic GLB format import'],
    automated: true,
    requirements: 'Approved 3D model.',
    tips: 'Automatic step — just approve to continue.',
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
    requirements: 'Model imported into Blender.',
    tips: 'Review the cleanup results carefully — sometimes auto-cleanup can break certain geometry.',
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
    requirements: 'Review completed adjustments and verify quality.',
    tips: 'Skip this step if auto-cleanup produced good results. Otherwise, add specific instructions for manual fixes.',
  },
  {
    num: 16, name: 'Validate Result',
    description: 'Final validation of the finished 3D model after all adjustments. Last chance to send it back for improvement.',
    details: ['Compare with reference images', 'Check proportions and details'],
    automated: false,
    requirements: 'Model must match reference images and pass quality check.',
    tips: 'This is the last quality gate before export. Be thorough.',
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
    requirements: 'Validated 3D model and confirmed robot height.',
    tips: 'If height is unconfirmed, the export will still work but with a warning flag. Confirm height for accurate proportional sizing.',
  },
  {
    num: 18, name: 'Upload',
    description: 'Upload the finished images to hellonoid.com. Updates the robot\'s hero image and gallery.',
    details: ['Automatic upload to Vercel/Supabase', 'Update of the robots table'],
    automated: true,
    requirements: 'Export completed successfully.',
    tips: 'Automatic step — verify on the live site after upload.',
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
    requirements: 'All images uploaded and robot page looks correct.',
    tips: 'Check the live preview before publishing. Once published, the robot appears on hellonoid.com.',
  },
];

export default function PipelineAboutPage() {
  const automatedCount = steps.filter(s => s.automated).length;
  const manualCount = steps.filter(s => !s.automated).length;

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
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

        {/* Quick Start Guide */}
        <div className="mb-10 rounded-lg border border-green-500/20 bg-green-900/10 p-6">
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <span className="text-green-400">🚀</span> Quick Start Guide
          </h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex gap-3">
              <span className="text-green-400 font-bold w-6">1.</span>
              <span>Add a robot to the pipeline from the <Link href="/admin/pipeline" className="text-[#239eab] hover:underline">dashboard</Link>.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400 font-bold w-6">2.</span>
              <span>Steps 1-5 handle setup (mostly automated). Approve through them quickly.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400 font-bold w-6">3.</span>
              <span>At step 6, use <strong>Auto-Collect</strong> to search for reference images. Upload any missing angles manually.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400 font-bold w-6">4.</span>
              <span>At step 7, <strong>validate images</strong>. Use batch approve for efficiency. Ensure all 4 required angles are covered.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400 font-bold w-6">5.</span>
              <span>Steps 8-19 handle AI generation, 3D modeling, and export. Review at validation steps.</span>
            </div>
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
              <h3 className="font-medium text-white mb-1">Required Angles</h3>
              <p>Four angles must be covered: <strong>front, back, left, right</strong>. The validation interface shows which are missing.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Batch Operations</h3>
              <p>Select multiple images and approve/reject them all at once. Use &quot;Select all pending&quot; for quick workflows.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Drag &amp; Drop</h3>
              <p>Drop image files anywhere on the pipeline detail page to upload them. They&apos;ll be added as reference images by default.</p>
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
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                  
                  {/* Requirements */}
                  <div className="mb-3 rounded-md bg-[#111] p-3">
                    <div className="text-xs font-semibold text-[#239eab] mb-1">Requirements to Pass</div>
                    <p className="text-xs text-gray-400">{step.requirements}</p>
                  </div>

                  {step.details.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {step.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#239eab]" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Tips */}
                  <div className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-yellow-400 flex-shrink-0">💡</span>
                    <span>{step.tips}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-10 rounded-lg border border-[#222] bg-[#161616] p-6">
          <h2 className="mb-4 text-lg font-semibold">Keyboard Shortcuts</h2>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-3 text-gray-300">
              <kbd className="rounded bg-gray-800 px-2 py-0.5 text-xs font-mono">Esc</kbd>
              <span>Close lightbox / Cancel dialog</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <kbd className="rounded bg-gray-800 px-2 py-0.5 text-xs font-mono">←</kbd>
              <kbd className="rounded bg-gray-800 px-2 py-0.5 text-xs font-mono">→</kbd>
              <span>Navigate images in lightbox</span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-6 rounded-lg border border-[#222] bg-[#161616] p-6">
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
              <span className="text-[#239eab]">●</span> Brave Search — Image discovery
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Next.js 15 — Admin interface
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Vercel — Hosting and CDN
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Cloudflare R2 — Asset storage
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Last updated: 2026-03-12
        </div>
      </div>
    </div>
  );
}
