(function () {
  window.LifelineConfig = {
    originPlaceId: "changsha",
    worldView: {
      center: [22, 16],
      zoom: 1.28,
      pitch: 0,
      bearing: 0
    },
    introView: {
      center: [112.9388, 28.2282],
      zoom: 4.65,
      pitch: 0,
      bearing: 0
    },
    bounds: [
      [-179.8, -58],
      [179.8, 78]
    ],
    maxZoom: 6.2,
    minZoom: 1.08,
    mapStyle: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {},
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#eaf1f5" }
        }
      ]
    },
    colors: {
      ocean: "#eaf1f5",
      land: "#ffffff",
      landLine: "rgba(32, 44, 56, 0.18)",
      visitedFill: "rgba(30, 115, 148, 0.18)",
      visitedLine: "rgba(30, 115, 148, 0.46)",
      origin: "#111827",
      point: "#f7fbff",
      pointVisited: "#1b789a",
      pointRing: "rgba(12, 34, 49, 0.32)"
    }
  };
})();
