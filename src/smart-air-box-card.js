const DEFAULTS = [
  { key: "co2_entity", entity: "sensor.smart_air_box_kohlendioxid", label: "Kohlendioxid (CO₂)" },
  { key: "formaldehyde_entity", entity: "sensor.smart_air_box_formaldehyd", label: "Formaldehyd" },
  { key: "vocs_entity", entity: "sensor.smart_air_box_vocs", label: "VOCs" },
];

const STYLE = `
  :host { display: block; }
  ha-card { padding: 20px; }
  h2 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 600; }
  .subtitle { color: var(--secondary-text-color); font-size: .9rem; margin-bottom: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 14px; }
  .panel { min-width: 0; padding: 14px; border: 1px solid var(--divider-color, #ddd); border-radius: 12px; }
  .label { font-size: .95rem; font-weight: 600; }
  .value { margin-top: 8px; font-size: 1.7rem; line-height: 1.25; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .unit { font-size: .9rem; color: var(--secondary-text-color); }
  .status { min-height: 1.3em; margin: 3px 0 12px; color: var(--secondary-text-color); font-size: .78rem; }
  .history { min-height: 150px; }
  .history > * { display: block; }
  .error { color: var(--error-color, #b00020); font-size: .85rem; }
`;

class SmartAirBoxCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._generation = 0;
    this._panels = [];
  }

  static getStubConfig() {
    return { type: "custom:smart-air-box-card" };
  }

  getCardSize() {
    return 6;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Smart Air Box: ungültige Kartenkonfiguration.");
    }
    const hours = config.hours_to_show === undefined ? 24 : Number(config.hours_to_show);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      throw new Error("Smart Air Box: hours_to_show muss zwischen 1 und 168 liegen.");
    }
    const sensors = DEFAULTS.map((item) => {
      const entity = config[item.key] ?? item.entity;
      if (typeof entity !== "string" || !/^sensor\.[a-z0-9_]+$/.test(entity)) {
        throw new Error(`Smart Air Box: ${item.key} muss eine Sensor-Entität sein.`);
      }
      return { ...item, entity };
    });
    this._config = {
      title: typeof config.title === "string" ? config.title : "Smart Air Box",
      hours,
      sensors,
    };
    this._render();
  }

  set hass(value) {
    this._hass = value;
    this._updateStates();
    for (const panel of this._panels) {
      if (panel.chart) panel.chart.hass = value;
    }
  }

  get hass() {
    return this._hass;
  }

  _render() {
    const generation = ++this._generation;
    this._panels = [];
    this.shadowRoot.replaceChildren();
    const style = document.createElement("style");
    style.textContent = STYLE;
    const card = document.createElement("ha-card");
    const title = document.createElement("h2");
    title.textContent = this._config.title;
    const subtitle = document.createElement("div");
    subtitle.className = "subtitle";
    subtitle.textContent = `Zeitverlauf · letzte ${this._config.hours} Stunden`;
    const grid = document.createElement("div");
    grid.className = "grid";

    for (const sensor of this._config.sensors) {
      const panel = document.createElement("section");
      panel.className = "panel";
      const label = document.createElement("div");
      label.className = "label";
      const name = document.createElement("span");
      name.textContent = sensor.label;
      label.append(name);
      const value = document.createElement("div");
      value.className = "value";
      const status = document.createElement("div");
      status.className = "status";
      const history = document.createElement("div");
      history.className = "history";
      panel.append(label, value, status, history);
      grid.append(panel);
      this._panels.push({ sensor, value, status, history, chart: null });
    }
    card.append(title, subtitle, grid);
    this.shadowRoot.append(style, card);
    this._updateStates();
    this._loadCharts(generation);
  }

  _updateStates() {
    for (const panel of this._panels) {
      const state = this._hass?.states?.[panel.sensor.entity];
      const valid = state && typeof state.state === "string" && state.state.trim() !== "" &&
        Number.isFinite(Number(state.state));
      panel.value.replaceChildren();
      panel.value.append(document.createTextNode(valid ? state.state : "—"));
      if (valid && state.attributes?.unit_of_measurement) {
        const unit = document.createElement("span");
        unit.className = "unit";
        unit.textContent = ` ${state.attributes.unit_of_measurement}`;
        panel.value.append(unit);
      }
      panel.status.textContent = !state ? "Entität nicht gefunden" : valid ? "Aktueller Wert" : "Aktuell nicht verfügbar";
    }
  }

  async _loadCharts(generation) {
    try {
      const helpers = await window.loadCardHelpers();
      if (generation !== this._generation) return;
      for (const panel of this._panels) {
        const chart = helpers.createCardElement({
          type: "history-graph",
          entities: [panel.sensor.entity],
          hours_to_show: this._config.hours,
          show_names: false,
        });
        panel.history.replaceChildren(chart);
        panel.chart = chart;
        if (this._hass) chart.hass = this._hass;
      }
    } catch (_error) {
      if (generation !== this._generation) return;
      for (const panel of this._panels) {
        panel.history.textContent = "Zeitverlauf konnte nicht geladen werden.";
        panel.history.classList.add("error");
      }
    }
  }
}

if (!customElements.get("smart-air-box-card")) {
  customElements.define("smart-air-box-card", SmartAirBoxCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "smart-air-box-card")) {
  window.customCards.push({
    type: "smart-air-box-card",
    name: "Smart Air Box",
    description: "CO₂, Formaldehyd und VOCs mit eigenen Zeitverläufen",
  });
}
