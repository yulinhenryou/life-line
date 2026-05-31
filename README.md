# LIFELINE

LIFELINE is a minimal interactive personal map. It visualizes meaningful places, visited regions, and life movement routes as a symbolic atlas rather than a travel checklist or navigation tool.

The project is built with static HTML, CSS, JavaScript, and MapLibre GL JS. It can be hosted directly on GitHub Pages.

## Features

- Interactive world map with flat and globe projection modes
- Visited country and region highlighting
- City markers with place details and visit records
- Route modes for footprint, main lifeline, and individual journeys
- Lightweight local data files for places, journeys, and GeoJSON boundaries
- No build step or framework required

## Project Structure

```text
life-line/
  index.html
  README.md
  data/
    places.js
    journeys.js
    geo/
      world-countries.geojson
      countries.geojson
      admin-regions.geojson
  src/
    config.js
    helpers.js
    main.js
    map.js
    panels.js
    routes.js
  styles/
    base.css
    layout.css
    map.css
    components.css
    responsive.css
  vendor/
    maplibre/
      maplibre-gl.css
      maplibre-gl.js
```

## Run Locally

```bash
cd /Users/kylinou/Desktop/life-line
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

If port `8000` is already in use:

```bash
python3 -m http.server 8771
```

## Data

The map content is controlled by two main data files:

- `data/places.js`: places, coordinates, country and region IDs, labels, and visit records
- `data/journeys.js`: routes between places, years, labels, and visibility

GeoJSON files live in `data/geo/`:

- `world-countries.geojson`: simplified world land layer
- `countries.geojson`: highlighted country boundaries
- `admin-regions.geojson`: highlighted first-level administrative regions

The map uses matching IDs to connect places with geographic shapes:

- `countryId` should match a feature ID in `countries.geojson`
- `regionId` should match a feature ID in `admin-regions.geojson`

If a region polygon is missing, the city marker and country highlight still work.

## Add A Place

Edit `data/places.js` and add a place object:

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

`labelPriority` controls how early a city label appears:

- `high`: visible at world scale
- `normal`: visible when zoomed in or focused
- `hidden`: kept quiet unless focused in future refinements

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

The `from` and `to` values should match place IDs from `data/places.js`.

## Add A Visit

Each place supports a `visits` array:

```js
{
  id: "sydney-2026-01-university-semester",
  start: "2026-01",
  end: "2026-06",
  label: "University semester",
  note: "First semester at USyd."
}
```

## Map Style

The MapLibre style is defined in `src/config.js`.

The current version uses CartoDB Positron No Labels raster tiles:

```text
https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png
```

To switch providers later, replace `LifelineConfig.mapStyle` with another MapLibre-compatible style JSON.

## GitHub Pages

This project can be deployed from the repository root:

1. Open the GitHub repository settings.
2. Go to **Pages**.
3. Choose **Deploy from a branch**.
4. Select the `main` branch and `/root`.
5. Save.

After GitHub Pages is enabled, future pushes to `main` will update the live site automatically.

## Development Workflow

```bash
git add .
git commit -m "Describe the update"
git push
```

For this local copy, updates should be committed and pushed after each optimization pass so GitHub stays in sync.

## Credits

- Map rendering: [MapLibre GL JS](https://maplibre.org/)
- Base map tiles: [CARTO](https://carto.com/) and OpenStreetMap contributors
