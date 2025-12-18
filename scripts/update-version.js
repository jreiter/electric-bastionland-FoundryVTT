#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const updateSystemJson = (version) => {
  const systemJsonPath = path.join(__dirname, "..", "system.json");
  const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, "utf8"));
  systemJson.version = version;
  systemJson.download =
    `https://github.com/jreiter/electric-bastionland-FoundryVTT/releases/` +
    `download/v${version}/electricbastionland.zip`;
  fs.writeFileSync(systemJsonPath, JSON.stringify(systemJson, null, 2) + "\n");
  console.log("Updated system.json");
};

const updatePackageJson = (version) => {
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  console.log("Updated package.json");
};

const versionFile = path.join(__dirname, "..", "version.txt");
const version = fs.readFileSync(versionFile, "utf8").trim();

console.log(`Updating to version ${version}...`);

updateSystemJson(version);
updatePackageJson(version);

console.log(`Version updated to ${version} successfully!`);
