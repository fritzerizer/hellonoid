# Hellonoid.com — 3D Robot Avatar Pipeline

## Vision
Automatiserat workflow som skapar styliserade 3D-modeller av humanoida robotar baserat på bilder och video. Modellerna visas interaktivt på hellonoid.com — besökare kan rotera och zooma.

---

## Arkitektur (5 steg)

### Steg 1: 📸 Referensinsamling (automatiserat)
**Input:** Robotnamn
**Output:** Kuraterad bildsamling + måttdata

- AI söker webb, YouTube, tillverkarens hemsida efter:
  - Högupplösta bilder (front, sida, bak, detaljer)
  - Videodemos (extrahera nyckelframes)
  - Officiella specifikationer (mått, proportioner)
  - Patent/CAD-ritningar om tillgängliga
- Bilderna kategoriseras automatiskt (vinkel, kvalitet, användbarhet)
- Output: `references/{robot-slug}/` med sorterade bilder + `specs.json` (höjd, bredd, proportioner)

### Steg 2: 🎨 Stiliserad konceptbild (AI-genererad)
**Input:** Referensbilder + stilguide-prompt
**Output:** Konsekvent 2D-konceptbild

- Använd bildgenerings-AI (Gemini, DALL-E, Midjourney) med en **strikt prompt-mall**:
  ```
  Stylized 3D-render-style illustration of [robot name], 
  front view and side view, neutral gray background,
  studio lighting, cel-shaded look, [specific proportions],
  consistent with hellonoid.com style guide...
  ```
- Generera front + side view som ren konceptbild
- Denna bild säkerställer konsekvent stil INNAN 3D-generering
- Manuell QA-check här (snabbt — ser bilden bra ut?)

### Steg 3: 🤖 3D-modellgenerering (AI)
**Input:** Konceptbild(er) + referensbilder
**Output:** 3D-modell (GLB/glTF-format)

#### Bästa verktyg (rankade):

**1. Tripo3D (Rekommenderad)**
- API tillgängligt (REST)
- Image-to-3D, text-to-3D
- Exporterar GLB/OBJ/FBX
- Bra på styliserade karaktärer
- Prissättning: Free tier + pay-per-model
- https://www.tripo3d.ai

**2. Meshy AI**
- API tillgängligt
- Image-to-3D med texturering
- PBR-texturer, retopology inbyggt
- Exporterar GLB/FBX/OBJ/STL
- Prissättning: Freemium, API credits
- https://meshy.ai

**3. Rodin (Hyper3D)**
- Stöder multi-view input (bättre resultat)
- API tillgängligt
- Bra topology
- https://hyper3d.ai/rodin

**4. Kaedim**
- Enterprise-fokus, AI + human-in-the-loop
- Bäst kvalitet men dyrast
- https://kaedim3d.com

#### Workflow:
1. Skicka konceptbild (front+side) till valt API
2. Få tillbaka rå 3D-modell
3. Post-processing (se steg 4)

### Steg 4: ✨ Post-processing & Optimering
**Input:** Rå 3D-modell
**Output:** Webb-optimerad GLB

- **Skalning:** Sätt modellens höjd = robotens verkliga höjd (proportionellt korrekt)
- **Optimering:** Reducera polygon count för webb (target: <100k triangles)
  - Verktyg: `gltf-transform` (CLI, npm-paket)
  - `gltf-transform optimize input.glb output.glb --compress draco`
- **Textur-komprimering:** KTX2/Basis Universal via gltf-transform
- **Konsistens-check:** Verifiera att stilen matchar övriga modeller
- **Metadata:** Bädda in robotnamn, höjd, version i GLB

### Steg 5: 🌐 Webb-visning (Three.js / model-viewer)
**Input:** Optimerad GLB
**Output:** Interaktiv 3D-vy på hellonoid.com

#### Alternativ A: `<model-viewer>` (Rekommenderat)
```html
<model-viewer 
  src="/models/tesla-optimus-gen-2.glb"
  alt="Tesla Optimus Gen 2"
  auto-rotate
  camera-controls
  shadow-intensity="1"
  style="width: 100%; height: 400px;">
</model-viewer>
```
- Google-backed web component
- Minimal kod, fungerar överallt
- AR-stöd på mobil (visa roboten i ditt rum!)
- Automatisk fallback till poster-bild

#### Alternativ B: Three.js + React Three Fiber
```jsx
<Canvas>
  <OrbitControls autoRotate />
  <Environment preset="studio" />
  <RobotModel url="/models/tesla-optimus-gen-2.glb" />
</Canvas>
```
- Mer kontroll över rendering
- Kan implementera storlek-jämförelse (två robotar bredvid varandra)
- Tyngre att implementera

#### Rekommendation: **Starta med `<model-viewer>`**, migrera till Three.js om avancerade features behövs.

---

## Stilguide för 3D-modeller

### Visuell stil
- **Cel-shaded / styliserad** — inte fotorealistisk, inte full cartoon
- **Cleana ytor** med tydliga färgblock
- **Mjuka skuggor**, studioljus-känsla
- **Samma belysning** på alla modeller (environment map)
- Inspiration: videon Fredrik skickade — 3D med tydlig karaktär

### Proportioner
- Alla modeller skalade proportionellt
- Referenshöjd: 180cm = 1.0 enhet i 3D-scenen
- Tesla Optimus (173cm) = 0.961 enheter
- Unitree G1 (127cm) = 0.706 enheter
- Besökare ser direkt storleksskillnaden

### Konsistens
- Samma material-shader på alla (toon/cel-shade)
- Samma bakgrund i viewern (neutral gradient)
- Samma kameravinkel som default (3/4 vy, lätt uppifrån)
- Samma auto-rotate hastighet

---

## Automatisering (Cron Pipeline)

```
Pipeline: Ny robot → 3D-modell

1. [Research agent]     → Samla referensbilder (Steg 1)
2. [Image gen agent]    → Skapa konceptbild (Steg 2)  
3. [3D gen API]         → Generera 3D-modell (Steg 3)
4. [Post-process]       → Optimera för webb (Steg 4)
5. [Fredrik approval]   → Godkänn modellen
6. [Deploy]             → Publicera på sajten (Steg 5)
```

### Daglig underhållspipeline:
```
1. Kolla om nya referensbilder finns för befintliga robotar
2. Om bättre material hittas → flagga för ny modellgenerering
3. Fredrik godkänner → generera uppdaterad modell
```

---

## Tekniska krav

### NPM-paket:
- `@google/model-viewer` — 3D-visning i webbläsare
- `@gltf-transform/core` + `@gltf-transform/extensions` — modell-optimering
- `draco3dgltf` — mesh-komprimering

### API-nycklar (behövs):
- Tripo3D eller Meshy API-nyckel
- Bildgenerings-API (redan har Gemini)

### Lagring:
- GLB-filer i `public/models/` (lokal dev)
- CDN/Vercel blob storage (produktion)
- Typisk GLB-storlek: 2-10 MB (optimerad: 0.5-3 MB)

---

## Kostnadsuppskattning

| Komponent | Kostnad per robot | Not |
|-----------|-------------------|-----|
| Referensinsamling | $0 | Automatiserat med AI |
| Konceptbild | ~$0.01-0.05 | Gemini/DALL-E API |
| 3D-generering | $0.50-2.00 | Tripo/Meshy API |
| Post-processing | $0 | Automatiserat (gltf-transform) |
| **Total per robot** | **~$0.50-2.00** | |

Med 10 robotar: ~$5-20 initialt. Framtida robotar: samma kostnad per ny modell.

---

## Proof of Concept — Nästa steg

1. **Skapa konto på Tripo3D** — testa image-to-3D med en robot (Tesla Optimus)
2. **Generera konceptbild** med Gemini — front+side view, styliserad
3. **Generera 3D-modell** via Tripo API
4. **Optimera** med gltf-transform
5. **Integrera `<model-viewer>`** på hellonoid.com robotsida
6. **Visa för Fredrik** — godkänn stilen
7. **Skala** till alla 10 robotar
