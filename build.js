const start_time = new Date();
const fs = require('fs-extra');
const { exec, spawn } = require("child_process");
const { start } = require("repl");

const chrome_manifest = JSON.parse(fs.readFileSync("./src/chrome/manifest.json").toString());

var firefox_manifest = JSON.parse(fs.readFileSync("./src/firefox/manifest.json").toString());

if (process.argv.includes("--copy") || process.argv.includes("--all")) {

    const src_files = fs.readdirSync("./src/chrome");

    if (chrome_manifest["version"] === firefox_manifest["version"]) {
        console.log("\x1b[33m%s\x1b[0m", "chrome manifest version not updated!");
    }

    // ! Confirm these files before building
    var excluded_files = ["manifest.json", ".git", "firefox", "word.js", "popup.js"];
    var exclusive_files = ["word.js", "popup.js"];

    for (file of src_files) {
        if (excluded_files.includes(file)) {
            continue;
        }
        fs.copySync("./src/chrome/" + file, "./src/firefox/" + file);
    }

    for (file of exclusive_files) {
        var chrome_js = fs.readFileSync("./src/chrome/" + file, { encoding: "utf-8" }).toString();
        var firefox_js = chrome_js.replace(/chrome/gm, "browser");
        fs.writeFileSync("./src/firefox/" + file, firefox_js);
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
        if (field == "action") {
            var actions = chrome_manifest[field];
            firefox_manifest["browser_action"] = {};
            for (action in actions) {
                firefox_manifest["browser_action"][action] = chrome_manifest[field][action];
            }
            continue;
        }
        firefox_manifest[field] = chrome_manifest[field];
    }

    fs.writeFileSync("./src/firefox/manifest.json", JSON.stringify(firefox_manifest, null, 2));

    console.log("updated firefox manifest using chrome manifest");

    if (process.argv.includes("--git") || process.argv.includes("--all")) {
        console.log("pushing synced directories to github");
        var package_shell = exec(`git.sh \"v${chrome_manifest["version"]} platform directory sync\"`);
    }
} else {
    console.log("skipped copying");
}

function end_message() {
    console.log("\x1b[36m%s\x1b[0m", "process finished in " + ((new Date() - start_time) / 1000) + " seconds");
}

if (process.argv.includes("--package") || process.argv.includes("--all")) {
    console.log("creating zip files");
    var package_shell = exec(`package.sh \"v${chrome_manifest["version"]}\"`);
    package_shell.on("exit", function () {
        console.log(`release ${chrome_manifest["version"]} created for chrome and firefox`);
        if (process.argv.includes("--git") || process.argv.includes("--all")) {
            console.log("committing and pushing changes");
            var package_shell = exec(`git.sh \"version v${chrome_manifest["version"]}\"`);
            package_shell.on("exit", function () {
                console.log(`committed and pushed ${chrome_manifest["version"]} to github`);
                end_message();
            })
        } else {
            console.log("skipping push to github");
            end_message();
        }
    })
} else {
    console.log("skipping zip files");
    end_message();
}