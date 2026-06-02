(function () {
  function allPlaces() {
    return Array.isArray(window.LIFELINE_PLACES) ? window.LIFELINE_PLACES : [];
  }

  function visiblePlaces() {
    return allPlaces().filter((place) => place.visible !== false);
  }

  function getPlaceById(id) {
    return allPlaces().find((place) => place.id === id);
  }

  function getPlaceLabel(place) {
    if (!place) return "";
    return place.name || place.nameZh || place.id;
  }

  function visitedCountryIds() {
    return new Set(visiblePlaces().map((place) => place.countryId).filter(Boolean));
  }

  function firstVisitLabel(place) {
    if (!place || !Array.isArray(place.visits) || !place.visits.length) return "Visited";
    const sorted = [...place.visits].sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
    return sorted[0].start || "Visited";
  }

  window.LifelineHelpers = {
    allPlaces,
    visiblePlaces,
    getPlaceById,
    getPlaceLabel,
    visitedCountryIds,
    firstVisitLabel
  };
})();
