const fs = require("fs");
const { exec, spawn } = require("child_process");

var src_files = fs.readdirSync("./src/chrome");

var excluded_files = ["manifest.json", ".git", "firefox"];

for (file of src_files) {
    if (excluded_files.includes(file)) {
        continue;
    }
    fs.copyFileSync("./src/chrome/" + file, "./src/firefox/" + file);
}
console.log("finished copying chrome files into firefox")

const chrome_manifest = JSON.parse(fs.readFileSync("./src/chrome/manifest.json").toString());

var firefox_manifest = JSON.parse(fs.readFileSync("./src/firefox/manifest.json").toString());

var excluded_fields = ["manifest_version", "web_accessible_resources"];

for (field in chrome_manifest) {
    if (excluded_fields.includes(field)) {
        continue;
    }
    firefox_manifest[field] = chrome_manifest[field];
}

fs.writeFileSync("./src/firefox/manifest.json", JSON.stringify(firefox_manifest, null, 2));

console.log("updated firefox manifest using chrome manifest");

console.log("creating zip files");

var package_shell = exec(`package.sh \"v${chrome_manifest["version"]}\"`);

package_shell.on("exit", function () {
    console.log(`release ${chrome_manifest["version"]} created for chrome and firefox`);
})