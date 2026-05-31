(function () {
  async function init() {
    const state = window.LifelineState;
    const config = window.LifelineConfig;
    state.worldCountries = await fetchJson("data/geo/world-countries.geojson");
    state.countries = await fetchJson("data/geo/countries.geojson");
    state.adminRegions = await fetchJson("data/geo/admin-regions.geojson");

    state.map = new maplibregl.Map({
      container: "map",
      style: config.mapStyle,
      center: config.worldView.center,
      zoom: config.worldView.zoom,
      pitch: config.worldView.pitch,
      bearing: config.worldView.bearing,
      maxZoom: config.maxZoom,
      minZoom: 0.75,
      attributionControl: false,
      renderWorldCopies: true
    });

    state.map.on("error", (event) => {
      console.warn("LIFELINE map warning", event && event.error ? event.error : event);
    });

    state.map.on("load", () => {
      addSourcesAndLayers();
      bindMapInteractions();
      bindIntroInterrupts();
      bindPacificCameraClamp();
      updateRoutes();
      state.projection = "flat";
      state.map.setProjection({ type: "mercator" });
      runIntroSequence();
      document.querySelector("#map-loading").classList.add("is-hidden");
    });
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  function addSourcesAndLayers() {
    const state = window.LifelineState;
    const map = state.map;
    map.addSource("world-countries", { type: "geojson", data: state.worldCountries });
    map.addSource("visited-countries", { type: "geojson", data: visitedCountriesCollection() });
    map.addSource("admin-regions", { type: "geojson", data: emptyCollection() });
    map.addSource("places", { type: "geojson", data: placesCollection() });
    map.addSource("routes-simple", { type: "geojson", data: emptyCollection(), lineMetrics: true });
    map.addSource("routes-full", { type: "geojson", data: emptyCollection(), lineMetrics: true });

    map.addLayer({
      id: "atlas-land-fill",
      type: "fill",
      source: "world-countries",
      paint: {
        "fill-color": "#f1dfb8",
        "fill-antialias": true,
        "fill-opacity": 0.98,
        "fill-opacity-transition": { duration: 260, delay: 0 }
      }
    });
    map.addLayer({
      id: "atlas-land-warmth",
      type: "fill",
      source: "world-countries",
      paint: {
        "fill-color": "#fff0bd",
        "fill-antialias": true,
        "fill-opacity": 0.24,
        "fill-opacity-transition": { duration: 260, delay: 0 }
      }
    });
    map.addLayer({
      id: "atlas-country-line",
      type: "line",
      source: "world-countries",
      paint: {
        "line-color": "rgba(89, 78, 54, 0.44)",
        "line-opacity": 0.16,
        "line-width": 0.38,
        "line-blur": 0.12,
        "line-opacity-transition": { duration: 240, delay: 0 }
      }
    });
    map.addLayer({
      id: "visited-countries-fill",
      type: "fill",
      source: "visited-countries",
      paint: {
        "fill-color": window.LifelineConfig.colors.visitedFill,
        "fill-antialias": true,
        "fill-opacity": countryFillOpacity(),
        "fill-opacity-transition": { duration: 220, delay: 0 }
      }
    });
    map.addLayer({
      id: "visited-countries-light",
      type: "fill",
      source: "visited-countries",
      paint: {
        "fill-color": "rgba(255, 246, 215, 0.64)",
        "fill-antialias": true,
        "fill-opacity": countryLightOpacity(),
        "fill-opacity-transition": { duration: 260, delay: 0 }
      }
    });
    map.addLayer({
      id: "visited-countries-halo",
      type: "line",
      source: "visited-countries",
      paint: {
        "line-color": window.LifelineConfig.colors.visitedHalo,
        "line-opacity": countryHaloOpacity(),
        "line-width": countryHaloWidth(),
        "line-blur": 1.2,
        "line-opacity-transition": { duration: 260, delay: 0 },
        "line-width-transition": { duration: 220, delay: 0 }
      }
    });
    map.addLayer({
      id: "visited-countries-line",
      type: "line",
      source: "visited-countries",
      paint: {
        "line-color": window.LifelineConfig.colors.visitedLine,
        "line-opacity": countryLineOpacity(),
        "line-width": countryLineWidth(),
        "line-blur": 0.25,
        "line-opacity-transition": { duration: 220, delay: 0 },
        "line-width-transition": { duration: 180, delay: 0 }
      }
    });
    map.addLayer({
      id: "admin-regions-fill",
      type: "fill",
      source: "admin-regions",
      paint: {
        "fill-color": window.LifelineConfig.colors.focusedFill,
        "fill-antialias": true,
        "fill-opacity": 0.17,
        "fill-opacity-transition": { duration: 220, delay: 0 }
      }
    });
    map.addLayer({
      id: "admin-regions-line",
      type: "line",
      source: "admin-regions",
      paint: {
        "line-color": window.LifelineConfig.colors.focusedLine,
        "line-opacity": 0.42,
        "line-width": 1.05,
        "line-blur": 0.2,
        "line-opacity-transition": { duration: 220, delay: 0 }
      }
    });
    addRouteLayers();
    addPlaceLayers();
  }

  function addRouteLayers() {
    const map = window.LifelineState.map;
    map.addLayer({
      id: "routes-simple-shadow",
      type: "line",
      source: "routes-simple",
      paint: {
        "line-color": window.LifelineConfig.colors.routeShadow,
        "line-width": 5.4,
        "line-opacity": 0,
        "line-blur": 0.55,
        "line-gradient": routeGradient(window.LifelineConfig.colors.routeShadow, 1),
        "line-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "routes-simple-glow",
      type: "line",
      source: "routes-simple",
      paint: {
        "line-color": window.LifelineConfig.colors.routeGlow,
        "line-width": ["coalesce", ["get", "routeGlowWidth"], 8],
        "line-opacity": 0.44,
        "line-gradient": routeGradient(window.LifelineConfig.colors.routeGlow, 1),
        "line-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "routes-simple",
      type: "line",
      source: "routes-simple",
      paint: {
        "line-color": window.LifelineConfig.colors.route,
        "line-width": ["coalesce", ["get", "routeWidth"], 2],
        "line-opacity": 0.9,
        "line-gradient": routeGradient(window.LifelineConfig.colors.route, 1),
        "line-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "routes-full-shadow",
      type: "line",
      source: "routes-full",
      paint: {
        "line-color": window.LifelineConfig.colors.routeShadow,
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 5.2, ["+", ["coalesce", ["get", "routeGlowWidth"], 3.1], 1.4]],
        "line-opacity": routeFullShadowOpacity(),
        "line-blur": 0.75,
        "line-gradient": routeGradient(window.LifelineConfig.colors.routeShadow, 1),
        "line-opacity-transition": { duration: 420, delay: 0 },
        "line-width-transition": { duration: 180, delay: 0 }
      }
    });
    map.addLayer({
      id: "routes-full",
      type: "line",
      source: "routes-full",
      paint: {
        "line-color": window.LifelineConfig.colors.routeGlow,
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 6.2, ["coalesce", ["get", "routeGlowWidth"], 3.8]],
        "line-opacity": routeFullGlowOpacity(),
        "line-blur": 1.1,
        "line-gradient": routeGradient(window.LifelineConfig.colors.routeGlow, 1),
        "line-opacity-transition": { duration: 420, delay: 0 },
        "line-width-transition": { duration: 180, delay: 0 }
      }
    });
    map.addLayer({
      id: "routes-full-core",
      type: "line",
      source: "routes-full",
      paint: {
        "line-color": window.LifelineConfig.colors.route,
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.4, ["coalesce", ["get", "routeWidth"], 1.35]],
        "line-opacity": routeFullOpacity(),
        "line-gradient": routeGradient(window.LifelineConfig.colors.route, 1),
        "line-opacity-transition": { duration: 420, delay: 0 },
        "line-width-transition": { duration: 180, delay: 0 }
      }
    });
  }

  function addPlaceLayers() {
    const map = window.LifelineState.map;
    map.addLayer({
      id: "places-glow",
      type: "circle",
      source: "places",
      paint: {
        "circle-radius": placeGlowRadius(),
        "circle-color": window.LifelineConfig.colors.pointGlow,
        "circle-opacity": 0.78,
        "circle-blur": 0.7,
        "circle-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "places-dot",
      type: "circle",
      source: "places",
      paint: {
        "circle-radius": placeDotRadius(),
        "circle-color": window.LifelineConfig.colors.point,
        "circle-stroke-color": window.LifelineConfig.colors.pointRing,
        "circle-stroke-width": 1.75,
        "circle-stroke-opacity": 1,
        "circle-opacity": 1,
        "circle-opacity-transition": { duration: 420, delay: 0 },
        "circle-stroke-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "places-label-high",
      type: "symbol",
      source: "places",
      filter: ["==", ["get", "labelPriority"], "high"],
      layout: {
        "text-field": ["get", "displayName"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 13,
        "text-offset": [1.1, 0],
        "text-anchor": "left",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": "#24303b",
      "text-halo-color": "rgba(255,255,255,0.88)",
      "text-halo-width": 1.2,
      "text-opacity": labelHighOpacity(),
      "text-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "places-label-normal",
      type: "symbol",
      source: "places",
      filter: ["!=", ["get", "labelPriority"], "high"],
      minzoom: 4.5,
      layout: {
        "text-field": ["get", "displayName"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 13,
        "text-offset": [1.1, 0],
        "text-anchor": "left",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": "#24303b",
      "text-halo-color": "rgba(255,255,255,0.88)",
      "text-halo-width": 1.2,
      "text-opacity": labelNormalOpacity(),
      "text-opacity-transition": { duration: 420, delay: 0 }
      }
    });
    map.addLayer({
      id: "places-hit-area",
      type: "circle",
      source: "places",
      paint: {
        "circle-radius": 18,
        "circle-color": "#000000",
        "circle-opacity": 0
      }
    });
  }

  function bindMapInteractions() {
    const map = window.LifelineState.map;
    const placeLayers = ["places-hit-area", "places-dot"];
    map.on("mouseenter", "visited-countries-fill", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "visited-countries-fill", () => {
      map.getCanvas().style.cursor = "";
      window.LifelineState.hoverCountryId = "";
      updateCountryPaint();
    });
    map.on("mousemove", "visited-countries-fill", (event) => {
      const placeHit = map.queryRenderedFeatures(event.point, { layers: placeLayers });
      if (placeHit.length) {
        if (window.LifelineState.hoverCountryId) {
          window.LifelineState.hoverCountryId = "";
          updateCountryPaint();
        }
        return;
      }
      const feature = event.features[0];
      if (window.LifelineState.hoverCountryId !== feature.properties.id) {
        window.LifelineState.hoverCountryId = feature.properties.id;
        updateCountryPaint();
      }
    });
    map.on("click", "visited-countries-fill", (event) => focusCountry(event.features[0].properties.id));
    placeLayers.forEach((layerId) => {
      map.on("click", layerId, (event) => {
        if (window.LifelineState.routeMode === "footprint") return;
        focusPlace(event.features[0].properties.id);
      });
      map.on("mouseenter", layerId, () => {
        if (window.LifelineState.routeMode !== "footprint") map.getCanvas().style.cursor = "pointer";
      });
      map.on("mousemove", layerId, (event) => {
        if (window.LifelineState.routeMode === "footprint") return;
        setHoveredPlace(event.features[0].properties.id);
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        setHoveredPlace("");
      });
    });
    map.on("mousemove", "routes-full-core", (event) => {
      if (window.LifelineState.routeMode !== "journeys") return;
      const props = event.features[0].properties;
      setHoveredRoute(event.features[0].id);
    });
    map.on("mouseleave", "routes-full-core", () => {
      setHoveredRoute("");
    });
  }

  function bindPacificCameraClamp() {
    const map = window.LifelineState.map;
    map.on("moveend", () => {
      if (window.LifelineState.isTransitioningProjection || window.LifelineState.isIntroRunning) return;
      const bounds = window.LifelineConfig.panBounds;
      if (!bounds) return;
      const center = map.getCenter();
      const normalizedLng = normalizePacificLng(center.lng);
      const clampedLng = Math.min(bounds[1][0], Math.max(bounds[0][0], normalizedLng));
      const clampedLat = Math.min(bounds[1][1], Math.max(bounds[0][1], center.lat));
      if (Math.abs(clampedLng - center.lng) > 0.001 || Math.abs(clampedLat - center.lat) > 0.001) {
        map.easeTo({
          center: [clampedLng, clampedLat],
          duration: 220,
          essential: true
        });
      }
    });
  }

  function normalizePacificLng(lng) {
    let value = lng;
    while (value < -40) value += 360;
    while (value > 320) value -= 360;
    return value;
  }

  async function focusCountry(countryId) {
    const state = window.LifelineState;
    const view = window.LifelineConfig.countryView[countryId];
    if (!view || state.isTransitioningProjection) return;
    skipIntro();
    const token = nextMotion();
    hideTooltip();
    state.focusCountryId = countryId;
    state.focusRegionId = "";
    state.activePlaceId = "";
    updateFocusLayers();
    window.LifelinePanels.closeCityCard();
    showBackWorld();
    await animateTo({ center: view.center, zoom: view.zoom, duration: motionDuration(1050), curve: 1.2 }, token, "fly");
  }

  async function focusPlace(placeId) {
    const state = window.LifelineState;
    const place = window.LifelineHelpers.getPlaceById(placeId);
    if (!place || state.isTransitioningProjection) return;
    skipIntro();
    const token = nextMotion();
    hideTooltip();
    const countryView = window.LifelineConfig.countryView[place.countryId] || { center: [place.lng, place.lat], zoom: 3.2 };
    const regionView = window.LifelineConfig.regionView[place.regionId] || { center: [place.lng, place.lat], zoom: 5.2 };

    state.activePlaceId = place.id;
    state.focusCountryId = place.countryId;
    state.focusRegionId = place.regionId;
    updateFocusLayers();
    window.LifelinePanels.closeCityCard();
    showBackWorld();

    if (state.map.getZoom() > countryView.zoom + 0.7) {
      await animateTo({
        center: state.map.getCenter().toArray(),
        zoom: Math.max(countryView.zoom + 0.4, regionView.zoom - 1.25),
        duration: motionDuration(380),
        curve: 1
      }, token, "ease");
      if (token !== state.motionId) return;
    }
    await animateTo({ center: countryView.center, zoom: countryView.zoom, duration: motionDuration(720), curve: 1.18 }, token, "fly");
    if (token !== state.motionId) return;
    await animateTo({ center: regionView.center, zoom: regionView.zoom, duration: motionDuration(880), curve: 1.08 }, token, "fly");
    if (token !== state.motionId) return;
    updateFocusLayers();
    window.LifelinePanels.renderCityCard(place);
  }

  async function backToWorld() {
    const state = window.LifelineState;
    if (state.isTransitioningProjection) return;
    skipIntro();
    const token = nextMotion();
    hideTooltip();
    state.focusCountryId = "";
    state.focusRegionId = "";
    state.activePlaceId = "";
    updateFocusLayers();
    window.LifelinePanels.closeCityCard();
    document.querySelector("#back-world").hidden = true;
    await animateTo({ ...window.LifelineConfig.worldView, duration: motionDuration(1050) }, token, "ease");
  }

  function setProjection(mode) {
    const state = window.LifelineState;
    if (state.isTransitioningProjection || state.projection === mode) return false;
    skipIntro();
    state.isTransitioningProjection = true;
    document.querySelectorAll("[data-projection]").forEach((button) => {
      button.classList.toggle("is-busy", true);
    });
    const token = nextMotion();
    runProjectionTransition(mode, token);
    return true;
  }

  async function runProjectionTransition(mode, token) {
    const state = window.LifelineState;
    const type = mode === "globe" ? "globe" : "mercator";
    const targetZoom = mode === "globe" ? 1.35 : window.LifelineConfig.worldView.zoom;
    window.LifelinePanels.closeCityCard();
    document.querySelector("#back-world").hidden = true;
    state.focusCountryId = "";
    state.focusRegionId = "";
    state.activePlaceId = "";
    updateFocusLayers();
    hideTooltip();
    setVisualFade(0.36);
    await animateTo({ ...window.LifelineConfig.worldView, duration: motionDuration(520) }, token, "ease", false);
    if (token !== state.motionId) return finishProjectionTransition(mode);
    await waitForIdleOrTimeout(180);
    if (token !== state.motionId) return finishProjectionTransition(mode);
    state.projection = mode;
    state.map.setProjection({ type });
    updateRoutes();
    updateModePaint();
    await waitForIdleOrTimeout(260);
    if (token !== state.motionId) return finishProjectionTransition(mode);
    await animateTo({
      center: window.LifelineConfig.worldView.center,
      zoom: targetZoom,
      pitch: 0,
      bearing: 0,
      duration: motionDuration(780)
    }, token, "ease", false);
    setVisualFade(1);
    finishProjectionTransition(mode);
  }

  function setRouteMode(mode) {
    if (window.LifelineState.isTransitioningProjection) return false;
    window.LifelineState.routeMode = mode;
    updateRoutes();
    updateModePaint();
    syncRouteButtons(mode);
    return true;
  }

  function syncRouteButtons(mode) {
    document.querySelectorAll("[data-route-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.routeMode === mode);
    });
  }

  function updateRoutes() {
    const collections = window.LifelineRoutes.buildRouteCollections(window.LifelineState.routeMode);
    updateSource("routes-simple", collections.simple);
    updateSource("routes-full", collections.full);
  }

  function updateFocusLayers() {
    const state = window.LifelineState;
    const regionFeature = state.focusRegionId ? window.LifelineHelpers.featureById(state.adminRegions, state.focusRegionId) : null;
    const territoryHint = regionFeature ? simplifyFeature(regionFeature, 0.045) : null;
    updateSource("admin-regions", territoryHint ? { type: "FeatureCollection", features: [territoryHint] } : emptyCollection());
    updateCountryPaint();
    const fade = state.layerFade || 1;
    state.map.setPaintProperty("admin-regions-fill", "fill-opacity", adminFillOpacity(fade));
    state.map.setPaintProperty("admin-regions-line", "line-opacity", adminLineOpacity(fade));
    updateModePaint();
  }

  function setVisualFade(factor) {
    const state = window.LifelineState;
    const map = state.map;
    state.layerFade = factor;
    if (!map || !map.getLayer("routes-simple")) return;
    updateModePaint();
  }

  function updateModePaint() {
    const state = window.LifelineState;
    const map = state.map;
    const factor = state.layerFade || 1;
    if (!map || !map.getLayer("routes-simple")) return;
    updateCountryPaint();
    const hasPlaces = state.routeMode !== "footprint";
    const hasLine = state.routeMode === "line";
    const hasJourneys = state.routeMode === "journeys";
    updateBaseMapPaint();
    map.setPaintProperty("admin-regions-fill", "fill-opacity", adminFillOpacity(factor));
    map.setPaintProperty("admin-regions-line", "line-opacity", adminLineOpacity(factor));
    map.setPaintProperty("routes-simple-shadow", "line-opacity", hasLine ? 0.32 * factor : 0);
    map.setPaintProperty("routes-simple-glow", "line-opacity", hasLine ? 0.56 * factor : 0);
    map.setPaintProperty("routes-simple", "line-opacity", hasLine ? 0.94 * factor : 0);
    map.setPaintProperty("routes-full-shadow", "line-opacity", hasJourneys ? routeFullShadowOpacity() : 0);
    map.setPaintProperty("routes-full", "line-opacity", hasJourneys ? routeFullGlowOpacity() : 0);
    map.setPaintProperty("routes-full-core", "line-opacity", hasJourneys ? routeFullOpacity() : 0);
    map.setPaintProperty("places-glow", "circle-opacity", hasPlaces ? 0.68 * factor : 0);
    map.setPaintProperty("places-dot", "circle-opacity", hasPlaces ? factor : 0);
    map.setPaintProperty("places-dot", "circle-stroke-opacity", hasPlaces ? factor : 0);
    map.setPaintProperty("places-label-high", "text-opacity", labelHighOpacity());
    map.setPaintProperty("places-label-normal", "text-opacity", labelNormalOpacity());
    updateRouteReveal(state.routeReveal ?? 1);
  }

  function routeFullOpacity() {
    const fade = window.LifelineState.layerFade || 1;
    return ["*", fade, ["case", ["boolean", ["feature-state", "hover"], false], 0.98, ["coalesce", ["get", "routeOpacity"], 0.68]]];
  }

  function routeFullGlowOpacity() {
    const fade = window.LifelineState.layerFade || 1;
    return ["*", fade, ["case", ["boolean", ["feature-state", "hover"], false], 0.46, ["coalesce", ["get", "routeGlowOpacity"], 0.16]]];
  }

  function routeFullShadowOpacity() {
    const fade = window.LifelineState.layerFade || 1;
    return ["*", fade, ["case", ["boolean", ["feature-state", "hover"], false], 0.34, 0.2]];
  }

  function routeGradient(color, reveal) {
    const stop = Math.max(0, Math.min(1, reveal));
    return [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0,
      color,
      Math.max(0, stop - 0.015),
      color,
      stop,
      "rgba(255, 255, 255, 0)"
    ];
  }

  function updateRouteReveal(reveal) {
    const state = window.LifelineState;
    const map = state.map;
    state.routeReveal = reveal;
    if (!map || !map.getLayer("routes-simple")) return;
    map.setPaintProperty("routes-simple-shadow", "line-gradient", routeGradient(window.LifelineConfig.colors.routeShadow, reveal));
    map.setPaintProperty("routes-simple-glow", "line-gradient", routeGradient(window.LifelineConfig.colors.routeGlow, reveal));
    map.setPaintProperty("routes-simple", "line-gradient", routeGradient(window.LifelineConfig.colors.route, reveal));
    map.setPaintProperty("routes-full-shadow", "line-gradient", routeGradient(window.LifelineConfig.colors.routeShadow, reveal));
    map.setPaintProperty("routes-full", "line-gradient", routeGradient(window.LifelineConfig.colors.routeGlow, reveal));
    map.setPaintProperty("routes-full-core", "line-gradient", routeGradient(window.LifelineConfig.colors.route, reveal));
  }

  function animateRouteReveal(duration = 720) {
    const state = window.LifelineState;
    cancelAnimationFrame(state.routeRevealFrame);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / motionDuration(duration));
      updateRouteReveal(1 - Math.pow(1 - t, 3));
      if (t < 1) state.routeRevealFrame = requestAnimationFrame(tick);
    };
    updateRouteReveal(0);
    state.routeRevealFrame = requestAnimationFrame(tick);
  }

  function updateBaseMapPaint() {
    const state = window.LifelineState;
    const map = state.map;
    if (!map || !map.getLayer("carto-base")) return;
    if (state.projection === "globe") {
    map.setPaintProperty("background", "background-color", "#326f7f");
    map.setPaintProperty("carto-base", "raster-opacity", 0.018);
      map.setPaintProperty("carto-base", "raster-saturation", -0.78);
      map.setPaintProperty("carto-base", "raster-contrast", -0.02);
      map.setPaintProperty("carto-base", "raster-brightness-min", 0.1);
      map.setPaintProperty("carto-base", "raster-brightness-max", 0.8);
      if (map.getLayer("atlas-land-fill")) {
      map.setPaintProperty("atlas-land-fill", "fill-color", "#efe1bf");
      map.setPaintProperty("atlas-land-fill", "fill-opacity", 0.98);
      map.setPaintProperty("atlas-land-warmth", "fill-opacity", 0.3);
      map.setPaintProperty("atlas-country-line", "line-opacity", 0.22);
      }
      return;
    }
    map.setPaintProperty("background", "background-color", "#5f9dad");
    map.setPaintProperty("carto-base", "raster-opacity", 0.016);
    map.setPaintProperty("carto-base", "raster-saturation", -0.86);
    map.setPaintProperty("carto-base", "raster-contrast", -0.2);
    map.setPaintProperty("carto-base", "raster-brightness-min", 0.14);
    map.setPaintProperty("carto-base", "raster-brightness-max", 0.84);
    if (map.getLayer("atlas-land-fill")) {
      map.setPaintProperty("atlas-land-fill", "fill-color", "#efe1bf");
      map.setPaintProperty("atlas-land-fill", "fill-opacity", 0.98);
      map.setPaintProperty("atlas-land-warmth", "fill-opacity", 0.28);
      map.setPaintProperty("atlas-country-line", "line-opacity", state.focusCountryId || state.focusRegionId ? 0.11 : 0.18);
    }
  }

  function updateCountryPaint() {
    const map = window.LifelineState.map;
    if (!map || !map.getLayer("visited-countries-fill")) return;
    map.setPaintProperty("visited-countries-fill", "fill-opacity", countryFillOpacity());
    map.setPaintProperty("visited-countries-light", "fill-opacity", countryLightOpacity());
    map.setPaintProperty("visited-countries-halo", "line-opacity", countryHaloOpacity());
    map.setPaintProperty("visited-countries-halo", "line-width", countryHaloWidth());
    map.setPaintProperty("visited-countries-line", "line-opacity", countryLineOpacity());
    map.setPaintProperty("visited-countries-line", "line-width", countryLineWidth());
  }

  function updatePlacePaint() {
    const map = window.LifelineState.map;
    if (!map || !map.getLayer("places-glow")) return;
    map.setPaintProperty("places-glow", "circle-radius", placeGlowRadius());
    map.setPaintProperty("places-dot", "circle-radius", placeDotRadius());
    map.setPaintProperty("places-label-high", "text-opacity", labelHighOpacity());
    map.setPaintProperty("places-label-normal", "text-opacity", labelNormalOpacity());
  }

  function placeGlowRadius() {
    const state = window.LifelineState;
    return [
      "case",
      ["==", ["get", "id"], ["literal", state.activePlaceId || ""]], 15.5,
      ["==", ["get", "id"], ["literal", state.hoverPlaceId || ""]], 14.2,
      11.8
    ];
  }

  function placeDotRadius() {
    const state = window.LifelineState;
    return [
      "case",
      ["==", ["get", "id"], ["literal", state.activePlaceId || ""]], 6.7,
      ["==", ["get", "id"], ["literal", state.hoverPlaceId || ""]], 5.9,
      5.05
    ];
  }

  function labelHighOpacity() {
    return 0;
  }

  function labelNormalOpacity() {
    return 0;
  }

  function countryFillOpacity() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    const fade = (state.layerFade || 1) * (state.projection === "globe" ? 0.82 : 1);
    const base = state.focusRegionId ? 0.34 : 0.76;
    return ["*", fade, [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], state.focusRegionId ? 0.48 : 0.86,
      ["==", ["get", "id"], ["literal", hoverId]], 0.84,
      base
    ]];
  }

  function countryLightOpacity() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    const fade = (state.layerFade || 1) * (state.projection === "globe" ? 0.68 : 1);
    const base = state.focusRegionId ? 0.12 : 0.38;
    return ["*", fade, [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], state.focusRegionId ? 0.22 : 0.48,
      ["==", ["get", "id"], ["literal", hoverId]], 0.45,
      base
    ]];
  }

  function countryHaloOpacity() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    const fade = (state.layerFade || 1) * (state.projection === "globe" ? 0.58 : 1);
    const base = state.focusRegionId ? 0.22 : 0.72;
    return ["*", fade, [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], state.focusRegionId ? 0.32 : 0.82,
      ["==", ["get", "id"], ["literal", hoverId]], 0.78,
      base
    ]];
  }

  function countryHaloWidth() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    return [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], 8.2,
      ["==", ["get", "id"], ["literal", hoverId]], 7,
      5.4
    ];
  }

  function countryLineOpacity() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    const fade = (state.layerFade || 1) * (state.projection === "globe" ? 0.68 : 1);
    const base = state.focusRegionId ? 0.28 : 0.66;
    return ["*", fade, [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], state.focusRegionId ? 0.42 : 0.76,
      ["==", ["get", "id"], ["literal", hoverId]], 0.74,
      base
    ]];
  }

  function countryLineWidth() {
    const state = window.LifelineState;
    const focusId = state.focusCountryId || "";
    const hoverId = state.hoverCountryId || "";
    return [
      "case",
      ["==", ["get", "id"], ["literal", focusId]], 0.95,
      ["==", ["get", "id"], ["literal", hoverId]], 0.8,
      0.55
    ];
  }

  function adminFillOpacity(fade) {
    const state = window.LifelineState;
    if (state.projection === "globe" || !state.focusRegionId) return 0;
    return 0.34 * fade;
  }

  function adminLineOpacity(fade) {
    const state = window.LifelineState;
    if (state.projection === "globe" || !state.focusRegionId) return 0;
    return 0.62 * fade;
  }

  function updateSource(id, data) {
    const source = window.LifelineState.map.getSource(id);
    if (source) source.setData(data);
  }

  function simplifyFeature(feature, tolerance) {
    if (!feature || !feature.geometry) return feature;
    const geometry = feature.geometry;
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: simplifyGeometryCoordinates(geometry.coordinates, geometry.type, tolerance)
      }
    };
  }

  function simplifyGeometryCoordinates(coordinates, type, tolerance) {
    if (type === "Polygon") return coordinates.map((ring) => simplifyRing(ring, tolerance));
    if (type === "MultiPolygon") {
      return coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)));
    }
    return coordinates;
  }

  function simplifyRing(ring, tolerance) {
    if (!Array.isArray(ring) || ring.length <= 12) return ring;
    const isClosed = sameCoord(ring[0], ring[ring.length - 1]);
    const body = isClosed ? ring.slice(0, -1) : ring.slice();
    const simplified = rdp(body, tolerance);
    if (isClosed && simplified.length) simplified.push(simplified[0]);
    return simplified.length >= 4 ? simplified : ring;
  }

  function rdp(points, tolerance) {
    if (points.length <= 2) return points;
    let maxDistance = 0;
    let index = 0;
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
    if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
    return Math.abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0]) / Math.hypot(dx, dy);
  }

  function sameCoord(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  }

  function placesCollection() {
    return {
      type: "FeatureCollection",
      features: window.LifelineHelpers.visiblePlaces().map((place) => ({
        type: "Feature",
        properties: {
          id: place.id,
          displayName: window.LifelineHelpers.getPlaceLabel(place),
          labelPriority: place.labelPriority || "normal",
          countryId: place.countryId,
          regionId: place.regionId
        },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] }
      }))
    };
  }

  function visitedCountriesCollection() {
    const visitedIds = new Set(window.LifelineHelpers.visiblePlaces().map((place) => place.countryId).filter(Boolean));
    return {
      type: "FeatureCollection",
      features: (window.LifelineState.countries.features || []).filter((feature) => visitedIds.has(feature.properties.id))
    };
  }

  function emptyCollection() {
    return { type: "FeatureCollection", features: [] };
  }

  function showBackWorld() {
    document.querySelector("#back-world").hidden = false;
  }

  function runIntroSequence() {
    const state = window.LifelineState;
    const shell = document.querySelector("#lifeline-shell");
    state.isIntroRunning = true;
    shell.classList.add("is-intro");
    shell.classList.remove("intro-title-visible", "intro-map-visible");
    setRouteMode("footprint");
    if (prefersReducedMotion()) {
      skipIntro();
      return;
    }
    updateRouteReveal(0);
    state.map.jumpTo({ center: [150, 6], zoom: 1.04, pitch: 0, bearing: 0 });
    setVisualFade(0);
    requestAnimationFrame(() => shell.classList.add("intro-title-visible"));
    state.map.easeTo({
      ...window.LifelineConfig.worldView,
      duration: motionDuration(4200),
      easing: (t) => 1 - Math.pow(1 - t, 3),
      essential: true
    });
    state.introTimers = [
      setTimeout(() => {
        shell.classList.add("intro-map-visible");
      }, 420),
      setTimeout(() => {
        setVisualFade(1);
      }, 760),
      setTimeout(() => {
        setRouteMode("line");
        animateRouteReveal(1250);
      }, 2200),
      setTimeout(() => {
        state.isIntroRunning = false;
        setRouteMode("line");
        shell.classList.remove("is-intro", "intro-title-visible", "intro-map-visible");
      }, 4300)
    ];
  }

  function skipIntro() {
    const state = window.LifelineState;
    if (!state.isIntroRunning) return;
    const shell = document.querySelector("#lifeline-shell");
    (state.introTimers || []).forEach((timer) => clearTimeout(timer));
    state.introTimers = [];
    state.isIntroRunning = false;
    state.map.stop();
    cancelAnimationFrame(state.routeRevealFrame);
    setRouteMode("line");
    updateRouteReveal(1);
    setVisualFade(1);
    shell.classList.remove("is-intro", "intro-title-visible", "intro-map-visible");
    state.map.easeTo({ ...window.LifelineConfig.worldView, duration: motionDuration(160), essential: true });
  }

  function bindIntroInterrupts() {
    const map = window.LifelineState.map;
    const skipForUser = (event) => {
      if (event && event.originalEvent) skipIntro();
    };
    map.on("dragstart", skipForUser);
    map.on("zoomstart", skipForUser);
    map.on("rotatestart", skipForUser);
    map.on("pitchstart", skipForUser);
    map.getCanvas().addEventListener("pointerdown", skipIntro);
  }

  function nextMotion() {
    const state = window.LifelineState;
    state.motionId += 1;
    state.map.stop();
    return state.motionId;
  }

  function animateTo(options, token, method = "ease", stopBefore = true) {
    const state = window.LifelineState;
    if (token !== state.motionId) return Promise.resolve(false);
    if (stopBefore) state.map.stop();
    const payload = { ...options, essential: true };
    if (prefersReducedMotion()) payload.duration = Math.min(180, payload.duration || 180);
    const animation = method === "fly" ? "flyTo" : "easeTo";
    state.map[animation](payload);
    return waitForMoveEnd(token);
  }

  function waitForMoveEnd(token) {
    const state = window.LifelineState;
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        state.map.off("moveend", finish);
        resolve(token === state.motionId);
      };
      state.map.once("moveend", finish);
      setTimeout(finish, prefersReducedMotion() ? 240 : 1800);
    });
  }

  function waitForIdleOrTimeout(timeout) {
    const map = window.LifelineState.map;
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        map.off("idle", finish);
        resolve();
      };
      map.once("idle", finish);
      setTimeout(finish, timeout);
    });
  }

  function finishProjectionTransition(mode) {
    const state = window.LifelineState;
    state.isTransitioningProjection = false;
    state.projection = mode;
    setVisualFade(1);
    document.querySelectorAll("[data-projection]").forEach((button) => {
      button.classList.toggle("is-busy", false);
      button.classList.toggle("is-active", button.dataset.projection === mode);
    });
  }

  function motionDuration(value) {
    return prefersReducedMotion() ? Math.min(value, 180) : value;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setHoveredRoute(routeId) {
    const state = window.LifelineState;
    if (state.hoveredRouteId === routeId) return;
    if (state.hoveredRouteId) {
      state.map.setFeatureState({ source: "routes-full", id: state.hoveredRouteId }, { hover: false });
    }
    state.hoveredRouteId = routeId || "";
    if (state.hoveredRouteId) {
      state.map.setFeatureState({ source: "routes-full", id: state.hoveredRouteId }, { hover: true });
    }
  }

  function setHoveredPlace(placeId) {
    const state = window.LifelineState;
    if (state.hoverPlaceId === placeId) return;
    state.hoverPlaceId = placeId || "";
    updatePlacePaint();
  }

  function hideTooltip() {
    return;
  }

  window.LifelineMap = {
    init,
    focusPlace,
    focusCountry,
    backToWorld,
    setProjection,
    setRouteMode,
    skipIntro,
    hideTooltip
  };
})();
