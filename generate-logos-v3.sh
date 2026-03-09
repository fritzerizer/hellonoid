#!/bin/bash
set -e

GEMINI_KEY=$(cat ~/.secrets/gemini-api-key)
OUTDIR="/Users/julia/apps/hellonoid/public/logo-gen-v3"
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
        if 'error' in resp:
            print(f'  Error: {resp[\"error\"].get(\"message\",\"\")}')
except Exception as e:
    print(f'  ERROR: {e}')
"
  sleep 2
}

# ═══════════════════════════════════════════════════════════
# SUBTIL INTEGRATION — roboten ska knappt synas, mer en antydan
# ═══════════════════════════════════════════════════════════

generate 1 "Professional minimalist logo: A clean bold letter H in teal (#239eab). The ONLY subtle hint of a humanoid is that the negative space in the center of the H (between the two vertical strokes and the crossbar) very subtly suggests a standing human figure shape — just through the proportions of the white space, not through any added details. No eyes, no arms, no obvious robot. The H itself looks like a normal H at first glance. Flat solid color on white background. No text. Vector logo style."

generate 2 "Minimalist logo design: A geometric letter H in solid teal color. The crossbar of the H is positioned slightly higher than center, and the negative space below the crossbar subtly resembles the silhouette of legs, while the space above hints at shoulders and a head — but only if you look carefully. At first glance it is simply a well-proportioned H. Clean, modern, no extra details. White background. No text."

generate 3 "Logo mark: A solid letter H in dark teal. The only robot reference is extremely subtle — the top edges of the H vertical strokes have a very slight rounded indent that barely suggests shoulders, and the tiny gap at the very top center hints at a head shape. 99% of people would just see an H. Understated, sophisticated. White background. No text."

generate 4 "Clean logo: Letter H in teal (#239eab). The proportions of the H are carefully designed so the negative space between the strokes naturally reads as a humanoid figure standing with legs apart — but achieved purely through the width and positioning of the H strokes, not by adding any robot features. Like a hidden figure in the whitespace. Geometric, minimal. White background. No text."

generate 5 "Elegant monogram logo: Letter H where the crossbar has a very subtle slight upward curve in the center, barely noticeable, that hints at shoulders/torso. The overall shape is still unmistakably a clean H. No eyes, no limbs, no obvious robot elements. The humanoid suggestion is subliminal. Teal color, thick strokes. White background. No text."

generate 6 "Modern tech logo: A bold H lettermark in teal. The vertical strokes of the H taper very slightly inward at the bottom, and the space between them subtly suggests legs. The top of the H has the faintest suggestion of a rounded head shape formed by a tiny semicircular notch. But overall it reads as a stylish H. Minimal, clean. White background. No text."

generate 7 "Logo design: Solid geometric H in single color teal. Hidden within the H design: the crossbar is slightly thinner and positioned to suggest a waist, the spaces above the crossbar on each side suggest arm positions, and a very small circular indent at the top center suggests a head. But these are so subtle that the logo primarily reads as a bold modern H. No text. White background."

generate 8 "Sophisticated logo: Letter H in navy blue (#1B3160). The H has slightly rounded inner corners at the crossbar junction, making the negative space gently suggest a humanoid torso and limbs — but only as an afterthought. The primary read is a premium, architectural H. Think luxury brand subtlety. White background. No text."

generate 9 "Tech startup logo: A clean H in teal where the negative space between the two vertical bars, above and below the crossbar, is shaped to very faintly echo a human figure — wider at the top (head/shoulders area), narrower at crossbar (waist), and wider again below (legs). But the H strokes themselves are straight and geometric. The figure is hidden in the proportions, not drawn. White background. No text."

generate 10 "Minimalist logo: A thick bold H in teal (#239eab). At the very top center, between the two vertical strokes, there is an extremely subtle small gap or rounded negative space that could be interpreted as a tiny head — but it could also just be a design detail. That is the ONLY robot reference. Everything else is a completely normal, clean, bold H. White background. No text."

generate 11 "Logo concept: A modern H letterform in teal where the two vertical strokes are slightly shaped like legs at the bottom (subtle taper or slight curve at the feet) and the crossbar connects them like a belt or waist. Above the crossbar, the strokes continue upward like a torso and the gap between them at the top faintly suggests a neck and head. But it still looks like a stylish H. Extremely subtle. White background. No text."

generate 12 "Abstract logo: The letter H in solid teal, designed with rounded corners. A single tiny circle sits perfectly centered just above the top edge of the H, barely touching it — suggesting a head on shoulders. That small circle is the only addition to an otherwise normal H. Clean, minimal, clever. White background. No text."

generate 13 "Brand mark: Bold condensed H in teal. The inner negative space of the H is shaped as a subtle keyhole or figure-eight, which subliminally reads as head-and-body. But the outer shape is a perfectly normal H. No limbs, no face, no obvious robot. Just clever negative space proportions. White background. No text."

generate 14 "Logo: A thick rounded H in teal (#239eab). The letter has a small semicircle cut from the top center edge — like a tiny bite — just enough to hint at a head sitting between two shoulders. Below the crossbar, the two legs of the H have a very slight outward curve at the bottom suggesting feet. Incredibly subtle. Still reads 100% as the letter H. White background. No text."

generate 15 "Professional logo mark: Letter H in dark teal on white. The H uses slightly variable stroke widths — the verticals are marginally wider at the top (shoulders) and narrow slightly toward the bottom (legs). The crossbar is positioned at hip height. These proportional choices make the H subconsciously feel anthropomorphic without any added details. Clean, corporate-quality design. No text."

generate 16 "Logo: A geometric sans-serif H in teal where the two vertical strokes each have a very subtle angular notch near the top on their inner edges — barely visible — that together frame a tiny implied head shape in the negative space. The rest is a completely standard H. Like finding a hidden image. White background. No text."

generate 17 "Minimalist H logo in teal (#239eab). The crossbar of the H is split into two thin horizontal lines with a small gap between them, suggesting a waist/belt area. Above: the wider space implies chest and shoulders. Below: two separated columns imply legs. All achieved through a simple two-line crossbar modification. Subtle, elegant. White background. No text."

generate 18 "Logo design: A bold H in teal. Instead of a straight crossbar, it has a very gentle shallow arch (convex upward) — barely noticeable — that subliminally suggests shoulders or the curve of a torso. The vertical strokes are perfectly straight. This tiny arch is the only deviation from a standard H. Refined, minimal. White background. No text."

generate 19 "Logo concept: Letter H in solid teal with a circular dot centered directly above the H (with a small gap). The dot represents a head, the H represents the body — but together they simply look like a clean H with a design accent dot above it. Like an i-dot or design element. Not obviously a robot. White background. No text."

generate 20 "Extremely subtle logo: A perfectly standard bold geometric H in teal (#239eab). The ONLY difference from a normal H is that the negative space windows (the four rectangles of white space) have slightly different proportions — the top two are slightly wider (suggesting shoulders) and the bottom two are slightly taller (suggesting legs). You would need to measure to notice. This is peak subtlety. White background. No text."

echo "=== Done! ==="
ls -la "$OUTDIR"/*.png 2>/dev/null | wc -l
