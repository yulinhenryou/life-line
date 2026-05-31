(function () {
  function visiblePlaces() {
    return (window.LIFELINE_PLACES || []).filter((place) => place.visible !== false);
  }

  function visibleJourneys() {
    return (window.LIFELINE_JOURNEYS || []).filter((journey) => journey.visible !== false);
  }

  function getPlaceById(id) {
    return visiblePlaces().find((place) => place.id === id);
  }

  function shouldUseChinese(place) {
    return place && place.countryId === "CN";
  }

  function getPlaceLabel(place) {
    return shouldUseChinese(place) ? place.nameZh || place.name : place.name;
  }

  function getCountryLabel(placeOrFeature) {
    const props = placeOrFeature.properties || placeOrFeature;
    return props.countryId === "CN" || props.id === "CN" ? props.countryZh || props.nameZh || props.country || props.name : props.country || props.name;
  }

  function getRegionLabel(place) {
    return shouldUseChinese(place) ? place.adminRegionZh || place.adminRegion : place.adminRegion;
  }

  function getPlaceSubtitle(place) {
    return `${shouldUseChinese(place) ? place.countryZh || place.country : place.country} · ${getRegionLabel(place)}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(value) {
    return String(value || "new-place")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "new-place";
  }

  function bbox(feature) {
    const coords = [];
    collectCoordinates(feature.geometry.coordinates, coords);
    return coords.reduce(
      (box, coord) => [
        [Math.min(box[0][0], coord[0]), Math.min(box[0][1], coord[1])],
        [Math.max(box[1][0], coord[0]), Math.max(box[1][1], coord[1])]
      ],
      [
        [Infinity, Infinity],
        [-Infinity, -Infinity]
      ]
    );
  }

  function collectCoordinates(input, output) {
    if (typeof input[0] === "number") {
      output.push(input);
      return;
    }
    input.forEach((item) => collectCoordinates(item, output));
  }

  function featureById(collection, id) {
    return collection.features.find((feature) => feature.properties && feature.properties.id === id);
  }

  window.LifelineHelpers = {
    visiblePlaces,
    visibleJourneys,
    getPlaceById,
    getPlaceLabel,
    getCountryLabel,
    getRegionLabel,
    getPlaceSubtitle,
    escapeHtml,
    slugify,
    bbox,
    featureById
  };
})();
