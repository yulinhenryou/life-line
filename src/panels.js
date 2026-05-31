(function () {
  function renderCityCard(place) {
    const card = document.querySelector("#city-card");
    card.hidden = false;
    card.innerHTML = `
      <div class="city-card-inner">
        <div class="city-card-copy">
          <h2>${window.LifelineHelpers.escapeHtml(window.LifelineHelpers.getPlaceLabel(place))}</h2>
          <p>${window.LifelineHelpers.escapeHtml(window.LifelineHelpers.getPlaceSubtitle(place))}</p>
        </div>
        <div class="city-card-actions">
          <button class="visit-add" type="button" aria-label="Add visit">+</button>
          <button class="card-action card-close" type="button" aria-label="Close">×</button>
        </div>
      </div>
    `;
    card.querySelector(".card-close").addEventListener("click", closeCityCard);
    card.querySelector(".visit-add").addEventListener("click", () => openVisitPanel(place));
    requestAnimationFrame(() => card.classList.add("is-visible"));
  }

  function closeCityCard() {
    const card = document.querySelector("#city-card");
    card.classList.remove("is-visible");
    window.LifelineState.activePlaceId = "";
    setTimeout(() => {
      if (!card.classList.contains("is-visible")) card.hidden = true;
    }, 180);
  }

  function openAddPanel(initialTab = "place") {
    const panel = document.querySelector("#add-panel");
    panel.hidden = false;
    panel.innerHTML = renderAddPanel(initialTab);
    bindAddPanel(panel);
    requestAnimationFrame(() => panel.classList.add("is-visible"));
  }

  function renderAddPanel(activeTab) {
    return `
      <button class="panel-close" type="button" aria-label="Close">×</button>
      <h2>Add to Map</h2>
      <div class="panel-tabs">
        <button class="${activeTab === "place" ? "is-active" : ""}" type="button" data-tab="place">Place</button>
        <button class="${activeTab === "journey" ? "is-active" : ""}" type="button" data-tab="journey">Journey</button>
      </div>
      <details class="add-guide">
        <summary>How to add data</summary>
        <ul>
          <li>LIFELINE is a static site.</li>
          <li>This panel generates code snippets; it does not save automatically.</li>
          <li>Add Place → copy into <code>data/places.js</code>.</li>
          <li>Add Journey → copy into <code>data/journeys.js</code>.</li>
          <li><code>countryId</code> controls country highlight.</li>
          <li><code>regionId</code> controls admin-region highlight if polygon exists.</li>
          <li>If polygon is missing, the place still appears but region fill will not show.</li>
        </ul>
      </details>
      <form class="template-form" data-form="${activeTab}">
        ${activeTab === "place" ? renderPlaceForm() : renderJourneyForm()}
        <button class="generate-button" type="submit">Generate template</button>
      </form>
      <div class="template-output-wrap">
        <button class="copy-template" type="button" data-copy-target="template-output">Copy</button>
        <pre class="template-output" id="template-output"></pre>
      </div>
    `;
  }

  function renderPlaceForm() {
    return `
      <label>Display name<input name="name" placeholder="Melbourne" required /></label>
      <label>Country<input name="country" placeholder="Australia" required /></label>
      <label>Admin region<input name="adminRegion" placeholder="Victoria" required /></label>
      <div class="form-grid">
        <label>Latitude<input name="lat" placeholder="-37.8136" required /></label>
        <label>Longitude<input name="lng" placeholder="144.9631" required /></label>
      </div>
      <details>
        <summary>Advanced</summary>
        <label>Chinese name<input name="nameZh" placeholder="墨尔本" /></label>
        <div class="form-grid">
          <label>Country ID<input name="countryId" placeholder="AU" /></label>
          <label>Region ID<input name="regionId" placeholder="AU-VIC" /></label>
        </div>
        <label>Label priority
          <select name="labelPriority">
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
      </details>
    `;
  }

  function renderJourneyForm() {
    const options = window.LifelineHelpers.visiblePlaces()
      .map((place) => `<option value="${place.id}">${window.LifelineHelpers.escapeHtml(window.LifelineHelpers.getPlaceLabel(place))}</option>`)
      .join("");
    return `
      <label>From<select name="from" required>${options}</select></label>
      <label>To<select name="to" required>${options}</select></label>
      <label>Year<input name="year" placeholder="2026" required /></label>
      <details>
        <summary>Advanced</summary>
        <label>Label<input name="label" placeholder="University move" /></label>
        <label>Visible<select name="visible"><option value="true">true</option><option value="false">false</option></select></label>
      </details>
    `;
  }

  function bindAddPanel(panel) {
    panel.querySelector(".panel-close").addEventListener("click", () => closePanel(panel));
    bindCopyButtons(panel);
    panel.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        panel.innerHTML = renderAddPanel(button.dataset.tab);
        bindAddPanel(panel);
      });
    });
    panel.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      panel.querySelector("#template-output").textContent = form.dataset.form === "place" ? makePlaceTemplate(data) : makeJourneyTemplate(data);
    });
  }

  function openVisitPanel(place) {
    const panel = document.querySelector("#visit-panel");
    panel.hidden = false;
    panel.innerHTML = `
      <button class="panel-close" type="button" aria-label="Close">×</button>
      <h2>Add Visit</h2>
      <p class="panel-muted">${window.LifelineHelpers.escapeHtml(window.LifelineHelpers.getPlaceLabel(place))}</p>
      <form class="template-form">
        <label>Date / Period<input name="start" placeholder="2026-01" required /></label>
        <label>Short note<textarea name="note" placeholder="First semester at USyd."></textarea></label>
        <details>
          <summary>Advanced</summary>
          <label>Label<input name="label" placeholder="University semester" /></label>
          <label>End date<input name="end" placeholder="2026-06" /></label>
        </details>
        <button class="generate-button" type="submit">Generate visit</button>
      </form>
      <div class="template-output-wrap">
        <button class="copy-template" type="button" data-copy-target="visit-output">Copy</button>
        <pre class="template-output" id="visit-output"></pre>
      </div>
    `;
    panel.querySelector(".panel-close").addEventListener("click", () => closePanel(panel));
    bindCopyButtons(panel);
    panel.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      panel.querySelector("#visit-output").textContent = makeVisitTemplate(place, data);
    });
    requestAnimationFrame(() => panel.classList.add("is-visible"));
  }

  function closePanel(panel) {
    panel.classList.remove("is-visible");
    setTimeout(() => {
      if (!panel.classList.contains("is-visible")) panel.hidden = true;
    }, 180);
  }

  function bindCopyButtons(panel) {
    panel.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", async () => {
        const output = panel.querySelector(`#${button.dataset.copyTarget}`);
        const text = output ? output.textContent.trim() : "";
        if (!text) return;
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
        setTimeout(() => {
          button.textContent = "Copy";
        }, 1100);
      });
    });
  }

  function makePlaceTemplate(data) {
    const id = window.LifelineHelpers.slugify(data.name);
    return `{
  id: "${id}",
  name: "${data.name || ""}",
  nameZh: "${data.nameZh || ""}",
  country: "${data.country || ""}",
  countryZh: "",
  countryId: "${data.countryId || ""}",
  adminRegion: "${data.adminRegion || ""}",
  adminRegionZh: "",
  regionId: "${data.regionId || ""}",
  lat: ${data.lat || 0},
  lng: ${data.lng || 0},
  labelPriority: "${data.labelPriority || "normal"}",
  visible: true,
  visits: []
}`;
  }

  function makeJourneyTemplate(data) {
    const id = `${data.from}-to-${data.to}-${data.year || "year"}`;
    return `{
  id: "${id}",
  from: "${data.from}",
  to: "${data.to}",
  year: "${data.year || ""}",
  label: "${data.label || ""}",
  visible: ${data.visible || "true"}
}`;
  }

  function makeVisitTemplate(place, data) {
    const id = `${place.id}-${window.LifelineHelpers.slugify(data.start)}-${window.LifelineHelpers.slugify(data.label || "visit")}`;
    return `{
  id: "${id}",
  start: "${data.start || ""}",
  end: "${data.end || ""}",
  label: "${data.label || ""}",
  note: "${data.note || ""}"
}`;
  }

  window.LifelinePanels = {
    renderCityCard,
    closeCityCard,
    openAddPanel,
    openVisitPanel
  };
})();
