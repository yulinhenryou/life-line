(function () {
  window.LifelineConfig = {
    mapStyle: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        carto: {
          type: "raster",
          tiles: ["https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
        }
      },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#5f9dad" } },
        {
          id: "carto-base",
          type: "raster",
          source: "carto",
          paint: {
            "raster-opacity": 0.018,
            "raster-saturation": -0.9,
            "raster-contrast": -0.24,
            "raster-brightness-min": 0.12,
            "raster-brightness-max": 0.78
          }
        }
      ]
    },
    worldView: {
      center: [160, 8],
      zoom: 1.18,
      pitch: 0,
      bearing: 0
    },
    panBounds: [
      [-40.25, -72],
      [319.5, 82]
    ],
    countryView: {
      CN: { center: [104.5, 34.4], zoom: 3.45 },
      AU: { center: [134.5, -26.5], zoom: 3.35 },
      SG: { center: [103.82, 1.35], zoom: 5.3 },
      US: { center: [261.5, 39.5], zoom: 3.05 },
      JP: { center: [138.2, 37.7], zoom: 4.0 },
      KR: { center: [127.8, 36.4], zoom: 4.7 },
      DK: { center: [10.1, 56.0], zoom: 4.8 },
      NO: { center: [9.0, 62.0], zoom: 4.0 }
    },
    regionView: {
      "CN-HN": { center: [112.2, 27.7], zoom: 5.25 },
      "AU-NSW": { center: [148.7, -33.1], zoom: 4.85 },
      "SG": { center: [103.82, 1.35], zoom: 6.1 },
      "US-CA": { center: [240.5, 37.1], zoom: 4.8 },
      "US-HI": { center: [202.14, 21.31], zoom: 5.25 },
      "US-MI": { center: [275.4, 44.1], zoom: 5.1 },
      "US-OH": { center: [277.2, 40.1], zoom: 5.45 },
      "CN-BJ": { center: [116.4, 39.9], zoom: 5.7 },
      "CN-SH": { center: [121.47, 31.23], zoom: 5.75 },
      "CN-GD": { center: [113.4, 23.4], zoom: 5.1 },
      "CN-SC": { center: [103.8, 30.5], zoom: 5.1 },
      "CN-HK": { center: [114.17, 22.32], zoom: 6.1 },
      "JP-13": { center: [139.65, 35.68], zoom: 5.6 },
      "KR-11": { center: [126.98, 37.57], zoom: 5.7 },
      "DK-84": { center: [12.57, 55.68], zoom: 5.7 },
      "NO-03": { center: [10.75, 59.91], zoom: 5.65 }
    },
    colors: {
      visitedFill: "rgba(232, 184, 96, 0.94)",
      visitedLine: "rgba(118, 84, 46, 0.66)",
      visitedHalo: "rgba(255, 224, 142, 0.86)",
      focusedFill: "rgba(248, 198, 104, 0.98)",
      focusedLine: "rgba(102, 69, 34, 0.76)",
      routeShadow: "rgba(36, 42, 42, 0.22)",
      route: "rgba(255, 244, 203, 0.96)",
      routeGlow: "rgba(255, 204, 105, 0.56)",
      point: "#f8fcff",
      pointRing: "#1f6f8d",
      pointGlow: "rgba(174, 236, 244, 0.72)"
    },
    maxZoom: 6.5
  };
})();
