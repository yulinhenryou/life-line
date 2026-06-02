# LIFELINE

LIFELINE is a personal world map for recording the places visited across a lifetime.

The project is being rebuilt around one clear idea: a quiet, precise, extensible flat map. Cities are the primary record; visited countries are highlighted automatically from those city records.

## Current Direction

- Clean flat world map
- City-level visited-place records
- Automatic visited-country highlighting
- Changsha as the origin point
- Minimal UI focused on the map
- Static deployment through GitHub Pages

## Built With

- HTML
- CSS
- JavaScript
- MapLibre GL JS
- Local GeoJSON boundary data

No build step is required.

## Run Locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Main Data

```text
data/places.js
```

Each place stores a city, coordinates, country metadata, and future-ready visit fields.

## Project Structure

```text
data/      place records and GeoJSON boundaries
src/       map initialization, helpers, and app state
styles/    visual system and responsive shell
vendor/    local MapLibre files
index.html app entry point
```

## Future Additions

- Search-based place adding
- Memory and note fields
- Photos or emotional tags
- Mobile-specific layout refinements

## Credits

- Map rendering: [MapLibre GL JS](https://maplibre.org/)
- Boundary and map data: OpenStreetMap contributors and local GeoJSON sources
