#!/bin/bash
SERVICE_KEY=$(cat ~/.secrets/supabase-service-role)
SUPABASE_URL="https://oqdasylggugfxvotpusi.supabase.co"

curl -s "$SUPABASE_URL/rest/v1/robots" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d @- <<'EOF'
[
  {
    "name": "Sophia",
    "slug": "sophia",
    "entity_id": 20,
    "manufacturer_id": 20,
    "status": "shipping",
    "category": "Social",
    "hero_image_url": "",
    "summary": "The world's most famous humanoid robot and first robot citizen. Known for realistic facial expressions and AI-powered conversations, Sophia has become a global icon for humanoid robotics.",
    "country_of_origin": "Hong Kong",
    "ai": {"voice_capable": true, "autonomy_level": "hybrid"}
  },
  {
    "name": "NAO",
    "slug": "nao",
    "entity_id": 21,
    "manufacturer_id": 21,
    "status": "shipping",
    "category": "Education",
    "hero_image_url": "",
    "summary": "Compact programmable humanoid widely used in education and research. Over 13,000 units deployed worldwide, making it one of the most successful humanoid robot platforms ever.",
    "country_of_origin": "France",
    "dof": {"total": 25},
    "battery": {"life_hours": 1.5},
    "ai": {"voice_capable": true, "autonomy_level": "hybrid"}
  },
  {
    "name": "Pepper",
    "slug": "pepper",
    "entity_id": 21,
    "manufacturer_id": 21,
    "status": "discontinued",
    "category": "Social",
    "hero_image_url": "",
    "summary": "Emotion-reading social robot designed for customer service and public interaction. Deployed in thousands of businesses worldwide before production was paused in 2021.",
    "country_of_origin": "Japan",
    "ai": {"voice_capable": true, "autonomy_level": "hybrid"}
  },
  {
    "name": "Agibot Genie G1",
    "slug": "agibot-genie-g1",
    "entity_id": 22,
    "manufacturer_id": 22,
    "status": "development",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Chinese general-purpose humanoid built for industrial tasks. Features advanced dexterous manipulation and whole-body coordination powered by large-scale AI models.",
    "country_of_origin": "China",
    "dof": {"total": 53, "hands_each": 12},
    "ai": {"autonomy_level": "hybrid"}
  },
  {
    "name": "Dreame Dr.01",
    "slug": "dreame-dr01",
    "entity_id": 23,
    "manufacturer_id": 23,
    "status": "announced",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Dreame's first humanoid robot unveiled at CES 2025. Demonstrates advanced bipedal locomotion and dexterous manipulation, targeting both commercial and consumer applications.",
    "country_of_origin": "China",
    "ai": {"autonomy_level": "hybrid"}
  },
  {
    "name": "LimX CL-1",
    "slug": "limx-cl1",
    "entity_id": 24,
    "manufacturer_id": 24,
    "status": "development",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Full-sized humanoid with industry-leading locomotion capabilities. Demonstrated walking on challenging terrain including snow, gravel, and uneven surfaces without prior training.",
    "country_of_origin": "China",
    "ai": {"autonomy_level": "hybrid"}
  },
  {
    "name": "Galbot G1",
    "slug": "galbot-g1",
    "entity_id": 25,
    "manufacturer_id": 25,
    "status": "development",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Zhiyuan's general-purpose humanoid designed for factory and logistics environments. Features modular design with interchangeable end-effectors for diverse manipulation tasks.",
    "country_of_origin": "China",
    "ai": {"autonomy_level": "hybrid"}
  },
  {
    "name": "Robot Era Star1",
    "slug": "robot-era-star1",
    "entity_id": 26,
    "manufacturer_id": 26,
    "status": "development",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Full-sized humanoid with 42 degrees of freedom designed for real-world deployment. Demonstrated autonomous package delivery and warehouse operations in pilot programs.",
    "country_of_origin": "China",
    "dof": {"total": 42},
    "ai": {"autonomy_level": "hybrid"}
  },
  {
    "name": "Robonaut 2",
    "slug": "robonaut-2",
    "entity_id": 27,
    "manufacturer_id": 27,
    "status": "shipping",
    "category": "Space",
    "hero_image_url": "",
    "summary": "NASA and GM's dexterous humanoid robot designed for space operations. The first humanoid robot in space, stationed on the International Space Station since 2011.",
    "country_of_origin": "United States",
    "dof": {"total": 42, "hands_each": 12},
    "ai": {"autonomy_level": "teleoperated"}
  },
  {
    "name": "Toyota T-HR3",
    "slug": "toyota-thr3",
    "entity_id": 12,
    "manufacturer_id": 12,
    "status": "development",
    "category": "Research",
    "hero_image_url": "",
    "summary": "Toyota's teleoperated humanoid partner robot. Uses master-slave control system allowing operators to control the robot's entire body with natural movements and force feedback.",
    "country_of_origin": "Japan",
    "dof": {"total": 32},
    "ai": {"autonomy_level": "teleoperated"}
  },
  {
    "name": "1X EVE",
    "slug": "1x-eve",
    "entity_id": 2,
    "manufacturer_id": 2,
    "status": "shipping",
    "category": "Industrial",
    "hero_image_url": "",
    "summary": "Wheeled humanoid robot designed for security and telepresence applications. Already deployed commercially in guarding and monitoring roles, serving as 1X's revenue-generating product.",
    "country_of_origin": "Norway",
    "battery": {"life_hours": 8},
    "ai": {"voice_capable": true, "autonomy_level": "hybrid"}
  },
  {
    "name": "Figure 01",
    "slug": "figure-01",
    "entity_id": 3,
    "manufacturer_id": 3,
    "status": "discontinued",
    "category": "General Purpose",
    "hero_image_url": "",
    "summary": "Figure AI's first-generation humanoid robot. Demonstrated autonomous coffee-making and warehouse tasks. Superseded by Figure 02 and 03 but pivotal in establishing Figure AI as a major player.",
    "country_of_origin": "United States",
    "dof": {"total": 40},
    "ai": {"voice_capable": true, "autonomy_level": "hybrid"}
  }
]
EOF
