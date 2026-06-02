(function () {
  const SOURCE_IDS = {
    world: "world-countries",
    visited: "visited-countries",
    places: "places"
  };

  async function init() {
    const state = window.LifelineState;
    const config = window.LifelineConfig;

    state.worldCountries = await fetchJson("data/geo/world-countries.geojson");
    state.visitedCountries = await fetchJson("data/geo/countries.geojson");

    state.map = new maplibregl.Map({
      container: "map",
      style: config.mapStyle,
      center: config.introView.center,
      zoom: config.introView.zoom,
      pitch: 0,
      bearing: 0,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      maxBounds: config.bounds,
      attributionControl: false,
      renderWorldCopies: false,
      fadeDuration: 0
    });

    state.map.dragRotate.disable();
    state.map.touchZoomRotate.disableRotation();
    state.map.keyboard.disableRotation();

    state.map.on("error", (event) => {
      console.warn("LIFELINE map warning", event && event.error ? event.error : event);
    });

    await onceMapEvent(state.map, "load");
    addSources();
    addLayers();
    bindMapEvents();
    positionOriginPulse();
    runIntro();
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  function addSources() {
    const map = window.LifelineState.map;
    map.addSource(SOURCE_IDS.world, {
      type: "geojson",
      data: simplifyCollection(window.LifelineState.worldCountries, 0.06)
    });
    map.addSource(SOURCE_IDS.visited, {
      type: "geojson",
      data: visitedCountriesCollection()
    });
    map.addSource(SOURCE_IDS.places, {
      type: "geojson",
      data: placesCollection()
    });
  }

  function addLayers() {
    const map = window.LifelineState.map;
    const colors = window.LifelineConfig.colors;

    map.addLayer({
      id: "land-fill",
      type: "fill",
      source: SOURCE_IDS.world,
      paint: {
        "fill-color": colors.land,
        "fill-opacity": 0.88
      }
    });

    map.addLayer({
      id: "land-outline",
      type: "line",
      source: SOURCE_IDS.world,
      paint: {
        "line-color": colors.landLine,
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.42, 4, 0.72],
        "line-opacity": 0.86
      }
    });

    map.addLayer({
      id: "visited-fill",
      type: "fill",
      source: SOURCE_IDS.visited,
      paint: {
        "fill-color": colors.visitedFill,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.52, 4, 0.34]
      }
    });

    map.addLayer({
      id: "visited-outline",
      type: "line",
      source: SOURCE_IDS.visited,
      paint: {
        "line-color": colors.visitedLine,
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.85, 4, 1.2],
        "line-opacity": 0.82
      }
    });

    map.addLayer({
      id: "place-halo",
      type: "circle",
      source: SOURCE_IDS.places,
      paint: {
        "circle-radius": placeHaloRadius(),
        "circle-color": ["case", ["get", "origin"], "rgba(17, 24, 39, 0.16)", "rgba(27, 120, 154, 0.14)"],
        "circle-opacity": introOpacity(),
        "circle-blur": 0.55
      }
    });

    map.addLayer({
      id: "place-dot",
      type: "circle",
      source: SOURCE_IDS.places,
      paint: {
        "circle-radius": placeDotRadius(),
        "circle-color": ["case", ["get", "origin"], colors.origin, colors.pointVisited],
        "circle-stroke-color": colors.point,
        "circle-stroke-width": ["case", ["get", "origin"], 2.1, 1.65],
        "circle-opacity": introOpacity(),
        "circle-stroke-opacity": introOpacity()
      }
    });

    map.addLayer({
      id: "place-label",
      type: "symbol",
      source: SOURCE_IDS.places,
      minzoom: 2.3,
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 2.3, 11, 5, 13],
        "text-offset": [1.05, 0],
        "text-anchor": "left",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": "rgba(23, 35, 48, 0.82)",
        "text-halo-color": "rgba(248, 250, 252, 0.86)",
        "text-halo-width": 1.15,
        "text-opacity": ["*", introOpacity(), ["case", ["get", "origin"], 1, ["interpolate", ["linear"], ["zoom"], 2.3, 0.35, 4.6, 0.88]]]
      }
    });

    map.addLayer({
      id: "place-hit",
      type: "circle",
      source: SOURCE_IDS.places,
      paint: {
        "circle-radius": 18,
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-opacity": 0
      }
    });
  }

  function bindMapEvents() {
    const map = window.LifelineState.map;
    map.on("mousemove", "place-hit", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      setHoverPlace(feature.properties.id);
    });
    map.on("mouseleave", "place-hit", () => {
      setHoverPlace("");
    });
    map.on("click", "place-hit", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      showPlace(feature.properties.id);
    });
    map.on("click", (event) => {
      const hits = map.queryRenderedFeatures(event.point, { layers: ["place-hit"] });
      if (!hits.length) hidePlaceCard();
    });
    map.on("move", positionOriginPulse);
    map.on("zoom", positionOriginPulse);
  }

  function runIntro() {
    const state = window.LifelineState;
    const shell = document.querySelector("#app-shell");
    const status = document.querySelector("#map-status");

    shell.classList.add("is-intro", "origin-visible");
    setIntroProgress(0);
    updateLayerOpacity();

    window.setTimeout(() => {
      shell.classList.add("map-visible");
      setIntroProgress(0.34);
      updateLayerOpacity();
      if (status) status.classList.add("is-hidden");
    }, prefersReducedMotion() ? 40 : 520);

    window.setTimeout(() => {
      state.map.easeTo({
        ...window.LifelineConfig.worldView,
        duration: motionDuration(1700),
        easing: (t) => 1 - Math.pow(1 - t, 3),
        essential: true
      });
    }, prefersReducedMotion() ? 60 : 980);

    window.setTimeout(() => {
      setIntroProgress(1);
      updateLayerOpacity();
      shell.classList.add("places-visible");
    }, prefersReducedMotion() ? 80 : 1700);

    window.setTimeout(() => {
      state.introDone = true;
      shell.classList.remove("is-intro");
      positionOriginPulse();
    }, prefersReducedMotion() ? 120 : 2950);
  }

  function resetView() {
    hidePlaceCard();
    window.LifelineState.map.easeTo({
      ...window.LifelineConfig.worldView,
      duration: motionDuration(820),
      essential: true
    });
  }

  function showPlace(placeId) {
    const state = window.LifelineState;
    const place = window.LifelineHelpers.getPlaceById(placeId);
    if (!place) return;

    state.activePlaceId = place.id;
    setHoverPlace("");
    updatePlacePaint();

    state.map.easeTo({
      center: [place.lng, place.lat],
      zoom: Math.max(state.map.getZoom(), 3.15),
      duration: motionDuration(620),
      essential: true
    });

    renderPlaceCard(place);
  }

  function hidePlaceCard() {
    const state = window.LifelineState;
    state.activePlaceId = "";
    updatePlacePaint();
    const card = document.querySelector("#place-card");
    if (card) card.hidden = true;
  }

  function renderPlaceCard(place) {
    const card = document.querySelector("#place-card");
    if (!card) return;
    card.hidden = false;
    card.innerHTML = `
      <p class="card-kicker">${escapeHtml(place.country || "")}</p>
      <h2>${escapeHtml(window.LifelineHelpers.getPlaceLabel(place))}</h2>
      <dl>
        <div>
          <dt>Region</dt>
          <dd>${escapeHtml(place.adminRegion || place.country || "Unknown")}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>${escapeHtml(window.LifelineHelpers.firstVisitLabel(place))}</dd>
        </div>
      </dl>
    `;
  }

  function setHoverPlace(placeId) {
    const state = window.LifelineState;
    if (state.hoverPlaceId === placeId) return;
    state.hoverPlaceId = placeId || "";
    state.map.getCanvas().style.cursor = state.hoverPlaceId ? "pointer" : "";
    updatePlacePaint();
  }

  function updatePlacePaint() {
    const map = window.LifelineState.map;
    if (!map || !map.getLayer("place-dot")) return;
    map.setPaintProperty("place-dot", "circle-radius", placeDotRadius());
    map.setPaintProperty("place-halo", "circle-radius", placeHaloRadius());
  }

  function updateLayerOpacity() {
    const map = window.LifelineState.map;
    if (!map || !map.getLayer("place-dot")) return;
    map.setPaintProperty("place-dot", "circle-opacity", introOpacity());
    map.setPaintProperty("place-dot", "circle-stroke-opacity", introOpacity());
    map.setPaintProperty("place-halo", "circle-opacity", introOpacity());
    map.setPaintProperty("place-label", "text-opacity", ["*", introOpacity(), ["case", ["get", "origin"], 1, ["interpolate", ["linear"], ["zoom"], 2.3, 0.35, 4.6, 0.88]]]);
  }

  function introOpacity() {
    const progress = window.LifelineState.introProgress || 0;
    return ["case", ["get", "origin"], Math.max(0.25, progress), progress];
  }

  function setIntroProgress(value) {
    window.LifelineState.introProgress = Math.max(0, Math.min(1, value));
  }

  function placeDotRadius() {
    const state = window.LifelineState;
    return [
      "case",
      ["==", ["get", "id"], ["literal", state.activePlaceId || ""]], 7.6,
      ["==", ["get", "id"], ["literal", state.hoverPlaceId || ""]], 6.8,
      ["get", "origin"], 6.2,
      4.9
    ];
  }

  function placeHaloRadius() {
    const state = window.LifelineState;
    return [
      "case",
      ["==", ["get", "id"], ["literal", state.activePlaceId || ""]], 23,
      ["==", ["get", "id"], ["literal", state.hoverPlaceId || ""]], 19,
      ["get", "origin"], 18,
      13
    ];
  }

  function placesCollection() {
    const originId = window.LifelineConfig.originPlaceId;
    return {
      type: "FeatureCollection",
      features: window.LifelineHelpers.visiblePlaces().map((place, index) => ({
        type: "Feature",
        id: place.id,
        properties: {
          id: place.id,
          label: window.LifelineHelpers.getPlaceLabel(place),
          countryId: place.countryId,
          origin: place.id === originId,
          order: index
        },
        geometry: {
          type: "Point",
          coordinates: [place.lng, place.lat]
        }
      }))
    };
  }

  function visitedCountriesCollection() {
    const ids = window.LifelineHelpers.visitedCountryIds();
    return {
      type: "FeatureCollection",
      features: (window.LifelineState.visitedCountries.features || []).filter((feature) => ids.has(feature.properties.id))
    };
  }

  function simplifyCollection(collection, tolerance) {
    return {
      ...collection,
      features: (collection.features || []).map((feature) => simplifyFeature(feature, tolerance))
    };
  }

  function simplifyFeature(feature, tolerance) {
    if (!feature || !feature.geometry) return feature;
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: simplifyCoordinates(feature.geometry.coordinates, feature.geometry.type, tolerance)
      }
    };
  }

  function simplifyCoordinates(coordinates, type, tolerance) {
    if (type === "Polygon") return coordinates.map((ring) => simplifyRing(ring, tolerance));
    if (type === "MultiPolygon") return coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)));
    return coordinates;
  }

  function simplifyRing(ring, tolerance) {
    if (!Array.isArray(ring) || ring.length <= 10) return ring;
    const closed = sameCoord(ring[0], ring[ring.length - 1]);
    const body = closed ? ring.slice(0, -1) : ring;
    const simplified = rdp(body, tolerance);
    if (closed && simplified.length) simplified.push(simplified[0]);
    return simplified.length >= 4 ? simplified : ring;
  }

  function rdp(points, tolerance) {
    if (points.length <= 2) return points;
    let index = 0;
    let maxDistance = 0;
    const end = points.length - 1;
    for (let i = 1; i < end; i += 1) {
      const distance = perpendicularDistance(points[i], points[0], points[end]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    if (maxDistance <= tolerance) return [points[0], points[end]];
    return [...rdp(points.slice(0, index + 1), tolerance).slice(0, -1), ...rdp(points.slice(index), tolerance)];
  }

  function perpendicularDistance(point, start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
    return Math.abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0]) / Math.hypot(dx, dy);
  }

  function sameCoord(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  }

  function positionOriginPulse() {
    const pulse = document.querySelector("#origin-pulse");
    const map = window.LifelineState.map;
    if (!pulse || !map) return;
    const origin = window.LifelineHelpers.getPlaceById(window.LifelineConfig.originPlaceId);
    if (!origin) return;
    const point = map.project([origin.lng, origin.lat]);
    pulse.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
  }

  function onceMapEvent(map, eventName) {
    return new Promise((resolve) => map.once(eventName, resolve));
  }

  function motionDuration(value) {
    return prefersReducedMotion() ? Math.min(value, 120) : value;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.LifelineMap = {
    init,
    resetView
  };
})();
