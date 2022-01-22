const start_time = new Date();
const fs = require('fs-extra');
const { exec, spawn } = require("child_process");
const { start } = require("repl");

const src_files = fs.readdirSync("./src/chrome");
const chrome_manifest = JSON.parse(fs.readFileSync("./src/chrome/manifest.json").toString());

var firefox_manifest = JSON.parse(fs.readFileSync("./src/firefox/manifest.json").toString());

if (chrome_manifest["version"] === firefox_manifest["version"]) {
    console.log("\x1b[33m%s\x1b[0m", "chrome manifest version not updated!");
}

var excluded_files = ["manifest.json", ".git", "firefox"];

for (file of src_files) {
    if (excluded_files.includes(file)) {
        continue;
    }
    fs.copySync("./src/chrome/" + file, "./src/firefox/" + file);
}
console.log("finished copying " + src_files.length + " files from chrome into firefox directory");

var excluded_fields = ["manifest_version"];

for (field in chrome_manifest) {
    if (excluded_fields.includes(field)) {
        continue;
    }
    if (field === "web_accessible_resources") {
        var resources = chrome_manifest[field][0]["resources"];
        var new_resources = []
        for (resource of resources) {
            new_resources.push(resource);
        }
        firefox_manifest[field] = new_resources;
        continue;
    }
    firefox_manifest[field] = chrome_manifest[field];
}

fs.writeFileSync("./src/firefox/manifest.json", JSON.stringify(firefox_manifest, null, 2));

console.log("updated firefox manifest using chrome manifest");

if (process.argv.includes("--package")) {
    console.log("creating zip files");
    var package_shell = exec(`package.sh \"v${chrome_manifest["version"]}\"`);
    package_shell.on("exit", function () {
        console.log(`release ${chrome_manifest["version"]} created for chrome and firefox`);
    })
} else {
    console.log("skipping zip files");
}

if (process.argv.includes("--git")) {
    console.log("committing and pushing changes");
    var package_shell = exec(`git.sh \"v${chrome_manifest["version"]}\"`);
    package_shell.on("exit", function () {
        console.log(`committed and pushed ${chrome_manifest["version"]} to github`);
    })
} else {
    console.log("skipping push to github");
}

console.log("\x1b[36m%s\x1b[0m", "process finished in " + ((new Date() - start_time) / 1000) + " seconds");