# LIFELINE

LIFELINE is a personal interactive map that turns meaningful places, visited regions, and life routes into a quiet visual atlas.

It is designed as a symbolic life map, not a travel checklist or navigation tool. The focus is on memory, movement, and place.

## What It Shows

- Places that matter
- Visited countries and regions
- Life movement routes between cities
- Flat and globe map views
- Footprint, lifeline, and journey display modes

## Built With

- HTML
- CSS
- JavaScript
- MapLibre GL JS
- Lightweight local GeoJSON data

No build step is required.

## Run Locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Project Structure

```text
data/      places, journeys, and map boundary data
src/       map logic and interaction code
styles/    visual styling and responsive layout
vendor/    local MapLibre files
index.html app entry point
```

## Editing The Map

Main content lives in:

- `data/places.js`
- `data/journeys.js`

Map configuration lives in:

- `src/config.js`

## Deployment

The project is static and can be deployed directly with GitHub Pages from the repository root.

## Credits

- Map rendering: [MapLibre GL JS](https://maplibre.org/)
- Base map tiles: [CARTO](https://carto.com/) and OpenStreetMap contributors
