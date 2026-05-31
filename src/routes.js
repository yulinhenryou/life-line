(function () {
  function buildRouteCollections(routeMode) {
    if (routeMode === "footprint" || routeMode === "hidden") {
      return { simple: empty(), full: empty() };
    }

    const journeys = window.LifelineHelpers.visibleJourneys();
    return {
      simple: routeMode === "line" || routeMode === "simple" ? makeSimpleRoutes(journeys) : empty(),
      full: routeMode === "journeys" || routeMode === "full" ? makeFullRoutes(journeys) : empty()
    };
  }

  function makeSimpleRoutes(journeys) {
    const seenPairs = new Set();
    const features = [];
    journeys.forEach((journey) => {
      const from = window.LifelineHelpers.getPlaceById(journey.from);
      const to = window.LifelineHelpers.getPlaceById(journey.to);
      if (!from || !to) return;
      const key = routePairKey(from.id, to.id);
      if (seenPairs.has(key)) return;
      seenPairs.add(key);
      features.push(routeFeature(from, to, {
        id: `lifeline-${from.id}-to-${to.id}`,
        mode: "simple",
        routeOpacity: 0.95,
        routeGlowOpacity: 0.58,
        routeWidth: 2.05,
        routeGlowWidth: 9.2,
        offsetValue: simpleOffsetForPair(from, to, features.length)
      }));
    });

    return { type: "FeatureCollection", features };
  }

  function makeFullRoutes(journeys) {
    const pairCounts = new Map();
    journeys.forEach((journey) => {
      const from = window.LifelineHelpers.getPlaceById(journey.from);
      const to = window.LifelineHelpers.getPlaceById(journey.to);
      if (!from || !to) return;
      const key = routePairKey(from.id, to.id);
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });

    const pairPositions = new Map();
    return {
      type: "FeatureCollection",
      features: journeys
        .map((journey) => {
          const from = window.LifelineHelpers.getPlaceById(journey.from);
          const to = window.LifelineHelpers.getPlaceById(journey.to);
          if (!from || !to) return null;
          const key = routePairKey(from.id, to.id);
          const position = pairPositions.get(key) || 0;
          const count = pairCounts.get(key) || 1;
          pairPositions.set(key, position + 1);
          return routeFeature(from, to, {
            id: journey.id,
            year: journey.year,
            label: journey.label,
            fromLabel: window.LifelineHelpers.getPlaceLabel(from),
            toLabel: window.LifelineHelpers.getPlaceLabel(to),
            offsetValue: count <= 1 ? 0 : position - (count - 1) / 2,
            ...routeVisualProperties(from, to)
          });
        })
        .filter(Boolean)
    };
  }

  function routeFeature(from, to, properties) {
    const isGlobe = window.LifelineState && window.LifelineState.projection === "globe";
    const geometry = isGlobe
      ? {
          type: "LineString",
          coordinates: greatCircle([from.lng, from.lat], [to.lng, to.lat], properties.offsetValue || 0)
        }
      : flatArcGeometry([from.lng, from.lat], [to.lng, to.lat], properties.offsetValue || 0);

    return {
      type: "Feature",
      id: properties.id,
      properties: {
        routeOpacity: 0.62,
        routeGlowOpacity: 0.11,
        routeWidth: 1.05,
        routeGlowWidth: 3.1,
        ...properties
      },
      geometry
    };
  }

  function routeVisualProperties(from, to) {
    const distance = Math.hypot(shortestDeltaLng(from.lng, to.lng), to.lat - from.lat);
    if (distance < 8) {
      return {
        routeOpacity: 0.42,
        routeGlowOpacity: 0.09,
        routeWidth: 0.92,
        routeGlowWidth: 2.4
      };
    }
    if (distance < 30) {
      return {
        routeOpacity: 0.56,
        routeGlowOpacity: 0.13,
        routeWidth: 1.05,
        routeGlowWidth: 3
      };
    }
    if (distance < 95) {
      return {
        routeOpacity: 0.68,
        routeGlowOpacity: 0.18,
        routeWidth: 1.2,
        routeGlowWidth: 3.7
      };
    }
    return {
      routeOpacity: 0.78,
      routeGlowOpacity: 0.24,
      routeWidth: 1.35,
      routeGlowWidth: 4.6
    };
  }

  function flatArcGeometry(start, end, offsetValue) {
    const coordinates = flatArcCoordinates(start, end, offsetValue);
    return { type: "LineString", coordinates: coordinates };
  }

  function flatArcCoordinates(start, end, offsetValue) {
    const coords = [];
    const displayCenter = window.LifelineConfig?.worldView?.center?.[0] ?? 0;
    const dx = shortestDeltaLng(start[0], end[0]);
    const shift = displayShift(start[0], start[0] + dx, displayCenter);
    const dy = end[1] - start[1];
    const distance = Math.hypot(dx, dy);
    const bend = Math.min(24, Math.max(4.2, distance * 0.14));
    const perpendicular = normalize([-dy, dx]);
    const side = preferredArcSide(start, end);

    for (let step = 0; step <= 72; step += 1) {
      const t = step / 72;
      const ease = t * t * (3 - 2 * t);
      const arc = Math.sin(Math.PI * t);
      const lon = start[0] + dx * ease + perpendicular[0] * offsetValue * 3.8 * arc + shift;
      const lat = start[1] + dy * ease + side * bend * arc + perpendicular[1] * offsetValue * 3.8 * arc;
      coords.push([lon, lat]);
    }
    return coords;
  }

  function preferredArcSide(start, end) {
    const avgLat = (start[1] + end[1]) / 2;
    if (avgLat < -12) return -1;
    return 1;
  }

  function simpleOffsetForPair(from, to, index) {
    const distance = Math.hypot(shortestDeltaLng(from.lng, to.lng), to.lat - from.lat);
    if (distance < 8) return 0;
    return ((index % 3) - 1) * 0.16;
  }

  function shortestDeltaLng(startLng, endLng) {
    let delta = endLng - startLng;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  }

  function displayShift(startLng, endLng, displayCenter) {
    const midpoint = (startLng + endLng) / 2;
    return Math.round((displayCenter - midpoint) / 360) * 360;
  }

  function greatCircle(start, end, offsetValue) {
    const startVec = lonLatToVector(start);
    const endVec = lonLatToVector(end);
    const dot = clamp(startVec.x * endVec.x + startVec.y * endVec.y + startVec.z * endVec.z, -1, 1);
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);
    const coords = [];

    for (let step = 0; step <= 72; step += 1) {
      const t = step / 72;
      const a = Math.sin((1 - t) * omega) / sinOmega;
      const b = Math.sin(t * omega) / sinOmega;
      const vec = {
        x: a * startVec.x + b * endVec.x,
        y: a * startVec.y + b * endVec.y,
        z: a * startVec.z + b * endVec.z
      };
      const coord = vectorToLonLat(vec);
      if (offsetValue) {
        const arc = Math.sin(Math.PI * t);
        coord[0] += offsetValue * 12 * arc;
        coord[1] += offsetValue * 14 * arc;
      }
      coords.push(coord);
    }
    return coords;
  }

  function routePairKey(fromId, toId) {
    return [fromId, toId].sort().join("--");
  }

  function normalize(vector) {
    const length = Math.hypot(vector[0], vector[1]) || 1;
    return [vector[0] / length, vector[1] / length];
  }

  function lonLatToVector(coord) {
    const lon = toRad(coord[0]);
    const lat = toRad(coord[1]);
    return {
      x: Math.cos(lat) * Math.cos(lon),
      y: Math.cos(lat) * Math.sin(lon),
      z: Math.sin(lat)
    };
  }

  function vectorToLonLat(vec) {
    const length = Math.hypot(vec.x, vec.y, vec.z);
    const x = vec.x / length;
    const y = vec.y / length;
    const z = vec.z / length;
    return [toDeg(Math.atan2(y, x)), toDeg(Math.asin(z))];
  }

  function toRad(value) {
    return (value * Math.PI) / 180;
  }

  function toDeg(value) {
    return (value * 180) / Math.PI;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function empty() {
    return { type: "FeatureCollection", features: [] };
  }

  window.LifelineRoutes = {
    buildRouteCollections
  };
})();
