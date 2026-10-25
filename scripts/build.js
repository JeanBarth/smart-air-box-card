const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.copyFileSync(
  path.join(root, "src", "smart-air-box-card.js"),
  path.join(root, "dist", "smart-air-box-card.js"),
);
