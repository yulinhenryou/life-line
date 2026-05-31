(function () {
  window.LifelineState = {
    map: null,
    countries: null,
    adminRegions: null,
    projection: "flat",
    routeMode: "footprint",
    focusCountryId: "",
    focusRegionId: "",
    hoverCountryId: "",
    hoverPlaceId: "",
    activePlaceId: "",
    isTransitioningProjection: false,
    isIntroRunning: false,
    motionId: 0,
    layerFade: 1,
    routeReveal: 1,
    routeRevealFrame: 0,
    hoveredRouteId: "",
    tooltipFrame: 0,
    tooltipHideTimer: 0
  };

  window.addEventListener("DOMContentLoaded", () => {
    const loading = document.querySelector("#map-loading");
    if (!window.maplibregl || !window.LifelineMap) {
      if (loading) loading.textContent = "Map engine failed to load";
      return;
    }
    window.LifelineMap.init().catch((error) => {
      console.error("LIFELINE map failed to initialize", error);
      if (loading) {
        loading.dataset.error = error && error.message ? error.message : String(error);
        loading.dataset.stack = error && error.stack ? error.stack : "";
        loading.textContent = "Map failed to load";
      }
    });
    bindControls();
  });

  function bindControls() {
    document.querySelectorAll("[data-projection]").forEach((button) => {
      button.addEventListener("click", () => {
        if (window.LifelineState.isTransitioningProjection || window.LifelineState.projection === button.dataset.projection) return;
        window.LifelineMap.skipIntro();
        const accepted = window.LifelineMap.setProjection(button.dataset.projection);
        if (!accepted) return;
        document.querySelectorAll("[data-projection]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    document.querySelectorAll("[data-route-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        window.LifelineMap.skipIntro();
        const accepted = window.LifelineMap.setRouteMode(button.dataset.routeMode);
        if (!accepted) return;
        document.querySelectorAll("[data-route-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    document.querySelector("#back-world").addEventListener("click", () => {
      window.LifelineMap.skipIntro();
      window.LifelineMap.backToWorld();
    });
    document.querySelector("#add-map").addEventListener("click", () => {
      window.LifelineMap.skipIntro();
      window.LifelinePanels.openAddPanel("place");
    });
  }
})();
