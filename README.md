# LIFELINE

LIFELINE is a minimal personal interactive map artwork. It records places, visited regions, and life movement routes without becoming a travel checklist, dashboard, or navigation map.

The site is static HTML/CSS/JavaScript and is suitable for GitHub Pages.

## Design Principles

LIFELINE is a symbolic personal atlas, not a GIS product. When design choices conflict, prioritize:

1. Visual beauty
2. Smooth interaction
3. Clear storytelling
4. Approximate geographic structure
5. Exact geographic precision

The map should preserve the broad relationship between countries, places, and movement routes, but it can simplify coastlines, country outlines, administrative regions, and route curves when that improves the artwork. The goal is a beautiful symbolic map of where life has taken you, not a precise geographic information system.

## Run Locally

```bash
cd /Users/kylinou/Desktop/life-map
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

If the port is busy:

```bash
python3 -m http.server 8771
```

## Data Files

```text
data/
  places.js
  journeys.js
  geo/
    world-countries.geojson
    countries.geojson
    admin-regions.geojson
```

Initial map data only includes:

- Changsha / 长沙
- Sydney
- Two journeys: Changsha → Sydney and Sydney → Changsha

## Add A Place

Edit `data/places.js` and copy an existing place object:

```js
{
  id: "singapore",
  name: "Singapore",
  nameZh: "新加坡",
  country: "Singapore",
  countryZh: "新加坡",
  countryId: "SG",
  adminRegion: "Singapore",
  adminRegionZh: "新加坡",
  regionId: "SG",
  lat: 1.3521,
  lng: 103.8198,
  labelPriority: "high",
  visible: true,
  visits: []
}
```

Another future example:

```js
{
  id: "los-angeles",
  name: "Los Angeles",
  nameZh: "洛杉矶",
  country: "United States",
  countryZh: "美国",
  countryId: "US",
  adminRegion: "California",
  adminRegionZh: "加利福尼亚州",
  regionId: "US-CA",
  lat: 34.0522,
  lng: -118.2437,
  labelPriority: "normal",
  visible: true,
  visits: []
}
```

`countryId` is the ISO-style country code used to match `countries.geojson`.

`regionId` matches a first-level administrative polygon in `admin-regions.geojson`. If a region polygon is missing, the city point still works and the country still highlights, but no fake circular region is drawn.

`labelPriority` controls city label visibility:

- `high`: label can show at world scale.
- `normal`: label appears when zoomed in or focused.
- `hidden`: point can exist quietly; label appears only on focus/hover in future refinements.

Chinese places render Chinese labels when `countryId === "CN"`. Other countries render English labels.

## Add A Journey

Edit `data/journeys.js`:

```js
{
  id: "changsha-to-singapore-2019",
  from: "changsha",
  to: "singapore",
  year: "2019",
  label: "UWC experience",
  visible: true
}
```

```js
{
  id: "singapore-to-los-angeles-2024",
  from: "singapore",
  to: "los-angeles",
  year: "2024",
  label: "US summer trip",
  visible: true
}
```

## Add A Visit

Each place has a `visits: []` array. The city card’s `+` button generates a template like:

```js
{
  id: "sydney-2026-01-university-semester",
  start: "2026-01",
  end: "2026-06",
  label: "University semester",
  note: "First semester at USyd."
}
```

Copy it into the related place’s `visits` array.

## Routes Modes

- `Footprint`: visited countries/regions only. No city dots, labels, or routes.
- `Line`: one clean main lifeline between connected places.
- `Journeys`: every real journey record is drawn; hover shows year, from → to, and label.

## GeoJSON

`world-countries.geojson` provides the warm atlas-style land layer and subtle country outlines. It is intentionally lightweight and simplified.

`countries.geojson` is intentionally visited-only in V1. It currently contains lightweight country boundaries for China and Australia. The boundaries are used for storytelling and visited-area highlighting, not GIS-grade precision.

`admin-regions.geojson` is also intentionally small. It currently contains first-level administrative boundaries for Hunan Province and New South Wales. Region focus should be understood as a selected-territory hint: geographically plausible, visually clean, and not a street-level or GIS-precision layer.

To add a highlighted country or region, add a lightweight GeoJSON `Feature` with a matching `properties.id`. If a `regionId` has no matching polygon, LIFELINE keeps the city point and country highlight but does not draw a fake circular region.

## Map Style

The current MapLibre style is defined in `src/config.js`.

V1 uses no-key CartoDB Positron No Labels raster tiles:

```text
https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png
```

To use MapTiler, Mapbox, or a custom vector style later, replace `LifelineConfig.mapStyle` with the new MapLibre style JSON. The rest of the app can keep the same places, journeys, and GeoJSON data.

## Deploy To GitHub Pages

1. Push this project to a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select `main` and `/root`.
5. Save.

After editing data:

```bash
git add data/ README.md
git commit -m "Update LIFELINE map data"
git push
```
