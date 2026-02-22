# Hellonoid.com — Plan (from Fredrik's Apple Note)

## Vision
Bridge between tech and regular people who will eventually have humanoid robots at home/work/school/healthcare. Aggregate ALL available information about humanoid robots.

## Revenue Model (future)
- Ad revenue (not initially)
- Affiliate links (where purchase is possible)

---

## Phase 1: Data & Specs Overhaul ✨

### Extended Robot Data Model
Add these fields/specs per robot:

**Availability & Manufacturing:**
- `expected_manufacturing_start` — when mass production begins
- `expected_delivery_start` — when first deliveries expected
- `purchase_url` — link to buy (if available)
- `purchase_price` — current price
- `expected_volume` — annual production capacity
- `country_of_origin` — manufacturing country

**Capabilities / Chores:**
- `can_fold_laundry` — boolean + notes
- `can_vacuum` — boolean + notes  
- `can_climb_stairs` — boolean + notes
- `max_lift_capacity` — kg
- `max_carry_capacity` — kg
- `autonomous_task_duration` — how long it can work independently
- `autonomous_task_count` — how many different tasks

**Degrees of Freedom (detailed):**
- `dof_total` — total DOF
- `dof_hands` — per hand
- `dof_arms` — per arm
- `dof_legs` — per leg
- `dof_torso` — torso/spine
- `dof_head` — head/neck

**Brain / AI:**
- `ai_model` — which AI model(s) it uses
- `ai_response_time` — latency
- `voice_capability` — voice interaction details
- `autonomy_level` — full autonomous / teleoperated / hybrid

**Battery:**
- `battery_capacity_kwh`
- `battery_life_hours` — active use
- `charge_time_hours`

### Implementation
- Restructure `robots.ts` with typed interfaces for all new fields
- Add structured `capabilities` object per robot
- Research and fill in real data for all 10 robots

---

## Phase 2: Visual Identity & Style Guide 🎨

### Brand Direction (from note)
- Friendly but very professional
- Distinctive font that's modern and recognizable
- "Kind" colors but expertly composed

### Changes
- Replace system-ui with a custom font pairing (e.g., Inter for body, Space Grotesk or similar for headings)
- Soften the pure dark theme slightly — keep dark but add warmth
- Design a proper logo/wordmark for "hellonoid"
- Add subtle gradients and micro-animations

---

## Phase 3: Avatar Pipeline 🤖

### Concept (from note)
Generate consistent 2D proportional illustrations of each robot:
- **Front view + Side view** (like a mugshot)
- **Proportionally correct** — robots shown in relation to each other's actual size
- Strict style guide for consistency across all robots
- Research reference images → generate standardized avatars

### Implementation
- Create a prompt template/style guide for image generation
- Use reference photos from the web to generate front+side views
- All avatars on same scale (e.g., 180cm = full height, shorter robots shown shorter)
- Store as `avatar_front_url` and `avatar_side_url` per robot
- Display on robot cards and detail pages with height ruler

---

## Phase 4: News Pipeline 📰

### Concept (from note)
- Short headline + ingress + link to source
- Possibly generate illustration based on the source article's image
- News linked to specific robot/manufacturer

### Implementation
- Automated research pipeline (cron job) that:
  1. Searches for news about each robot/manufacturer
  2. Summarizes with headline + short ingress
  3. Links back to original source
  4. Optionally generates a styled illustration
- News feed page with filters by robot/manufacturer
- News cards on robot detail pages

---

## Phase 5: Avatar Research Pipeline 🔄

### Concept (from note)
- Daily research to find new visual material for each robot
- If new details found → upgrade avatar → propose new version for publishing
- Continuous improvement cycle

### Implementation
- Cron job: daily research per robot model
- Compare findings with existing avatar data
- Flag robots needing avatar updates
- Generate new version, store as draft for review

---

## Immediate TODO (Phase 1 implementation)

1. ✅ Restructure data model with all new spec categories
2. ✅ Research and fill real data for all 10 robots  
3. ✅ Add "Capabilities" section to robot detail page
4. ✅ Add "Availability" section with dates and purchase links
5. ✅ Add "AI & Intelligence" section
6. ✅ Improve the hero section copy to reflect "bridge" positioning
7. ✅ Add affiliate-ready purchase links where applicable
8. ✅ Update font to something distinctive (Inter + Space Grotesk)
