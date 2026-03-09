#!/bin/bash
set -e

GEMINI_KEY=$(cat ~/.secrets/gemini-api-key)
OUTDIR="/Users/julia/apps/hellonoid/public/logo-gen-v4"
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
        print(f'  WARN: No image')
except Exception as e:
    print(f'  ERROR: {e}')
"
  sleep 2
}

# DESIGN BRIEF context for all prompts:
# - Company: Hellonoid — a database/encyclopedia for humanoid robots
# - Concept: Letter H with subtly embedded humanoid robot
# - Following UCDA golden rules: start B&W, simplicity, not too literal, easy recall, works at all sizes

# ═══════════════════════════════════════════════════════════
# BLACK AND WHITE — Pure form, no color distraction
# ═══════════════════════════════════════════════════════════

generate 1 "Professional logo designer portfolio piece. Black and white only. A letter H monogram where the negative space subtly suggests a standing humanoid figure. The genius is in the proportions — the white space naturally reads as head, torso, legs without any added detail. Like the FedEx arrow or the Amazon smile — you see it once and can never unsee it. Solid black on white. Vector logo quality. No text, no color, no gradients. Must work at 16x16 pixels."

generate 2 "Award-winning logo design, black ink on white paper. A bold geometric H where the crossbar is slightly notched or shaped so the center negative space forms a subtle humanoid silhouette. Not a literal robot — just the essence of a human form hidden in the letter. Think Pentagram or Wolff Olins quality. Simple enough to sketch in 3 seconds. No text."

generate 3 "Logo mark, pure black on white. The letter H designed so its internal white spaces create an optical illusion of a standing person. The two upper windows of the H are slightly different widths than the lower two, creating shoulder and hip proportions. A tiny semicircular notch at the top center suggests a head. So subtle most people see it only after being told. No text, no color."

generate 4 "Minimalist black logo on white background. A heavy bold H where the crossbar connects the two pillars at a slightly higher position, and the crossbar itself has a very gentle concave curve underneath — together creating the faintest impression of a human figure standing between the pillars. The beauty is in what you do NOT draw. No text."

generate 5 "Black and white logo, vector quality. Letter H where the bottom of each vertical stroke curves slightly outward like feet, and between the top of the strokes there is a small circular gap suggesting a head. The crossbar represents arms. Together these micro-details make the H anthropomorphic while remaining a clean letter. Professional, would work embossed on a business card. No text."

generate 6 "Logo concept, solid black on white. An H monogram where the negative space between the strokes is shaped like a keyhole — wider circle on top (head), narrow rectangle below (body/legs). This single clever shape in the white space is the only robot reference. The H itself is bold and geometric. Works at favicon size. No text."

# ═══════════════════════════════════════════════════════════
# CLEVER NEGATIVE SPACE — The aha moment
# ═══════════════════════════════════════════════════════════

generate 7 "Clever logo design like the FedEx hidden arrow. A solid teal (#239eab) letter H where the negative space between the strokes and crossbar creates a subtle standing human figure. The figure emerges from the natural spaces of the H — no extra lines or shapes added. The H reads normally, but once you see the figure you cannot unsee it. Clean, modern, flat. White background. No text."

generate 8 "Ingenious logo mark. A teal H on white where the crossbar is positioned and shaped so the space ABOVE the crossbar between the two verticals forms a head-and-shoulders shape, while the space BELOW forms a legs-apart stance. The figure is created entirely by the proportions of the H, not by any added elements. Like finding a hidden image. No text."

generate 9 "Logo design with hidden meaning. A bold H in dark teal where one small design decision — a circular notch at the top center — transforms the letter into a figure: the notch is the head, the pillars are legs, the top extensions are raised arms. But at first glance it is just a well-designed H with a decorative detail. Smart, minimal, enduring. White background. No text."

generate 10 "Professional logo: The letter H in teal, designed by a world-class logo designer. The proportions are carefully chosen so the H has a humanoid quality — wider at the top, waist at the crossbar, legs below — but achieved purely through stroke width variation, not by adding features. The figure is felt more than seen. Would work on a building sign or an app icon equally. No text."

# ═══════════════════════════════════════════════════════════
# WORKS AT ALL SIZES — From favicon to billboard
# ═══════════════════════════════════════════════════════════

generate 11 "Logo that works at every size from 16x16 favicon to billboard. A simple bold H in teal (#239eab) with a single small circle above it (head) and the bottom of each vertical stroke angled outward slightly (feet). Three shapes total: two rectangles and a circle. Nothing more. This extreme simplicity ensures it scales perfectly. White background. No text."

generate 12 "Scalable logo icon. A rounded H in teal with the crossbar replaced by a small horizontal oval or pill shape positioned at mid-height — reading as both a connector between the pillars AND as an abstracted torso. Above the oval, between the pillars, is a dot. Three elements: two pillars, one oval, one dot. Works at 12px. White background. No text."

generate 13 "Ultra-simple logo mark for a tech brand. A geometric H built from exactly 5 elements: two vertical rectangles (pillars/legs), one horizontal rectangle (crossbar/arms), one small circle above (head), and one dot inside the circle (eye/visor). Teal color. This is the absolute minimum needed to read as both H and humanoid. White background. No text."

# ═══════════════════════════════════════════════════════════
# NOT TOO LITERAL — Abstract and enduring
# ═══════════════════════════════════════════════════════════

generate 14 "Abstract logo mark. Not a literal robot, not a literal H. An abstract geometric shape that suggests BOTH simultaneously through its proportions: symmetrical, vertical, with a top circle element and horizontal extensions. Could be interpreted as a letter, a figure, an icon. Teal color, extremely clean. Like the best marks — it means nothing and everything. White background. No text."

generate 15 "Logo: A vertical symmetrical abstract mark in teal that evokes both the letter H and a humanoid figure through pure geometry. Two parallel vertical bars connected by a bridge, topped with a circle. No face, no details, no literal elements. The mark is ambiguous by design — is it a letter? A figure? A symbol? All three. White background. No text."

generate 16 "Timeless logo mark in teal. An abstract symbol that will look modern in 50 years. Inspired by Paul Rand and Saul Bass — reduced to essential geometry. A form that reads as H-shaped and vaguely anthropomorphic. No trendy effects, no literal interpretation. Just balance, proportion, and a single unforgettable shape. White background. No text."

# ═══════════════════════════════════════════════════════════
# WITH WORDMARK — Full logo lockup
# ═══════════════════════════════════════════════════════════

generate 17 "Complete logo design for 'hellonoid'. A small teal H-humanoid icon mark (letter H with subtle figure in negative space) placed to the left of the word 'hellonoid' set in a clean modern sans-serif typeface in dark gray. Professional horizontal logo lockup. White background. Like a Silicon Valley tech brand."

generate 18 "Logo lockup: The word 'HELLONOID' in clean uppercase geometric sans-serif, where the first letter H has been subtly modified — its proportions tweaked to suggest a humanoid figure (slightly wider top, circular gap above). The modification is so subtle that the H still reads naturally within the word. Teal color for the H, dark gray for the remaining letters. White background."

generate 19 "Stacked logo design: A bold H-humanoid icon mark on top, the word 'hellonoid' in lowercase below in a light modern sans-serif. The icon is simple enough to use alone as a favicon. Teal icon, dark gray text. Centered composition. White background. Professional SaaS brand quality."

generate 20 "Brand identity: The word 'hellonoid' in a custom geometric sans-serif where EVERY H in the word (there is only one, at the start) has a tiny dot above it, like a head. The dot is the same teal color as the text. This single tiny addition is the entire brand concept. Clean, clever, minimal. Dark gray text, teal dot. White background."

echo "=== Done ==="
ls "$OUTDIR"/*.png 2>/dev/null | wc -l
