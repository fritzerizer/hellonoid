#!/bin/bash
set -e

GEMINI_KEY=$(cat ~/.secrets/gemini-api-key)
OUTDIR="/Users/julia/apps/hellonoid/public/logo-gen"
mkdir -p "$OUTDIR"
MODEL="gemini-2.5-flash-image"

generate() {
  local num=$1
  local prompt=$2
  local outfile="$OUTDIR/logo-${num}.png"
  
  if [ -f "$outfile" ]; then
    echo "Skip #${num} (exists)"
    return
  fi
  
  echo "Generating #${num}..."
  
  curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=$GEMINI_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"contents\": [{
        \"parts\": [{\"text\": \"$prompt\"}]
      }],
      \"generationConfig\": {
        \"responseModalities\": [\"IMAGE\", \"TEXT\"]
      }
    }" | python3 -c "
import sys, json, base64
try:
    resp = json.load(sys.stdin)
    parts = resp.get('candidates',[{}])[0].get('content',{}).get('parts',[])
    for part in parts:
        if 'inlineData' in part:
            data = base64.b64decode(part['inlineData']['data'])
            with open('$outfile', 'wb') as f:
                f.write(data)
            print(f'  OK: {len(data)} bytes')
            break
    else:
        print(f'  WARN: No image in response')
        # Check for error
        if 'error' in resp:
            print(f'  Error: {resp[\"error\"].get(\"message\",\"\")}')
except Exception as e:
    print(f'  ERROR: {e}')
"
  sleep 2  # Rate limiting
}

# ═══════════════════════════════════════════════════════════
# CATEGORY A: Negative space - Robot carved into H
# ═══════════════════════════════════════════════════════════

generate 1 "Professional logo design for 'Hellonoid', a humanoid robot database. The logo is a bold solid letter H with a humanoid robot silhouette carved out using negative space. The robot stands inside the H shape. Modern, clean, geometric. Single color teal (#239eab) on pure white background. Minimalist flat vector style. No text, only the icon mark. High contrast."

generate 2 "Minimalist logo icon: Letter H monogram with a walking humanoid robot figure cut out from the center using negative space technique. The robot has a round head, slim body, and legs in a walking pose. Solid dark navy blue (#1B3160) on white background. Professional corporate logo, flat design, geometric precision. No text."

generate 3 "Logo mark for a robotics company: A shield-shaped letter H with a futuristic humanoid robot silhouette in negative space. The robot has a visor-style head, broad shoulders, and strong stance. Teal gradient from #239eab to #74deee. Clean edges, modern tech aesthetic. White background. No text."

generate 4 "App icon style logo: Rounded square (squircle) shape containing the letter H with a small humanoid robot figure embedded in negative space at the center. Teal color (#239eab). Ultra-clean, Apple-design-inspired simplicity. White background. No text, icon only."

generate 5 "Logo design: A solid geometric H letterform where the crossbar is replaced by a humanoid robot torso. The robot's arms extend to form the crossbar connecting the two vertical pillars. Robot head sits above. Teal (#239eab) monochrome. Modern, architectural feel. White background. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY B: Robot IS the H shape
# ═══════════════════════════════════════════════════════════

generate 6 "Creative logo: A humanoid robot whose body naturally forms the letter H. The robot stands with arms outstretched horizontally, connecting to two vertical pillars on each side. The robot's legs and the pillars create the H shape. Teal color, flat design, minimalist. White background. No text."

generate 7 "Logo mark: An abstract humanoid robot figure that doubles as the letter H. Two vertical bars form the legs/pillars, a horizontal bar forms the arms/crossbar, and a circle on top forms the head. Simple geometric shapes only. Teal (#239eab). White background. No text, pure icon."

generate 8 "Modern logo combining letter H and robot: The robot stands between two tall pillars, arms reaching out to touch each pillar, forming an H composition. Rounded friendly design, teal color. Like a tech startup logo. White background. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY C: Detailed/Premium
# ═══════════════════════════════════════════════════════════

generate 9 "Premium luxury logo for Hellonoid robotics: An elegant H monogram with a detailed humanoid robot silhouette in negative space. The H has a shield/crest shape with slightly rounded bottom. Fine lines showing robot details - visor, chest plate, joints. Dark teal on white. Sophisticated, like a car brand emblem. No text."

generate 10 "Tech company logo: Hexagonal badge containing letter H with a futuristic android robot cutout. The robot has LED-style eyes and segmented body. Metallic teal look, clean vector design. Professional and authoritative. White background. No text."

generate 11 "Logo for a robotics database: Circular emblem with a humanoid robot standing inside the letter H. The composition fits perfectly in a circle. The robot has a friendly but professional appearance. Teal and dark navy color scheme. White background. No text, emblem only."

generate 12 "Futuristic logo mark: Letter H constructed from tech/circuit-board style lines, with a humanoid robot silhouette at the center where circuits converge. Glowing teal (#239eab) lines on dark background. Sci-fi inspired but still clean enough for a logo. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY D: Abstract/Artistic
# ═══════════════════════════════════════════════════════════

generate 13 "Abstract logo: The letter H formed by two parallel lines with a stylized humanoid figure between them. The figure is reduced to essential geometric shapes - circle head, triangle torso, line limbs. Ultra-minimal. Teal (#239eab). White background. No text."

generate 14 "Artistic logo design: Letter H where the negative space between the strokes reveals a humanoid robot silhouette when you look closely. Optical illusion / hidden image concept. Solid teal color. Clean professional design. White background. No text."

generate 15 "Logo: Bold chunky letter H with a small robot figure standing in the doorway-like opening of the H crossbar area. The robot is tiny compared to the massive H, creating a sense of scale. Teal color. Minimalist. White background. No text."

generate 16 "Modern logo mark: Two vertical rectangles with rounded ends, connected by a horizontal bar with a robot head shape on top. Reads as both H and robot simultaneously. Gradient from dark teal to light cyan. Clean vector. White background. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY E: Wordmark + Icon combinations
# ═══════════════════════════════════════════════════════════

generate 17 "Logo with wordmark: The word HELLONOID in clean modern sans-serif font, where the H at the beginning has a small humanoid robot silhouette integrated into it via negative space. Teal (#239eab) color. White background. Professional tech brand styling."

generate 18 "Brand logo: Icon of H-robot (letter H with humanoid robot in negative space) placed above the word 'hellonoid' in lowercase clean sans-serif. Teal icon, dark gray text. White background. Modern SaaS/tech brand aesthetic."

generate 19 "Logo design: The word HELLONOID where the letter H is replaced by a humanoid robot figure standing with arms slightly out. The robot seamlessly connects to the rest of the letters. Teal color, modern geometric sans-serif. White background."

generate 20 "Split logo: Left side has a bold H-robot icon (teal shield with robot cutout), right side has 'Hellonoid' in modern font. Balanced professional layout. White background."

# ═══════════════════════════════════════════════════════════
# CATEGORY F: Color variations
# ═══════════════════════════════════════════════════════════

generate 21 "Logo: Letter H with humanoid robot in negative space. Bold solid black version. Pure geometric shapes, no rounded corners. Stark contrast. White background. Professional monochrome design. No text."

generate 22 "Logo: Letter H with humanoid robot silhouette in negative space. Gradient from electric blue to teal to cyan (#0066ff to #239eab to #74deee). Modern tech gradient style. White background. No text."

generate 23 "Logo on dark background: Letter H with humanoid robot in negative space. White/light cyan glow on dark navy (#0a0a1a) background. Slight neon glow effect. Futuristic tech aesthetic. No text."

generate 24 "Logo: Letter H with humanoid robot in negative space. Deep ocean navy (#1B3160) color. Classic, authoritative, premium feel. Like a luxury automotive brand. White background. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY G: Shape variations
# ═══════════════════════════════════════════════════════════

generate 25 "Logo: Pentagon-shaped badge containing letter H with humanoid robot silhouette. Military/space agency inspired but modern and clean. Teal color. White background. No text."

generate 26 "Logo: Diamond/rhombus shape containing H with robot cutout. Rotated square, creating a dynamic angular feel. Teal (#239eab). Geometric precision. White background. No text."

generate 27 "Logo: Tall narrow H with a proportionally tall slim humanoid robot in negative space. Elegant vertical proportions. Like a fashion brand mark. Teal color. White background. No text."

generate 28 "Logo: Wide squat H with a stocky powerful robot silhouette in negative space. Industrial, heavy, strong. Dark teal. White background. No text."

# ═══════════════════════════════════════════════════════════
# CATEGORY H: Innovative concepts
# ═══════════════════════════════════════════════════════════

generate 29 "Logo concept: The letter H formed by two humanoid robots facing each other, their extended arms meeting in the middle to form the crossbar. Symmetrical, teal color, flat design. White background. No text."

generate 30 "Logo: A 3D isometric letter H with a humanoid robot shadow/silhouette cast on its surface. Modern dimensional design but still clean and usable as a logo. Teal shades. White background. No text."

echo "=== Done! ==="
ls -la "$OUTDIR"/*.png 2>/dev/null | wc -l
