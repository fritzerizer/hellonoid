# Hellonoid.com — Content Pipeline

## Översikt
En automatiserad pipeline som kontinuerligt håller hellonoid.com uppdaterad med senaste information, bilder och nyheter om humanoida robotar. Körs dagligen med manuell approval innan publicering.

---

## Pipeline-steg

### Steg 1: 🔍 Research & Insamling
**Frekvens:** Dagligen (cron, morgon)
**Syfte:** Hitta ny information om alla robotar och tillverkare

**Vad som görs:**
- Sök nyheter per robot/tillverkare (senaste 24h)
- Kolla officiella källor (tillverkarnas hemsidor, pressreleaser)
- Sök efter nya specifikationer, priser, leveransdatum
- Hitta nya bilder/videos (referensmaterial för avatarer)
- Bevaka nya robotmodeller som inte finns i databasen
- Sök sociala medier (X/Twitter, YouTube, Reddit) för demos/läckor

**Output:** `research/YYYY-MM-DD.json` — strukturerad data med:
```json
{
  "date": "2026-02-16",
  "robots": {
    "tesla-optimus-gen-2": {
      "news": [...],
      "spec_updates": [...],
      "new_images": [...],
      "source_urls": [...]
    }
  },
  "new_robots_discovered": [...],
  "manufacturer_updates": [...]
}
```

---

### Steg 2: 📊 Analys & Diffing
**Syfte:** Jämför ny info mot befintlig data, prioritera vad som ska uppdateras

**Vad som görs:**
- Jämför nya specs mot `robots.ts` — flagga ändringar
- Kontrollera om leveransdatum/priser ändrats
- Bedöm nyhetsvärde (hög/medel/låg) per nyhet
- Identifiera robotar vars avatarer behöver uppdatering (ny info om utseende)
- Kontrollera om befintliga nyheter blivit inaktuella
- Flagga nya robotar som bör läggas till

**Output:** `research/YYYY-MM-DD-diff.json` — ändringsförslag:
```json
{
  "spec_updates": [
    {"robot": "tesla-optimus-gen-2", "field": "purchase_price_usd", "old": 20000, "new": 25000, "source": "url", "confidence": "high"}
  ],
  "new_news": [
    {"title": "...", "summary": "...", "source": "...", "robot": "...", "priority": "high"}
  ],
  "avatar_updates_needed": ["tesla-optimus-gen-2"],
  "new_robots": [{"name": "...", "manufacturer": "...", "why": "..."}],
  "score": 7  // 0-10, hur mycket nytt som hittats
}
```

---

### Steg 3: ✍️ Innehållsgenerering
**Syfte:** Skapa nytt innehåll baserat på godkänd research

**Vad som görs:**
- Skriv nyhetsartiklar (rubrik + ingress + länk till källa)
- Uppdatera robotspecifikationer i datamodellen
- Generera/uppdatera robotbeskrivningar
- Om ny robot: skapa komplett robotprofil

**Avatar-generering (separat sub-steg):**
- Samla ihop allt referensmaterial (foton, renders, videos)
- Generera front + side view enligt stilguiden (se nedan)
- Skala proportionellt (referenshöjd: 180cm = full canvas)
- Spara som draft i `public/avatars/draft/`

**Nyhetsillustration:**
- Ta nyhetens källbild → generera illustration i hellonoid-stil
- Konsekvent look & feel

**Output:** 
- Uppdaterade datafiler (ej commitade än)
- Draft-avatarer i `public/avatars/draft/`
- Draft-nyheter i `content/news/draft/`

---

### Steg 4: ✅ Approval (Fredrik)
**Syfte:** Manuell granskning innan publicering

**Hur:**
- Magnolia skickar en sammanfattning via iMessage/Discord:
  - "Idag hittade jag 3 nyheter och 2 spec-uppdateringar"
  - Kort lista med vad som ändras
  - Länk till preview (localhost eller staging)
- Fredrik kan:
  - 👍 Godkänn allt
  - ✏️ Ge feedback på specifika delar
  - ❌ Avslå (med anledning)
- Avatar-drafts visas som bilder direkt i chatten

**Alternativt:** Kanban-kort per batch med kommentarer

---

### Steg 5: 🚀 Publicering
**Syfte:** Pusha godkänt innehåll live

**Vad som görs:**
- Uppdatera `robots.ts` / Supabase med godkända ändringar
- Flytta draft-avatarer till `public/avatars/`
- Publicera godkända nyheter
- Git commit + push
- Trigga Vercel deploy (automatiskt via git push)
- Verifiera att sidan laddar korrekt efter deploy

**Output:** Live-uppdatering på hellonoid.com

---

### Steg 6: 📢 Kommunikation
**Syfte:** Sprida nytt innehåll

**Vad som görs:**
- Posta på sociala medier (X/Twitter — framtida)
- Uppdatera RSS/nyhetsfeed
- Logga alla ändringar i `changelog/YYYY-MM-DD.md`
- Skicka kort sammanfattning till Fredrik: "Publicerat: 2 nyheter, uppdaterat specs för Optimus"

---

## Avatar-stilguide

### Koncept
Varje robot avbildas i **front view + side view** (mugshot-stil), proportionellt korrekt relativt andra robotar.

### Stilregler
- **Bakgrund:** Neutral, enhetlig (ljusgrå eller transparent med grid)
- **Höjdreferens:** 180cm = full canvashöjd. En robot på 127cm visas 70% av höjden.
- **Belysning:** Konsekvent studioljus, lätt skugga
- **Stil:** Clean, semi-realistisk illustration (inte fotorealistisk, inte cartoon)
- **Detaljer:** Tillräckligt för att se ledpunkter, sensorer, händer
- **Färg:** Robotens faktiska färgschema (vit, svart, grå etc.)
- **Pose:** Stående, armar lätt vid sidan (front), neutral profil (sida)
- **Skala-markering:** Diskret höjdlinje vid sidan (cm)

### Teknisk spec
- **Format:** PNG, transparent bakgrund
- **Storlek:** 800x1200px per vy (front + side = 1600x1200)
- **Namngivning:** `{robot-slug}-front.png`, `{robot-slug}-side.png`
- **Generering:** Gemini/DALL-E med strikt prompt-template
- **Prompt-mall:** Definieras separat med exakt samma ljussättning, vinkel, bakgrund för alla

---

## Teknisk implementation

### Cron-jobb
```
07:00  Steg 1+2 (Research + Analys) → automatiskt
       Om score >= 3 → skicka sammanfattning till Fredrik
       Om score < 3 → logga och vänta till nästa dag
```

### Script-struktur
```
apps/hellonoid/pipeline/
├── research.js       # Steg 1: Sök och samla info
├── analyze.js        # Steg 2: Diffing mot befintlig data
├── generate.js       # Steg 3: Skapa innehåll
├── publish.js        # Steg 5: Publicera
├── prompts/
│   ├── avatar.txt    # Avatar-genereringsprompt
│   ├── news.txt      # Nyhetsskrivarformat
│   └── research.txt  # Sökinstruktioner
├── research/         # Dagliga research-resultat
└── changelog/        # Publiceringslogg
```

### Dataflöde
```
[Webb/API:er] → research.js → research/YYYY-MM-DD.json
                                    ↓
                              analyze.js → diff.json
                                    ↓
                              generate.js → drafts/
                                    ↓
                              [Fredrik approval]
                                    ↓
                              publish.js → git push → Vercel
                                    ↓
                              changelog + notification
```

---

## Prioriteringsordning

1. **Fas A (nu):** Manuell pipeline — Magnolia kör research + generering, Fredrik godkänner
2. **Fas B (efter launch):** Semi-automatisk — cron kör research+analys, Magnolia genererar, Fredrik godkänner
3. **Fas C (skalning):** Helautomatisk research+generering, Fredrik godkänner bara highlight-ändringar
