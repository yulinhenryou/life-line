(function () {
  window.LifelineState = {
    map: null,
    worldCountries: null,
    visitedCountries: null,
    activePlaceId: "",
    hoverPlaceId: "",
    introDone: false
  };

  window.addEventListener("DOMContentLoaded", () => {
    const status = document.querySelector("#map-status span");
    if (!window.maplibregl || !window.LifelineMap) {
      if (status) status.textContent = "Map engine failed to load";
      return;
    }

    window.LifelineMap.init()
      .then(() => bindControls())
      .catch((error) => {
        console.error("LIFELINE failed to initialize", error);
        if (status) status.textContent = "Map failed to load";
      });
  });

  function bindControls() {
    const reset = document.querySelector("#reset-view");
    if (reset) {
      reset.addEventListener("click", () => {
        window.LifelineMap.resetView();
      });
    }
  }
})();
