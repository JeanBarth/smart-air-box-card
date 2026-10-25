const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Element {
  constructor() {
    this.children = [];
    this.attributes = {};
    this.classList = { add: (value) => { this.className = value; } };
    this.style = { setProperty() {} };
    this.textContent = "";
  }
  attachShadow() { this.shadowRoot = new Element(); return this.shadowRoot; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}

function makeCard() {
  const elements = new Map();
  const chartConfigs = [];
  const context = {
    HTMLElement: Element,
    document: {
      createElement: () => new Element(),
      createTextNode: (text) => ({ textContent: text }),
    },
    customElements: {
      get: (name) => elements.get(name),
      define: (name, ctor) => elements.set(name, ctor),
    },
    window: {
      loadCardHelpers: async () => ({ createCardElement: (config) => {
        chartConfigs.push(config);
        return new Element();
      } }),
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "smart-air-box-card.js"), "utf8");
  vm.runInNewContext(source, context);
  return { card: new (elements.get("smart-air-box-card"))(), chartConfigs };
}

test("shows entity values and their own units, including unavailable states", async () => {
  const { card, chartConfigs } = makeCard();
  card.setConfig({});
  card.hass = { states: {
    "sensor.smart_air_box_kohlendioxid": { state: "783", attributes: { unit_of_measurement: "ppm" } },
    "sensor.smart_air_box_formaldehyd": { state: "unavailable", attributes: { unit_of_measurement: "µg/m³" } },
    "sensor.smart_air_box_vocs": { state: "0.24", attributes: { unit_of_measurement: "mg/m³" } },
  } };
  await new Promise(setImmediate);
  assert.equal(card._panels[0].value.children[0].textContent, "783");
  assert.equal(card._panels[0].value.children[1].textContent, " ppm");
  assert.equal(card._panels[1].value.children[0].textContent, "—");
  assert.equal(card._panels[1].status.textContent, "Aktuell nicht verfügbar");
  assert.equal(card._panels[2].value.children[1].textContent, " mg/m³");
  assert.equal(chartConfigs.length, 3);
  assert.deepEqual(Array.from(chartConfigs[0].entities), ["sensor.smart_air_box_kohlendioxid"]);
  assert.deepEqual(Array.from(chartConfigs[1].entities), ["sensor.smart_air_box_formaldehyd"]);
  assert.deepEqual(Array.from(chartConfigs[2].entities), ["sensor.smart_air_box_vocs"]);
  assert.equal(chartConfigs[0].hours_to_show, 24);
});

test("rejects invalid configuration and identifies a missing entity", () => {
  const { card } = makeCard();
  assert.throws(() => card.setConfig({ hours_to_show: 0 }), /hours_to_show/);
  assert.throws(() => card.setConfig({ co2_entity: "light.test" }), /co2_entity/);
  card.setConfig({ hours_to_show: 48 });
  card.hass = { states: {} };
  assert.equal(card._panels[0].status.textContent, "Entität nicht gefunden");
});
