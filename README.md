# Tafels met Sumi 🐾

Een offline-first, installeerbare tafels-oefen-app voor kinderen (7 jaar), met een aparte oudermodus. Gebouwd als PWA met vanilla HTML/CSS/JS — geen build-stap, geen backend nodig.

## Bestandsstructuur

```
tafels-met-sumi/
  index.html
  manifest.webmanifest
  sw.js
  css/
    tokens.css        (kleuren, spacing, typografie)
    layout.css         (grid/schermen/safe-area)
    components.css      (knoppen, kaarten, modal, toast)
    screens.css          (wereld-achtergronden, kamer, avontuurpad)
  js/
    storage.js          (enige plek die localStorage aanraakt, versiebeheer + migratie)
    learning-engine.js  (adaptieve vraagselectie + afleiders)
    sumi.js             (SVG-tekening van Sumi + accessoires, één bron van waarheid)
    audio.js            (WebAudio geluidseffecten + Nederlandse spraak)
    app.js              (schermen, sessieflow, winkel/kamer, oudergedeelte)
  assets/icons/          (PWA-iconen)
  README.md
```

## Lokaal testen

Open `index.html` rechtstreeks in een browser, of start een lokale server (aanbevolen, zodat de service worker werkt):

```
cd tafels-met-sumi
python3 -m http.server 8080
```

Ga naar `http://localhost:8080`.

## Deployen op GitHub Pages

1. Maak een repository, bv. `tafels-met-sumi`.
2. Upload alle bestanden uit deze map naar de root van de repository (behoud de mapstructuur).
3. Ga naar **Settings → Pages**, kies de `main`-branch en map `/ (root)`.
4. Wacht tot de site live is op `https://<gebruikersnaam>.github.io/tafels-met-sumi/`.
5. Open die URL op een iPad in Safari → **Deel** → **Zet op beginscherm**.

Alle paden in de app zijn relatief (`./...`), dus dit werkt ook onder een sub-pad.

Bij een nieuwe release: verhoog `CACHE_NAME` in `sw.js` (bv. `v2`) zodat oude caches automatisch verwijderd worden en het iPad niet op een oude versie blijft hangen.

## Architectuur, kort

- **Eén databron**: `storage.js` beheert alle 100 individuele tafelsommen (1×1 t/m 10×10) apart — 3×4 en 4×3 zijn bewust aparte items, met eigen status (`locked`/`learning`/`known`) en statistieken.
- **Adaptieve motor**: `learning-engine.js` kiest ~70% van de vragen uit "nu leren", ~30% uit "gekend", nooit uit "nog niet gezien". Fout beantwoorde sommen komen later in de sessie terug (spaced retry) in plaats van meteen opnieuw.
- **Sumi is nooit een achtergrondplaatje**: alle knoppen, tellers en menu's zijn echte HTML/CSS-componenten. Sumi zelf is een herbruikbare SVG-tekenfunctie (`sumi.js`) die dezelfde hond tekent in tien stemmingen, met accessoires als losse lagen erbovenop — kopen/aandoen van een item verandert dus echt hoe Sumi eruitziet.
- **Oudergedeelte** zit achter een rekenvraag, ziet er bewust rustiger/informatiever uit dan de kindschermen, en laat alle 100 sommen individueel beheren plus een "deze week"-snelkeuze.

## Testchecklist

- [ ] Home: alle knoppen werken, geen dubbele nep-afbeelding, Sumi op juiste grootte
- [ ] Spelen: alleen ingeschakelde sommen komen voor, fout beantwoorde sommen komen later terug, score en pootjes kloppen
- [ ] Ouders: rekenvraag-poortje werkt, alle 100 sommen apart instelbaar, 3×4 ≠ 4×3, weekselectie blijft bewaard
- [ ] Kamer/Winkel: aankopen trekken het juiste aantal pootjes af, kopen zonder genoeg pootjes lukt niet, aankopen en uitrusting blijven bewaard, uiterlijk van Sumi/kamer verandert echt
- [ ] Audio: geluid-toggle en spraak-toggle werken, geen fouten bij eerste tik (audio start pas na gebruikersinteractie)
- [ ] PWA: manifest laadt, service worker registreert, offline herladen werkt, oude caches worden opgeruimd
- [ ] Responsief: geen horizontaal scrollen op iPad-liggend, iPad-staand, telefoon

## Bekende beperkingen

- **Sumi-artwork is SVG, geen illustratie/render.** Er was geen manier om consistente raster-illustraties (het gevraagde "premium 3D/cartoon"-niveau) te genereren binnen deze omgeving; in plaats daarvan tekent `sumi.js` een consistente, herkenbare Samoyed-vormtaal in vector, met dezelfde structuur voor elke stemming en accessoire. Dit is de duidelijkste kloof met de opdracht. Vervang de SVG-lagen door illustraties (dezelfde laagstructuur: achtergrond → bed → basis-pose → hals → hoofd → rug) zodra er artwork beschikbaar is, zonder de rest van de app te hoeven aanpassen.
- **Achtergrondmuziek-toggle bestaat, maar er is geen muziekbestand** (geen externe assets meegeleverd); de toggle bewaart de voorkeur alvast voor wanneer je een track toevoegt.
- **Nederlandse spraak (`speechSynthesis`) hangt af van de stemmen die het besturingssysteem/de browser aanbiedt** — op sommige apparaten klinkt dit robotachtig of ontbreekt een nl-stem volledig; er is geen fallback-audiobestand.
- **Avontuur-ontgrendeling is gebaseerd op totaal verdiende pootjes** (eenvoudige, voorspelbare mijlpalen) in plaats van een aparte voortgangscurve per hoofdstuk.
- Eén los HTML/CSS/JS-project zonder build-tool: prima voor dit formaat, maar er is geen minificatie/bundeling voor productie.

Verder is elk onderdeel uit de opdracht functioneel gebouwd: 100 losse sommen, adaptieve sessies, oudergedeelte met poortje/weekselectie/matrix/voortgang/instellingen, pootjes-economie, winkel met echte visuele aanpassing van Sumi en de kamer, avontuurpad, en een offline-installeerbare PWA met versiebeheerde cache.
