#!/bin/bash
set -e

GEMINI_KEY=$(cat ~/.secrets/gemini-api-key)
OUTDIR="/Users/julia/apps/hellonoid/public/logo-gen-v5"
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

# ═══════════════════════════════════════════════════════════
# DIRECTION A: Organic/calligraphic H (like #10)
# Variable stroke width, waist pinch, flowing curves,
# humanoid suggested through proportions not literal features
# ═══════════════════════════════════════════════════════════

generate 1 "Professional logo mark. A stylized letter H made from two organic flowing curves that pinch together at the center like a waist. The strokes are thicker at top and bottom, thinnest at the middle where they almost touch. The top of each stroke flares outward like raised arms or wings. The bottom spreads slightly like feet. Single flat teal color (#2D7A8A). No straight lines anywhere. The shape reads as both H and a standing human figure with arms up. White background. No text. No eyes or face."

generate 2 "Logo design. An organic H monogram where two curved vertical forms narrow dramatically at the center, creating a waist. The gap between them at the waist is extremely small — a thin diamond of white space. Above the waist, the strokes swell wider and curve outward at the top like shoulders and head. Below, they taper down like legs. All edges are smooth bezier curves. Dark teal, flat color. Feels human and dynamic. White background. No text."

generate 3 "Minimalist organic logo. Letter H formed by two mirrored calligraphic strokes. Each stroke is widest at the top (shoulder area) and base (foot area), narrowest at the exact center (waist). The two strokes nearly touch at the waist, leaving only a sliver of white space. The top terminals curve gently outward. The overall silhouette suggests a person with hands on hips or arms slightly raised. Teal (#3B7C84). White background. No text."

generate 4 "Logo mark. A fluid H shape where the two verticals have continuous variable width — like an hourglass doubled. Each stroke has a clear taper from wide at top to narrow at center to wide at bottom. The pinch point creates the H crossbar through proximity, not through an actual horizontal bar. A small circular negative space at the very top center hints at a head between shoulders. Organic, flowing, human. Dark teal. White background. No text."

generate 5 "Abstract logo. Two symmetrical organic shapes that together form the letter H. Each shape flows like a ribbon — wider at extremities, compressed at the middle. Where they pinch together at center, the almost-touching creates the H crossbar effect. The top portions curve outward and upward like antlers, wings, or raised hands. Single teal color. Fluid and elegant, like brushstrokes. White background. No text."

generate 6 "Logo. A stylized H built from two curved forms inspired by the human body. The left form mirrors the right. Each has a head-like rounded top, narrows at a neck, widens at shoulders, narrows again at waist, widens at hips, and narrows at legs/feet. But all of this is extremely abstracted — just subtle width variations in a curved stroke. The H emerges from the two forms being side by side. Teal color, no outlines. White background. No text."

generate 7 "Brand mark. Letter H where the two verticals are shaped like elongated figure-8 or violin forms — wide-narrow-wide from top to bottom. The narrow waist point is where they come closest together, forming the implicit crossbar. No actual crossbar line exists. The shapes are perfectly smooth, organic, and symmetrical. Deep teal. Suggests a human form through pure proportion. White background. No text."

generate 8 "Logo design. An organic H monogram: two flowing vertical shapes that pinch at center. Unlike a standard H, there is no separate crossbar — the crossbar is implied by the pinch point where the two shapes nearly meet. The top of each shape has a gentle outward curve suggesting shoulders. Between the tops, a tiny implied head space. The base of each shape splays slightly outward like feet. Muted teal. Calligraphic quality. White background. No text."

generate 9 "Refined logo. Two organic S-curve strokes positioned side by side to form H. Each stroke starts narrow at bottom (foot), widens (thigh), narrows at center (waist/crossbar zone), widens again (chest/shoulders), then terminates in a rounded point at top. The two strokes create a figure between them through their negative space. Single stroke weight variation, no added details. Dark teal (#2D7A8A). White background. No text."

generate 10 "Logo. An extremely simplified organic H — just two slightly curved vertical strokes with gentle width variation. The variation is subtle: maybe 20% wider at shoulders than at waist. The crossbar is suggested by the closest point between strokes. A tiny circular gap at top center between the stroke terminals. That is all. Maximum restraint, minimum detail. Teal. White background. No text."

# ═══════════════════════════════════════════════════════════
# DIRECTION B: Geometric contained H (like #16)
# Squircle/rounded container, H formed by negative space
# cuts, legs via bottom notch, head via top notch
# ═══════════════════════════════════════════════════════════

generate 11 "Professional logo. A solid teal squircle (rounded square) with the letter H carved out as negative space. The H is formed by two notches: a narrow rectangular notch from the top (creating head/neck space) and a wider U-shaped notch from the bottom (creating legs). The bridge of teal between the notches is the crossbar. Simple, bold, works as an app icon. White background. No text."

generate 12 "Logo mark. A rounded square in teal with an H cut from negative space. The bottom cutout is an arch shape (semicircular top) splitting the base into two legs. The top cutout is a small narrow rectangle suggesting head/shoulders space. The solid remaining shape reads simultaneously as an H and a contained human figure. Chunky, bold proportions. White background. No text."

generate 13 "App icon logo. A teal squircle containing an H made from negative space. The design uses exactly two cuts: a small square notch from the top center, and a tall rounded-top notch from the bottom center. The bottom notch is twice as wide and tall as the top one. This asymmetry between top and bottom notches creates the anthropomorphic quality — small head, big legs. White background. No text."

generate 14 "Logo design. A solid circle in teal with an H formed by negative space cuts. Top: a narrow V or triangular notch. Bottom: a wider U-shaped notch. The remaining solid form reads as a figure inside a circle — head defined by the V, legs defined by the U, arms implied by the circular sides. Compact, iconic, works at tiny sizes. White background. No text."

generate 15 "Logo. A vertical rounded rectangle (pill shape) in dark teal with negative space forming an H. A small circular hole near the top (head). A horizontal slot at mid-height (crossbar/arms). A vertical slot from the bottom up to the horizontal slot (legs). Three simple cuts in a pill shape = H + human. Extremely minimal. White background. No text."

generate 16 "Brand mark. A squircle in teal. The negative space H inside has rounded corners on all cuts, making the interior shapes feel organic even though the container is geometric. The bottom notch (legs) has a perfect semicircular top. The top notch (head) has a perfect semicircular bottom. This creates a figure-eight or hourglass of white space running vertically through the center. White background. No text."

generate 17 "Logo. A heavy rounded square in dark teal. Two cuts of negative space form the H: the bottom cut is a tall keyhole shape (circular top, straight sides) creating two legs and implying a waist. The top cut is just a small semicircular bite from the top edge, suggesting a head sitting between two shoulders. The crossbar is the thick bridge of teal between cuts. White background. No text."

generate 18 "Minimal logo icon. A squircle in teal (#4A9E96). The H is formed by three elements of negative space: two small square notches from the top (creating shoulders with a neck gap between them) and one tall rectangular notch from the bottom (creating legs). The three notches are minimal — small relative to the solid area. The H is heavy and bold, the figure barely suggested. White background. No text."

generate 19 "Logo combining both organic and geometric: A squircle container in teal, but the negative space H inside uses organic curves — the bottom notch has a flowing arch, the top notch has a gentle rounded scoop, the overall white space creates a smooth human silhouette rather than harsh geometric cuts. Soft inside hard. White background. No text."

generate 20 "Logo mark. A solid teal shape that is itself H-shaped but with a squircle-like outer contour — the corners of the H are heavily rounded, making the overall silhouette blob-like and contained while still reading as H. The bottom of the H has the two legs slightly further apart. A tiny circular indentation at the top center (head). The shape works equally well as a positive mark or stamped into material. White background. No text."

echo "=== Done ==="
ls "$OUTDIR"/*.png 2>/dev/null | wc -l
