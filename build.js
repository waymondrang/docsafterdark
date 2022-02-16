var ogl = console.log;
var log = function () {
    a = [];
    a.push(`[${new Date().toLocaleTimeString()}][info] \t`);
    for (var i = 0; i < arguments.length; i++) {
        a.push(arguments[i]);
    }
    ogl.apply(console, a);
};

log_d = function () {
    if (!config.debug) return;
    a = [];
    a.push(`[${new Date().toLocaleTimeString()}][info] \t`);
    for (var i = 0; i < arguments.length; i++) {
        a.push(arguments[i]);
    }
    ogl.apply(console, a);
};

var log_w = function () {
    a = [];
    a.push("\x1b[33m" + `[${new Date().toLocaleTimeString()}][warn] \t`);
    a.push(...arguments);
    a.push("\x1b[0m")
    ogl.apply(console, a);
};

log("\x1b[32m" + "initializing extensionbuilder™ by waymondrang" + "\x1b[0m");

const start_time = new Date();
const fs = require('fs-extra');
const { exec, execSync } = require("child_process");
const config = require("./build_config.json");

process.on("exit", function (code) {
    log("\x1b[36m" + "process exited in " + ((new Date() - start_time) / 1000) + " seconds with code " + code + "\x1b[0m");
})

var source_manifest = JSON.parse(fs.readFileSync(config.source.directory + "/" + "manifest.json").toString());

const force_mode = process.argv.includes("--ignore") || process.argv.includes("--force");
const will_package = process.argv.includes("--all") || process.argv.includes("--package");
const will_copy = process.argv.includes("--copy") || process.argv.includes("--all");
const will_git = process.argv.includes("--git") || process.argv.includes("--all");
const version_exists = fs.existsSync(`${config.release_directory}/${config.project_name_short}_v${source_manifest.version}_${config.source.platform}.zip`);
const browser_platforms = ["firefox"];
const chrome_platforms = ["chrome", "opera", "edge"];
const manifest_ignore = ["manifest_version"];

var targets = config.targets;

//* validation

if (version_exists) {
    log_w("packaged version already exists!");
    if (config["enforce_version_control"] && will_package && !force_mode) process.exit(99);
}

log_d(config.debug ? "debug mode " : "" +
    will_copy ? "will copy " : "" +
        will_package ? "will package " : "" +
            will_git ? "will git " : "" +
                version_exists ? "version exists " : "" +
                    force_mode ? "force mode " : "");

if (!fs.existsSync(config.release_directory) || !fs.statSync(config.release_directory).isDirectory()) {
    log("creating release directory " + config.release_directory);
    fs.mkdirSync(config.release_directory);
    log("created release directory " + config.release_directory);
}

//* manifest updates should happen here

log("updating " + targets.map(e => e.platform).join(", ") + " manifests using " + config.source.platform + " manifest");

var cleaned;

for (field in source_manifest) {
    if (!source_manifest[field] ||
        Array.isArray(source_manifest[field]) ? !source_manifest[field].length : false ||
            typeof source_manifest[field] === 'object' ? !Object.keys(source_manifest[field]).length : false) {
        log_w(field + " field is empty");
        if (config.clean_manifest) {
            delete source_manifest[field];
            log("cleaned field " + field);
            cleaned = true;
        }
    }
}

if (config.clean_manifest && cleaned) {
    fs.writeFileSync(config.source.directory + "/manifest.json", JSON.stringify(source_manifest, null, 2));
    log("wrote cleaned manifest to source file");
}

for (var target of targets) {
    log_d("checking if target directory " + target.directory + " exists");
    if (!fs.existsSync(target.directory) || !fs.statSync(target.directory).isDirectory()) {
        log("creating target directory " + target.directory);
        fs.mkdirSync(target.directory);
        log("created target directory " + target.directory);
    }
    log_d("creating manifest for " + target.platform);
    target.manifest = { manifest_version: target.manifest_version };
    for (field in source_manifest) {
        log_d("processing " + field + " field for " + target.platform + " manifest");
        if (manifest_ignore.includes(field)) {
            continue;
        }
        if (source_manifest.manifest_version == 3 && target.manifest_version == 2) {
            if (field == "web_accessible_resources") {
                target.manifest[field] = source_manifest[field][0].resources;
                continue;
            }
            if (field == "action") {
                target.manifest.browser_action = source_manifest.action;
                continue;
            }
        }
        target.manifest[field] = source_manifest[field];
    }
    log_d("writing manifest.json to " + target.directory + "/manifest.json");
    fs.writeFileSync(target.directory + "/manifest.json", JSON.stringify(target.manifest, null, 2));
}

log("updated " + targets.map(e => e.platform).join(", ") + " manifests using " + config.source.platform + " manifest");

if (will_copy) {
    log("syncing files between " + config.source.platform + " and " + targets.map(e => e.platform).join(", ") + " directories");
    for (var target of targets) {
        var files = fs.readdirSync(config.source.directory);
        for (var file of files) {
            if (fs.statSync(config.source.directory + "/" + file).isDirectory()) {
                log_d("expanding directory " + config.source.directory + "/" + file);
                var directory_files = fs.readdirSync(config.source.directory + "/" + file);
                files.push(...directory_files.map(e => file + "/" + e));
                continue;
            }
            if (file.includes("manifest.json")) {
                log_d("skipping manifest file");
                continue;
            }
            if (!target.patch || !target.patch.includes(file)) {
                log_d("copying " + (file.length > 30 ? file.substring(0, 30) + "..." : file) + " to " + target.directory + "/" + (file.length > 30 ? file.substring(0, 30) + "..." : file));
                fs.copySync(config.source.directory + "/" + file, target.directory + "/" + file);
            } else {
                log_d("processing " + file);
                var source_file = fs.readFileSync(config.source.directory + "/" + file, { encoding: "utf-8" }).toString();
                var target_file;
                if (config.source.platform == "chrome") {
                    if (source_manifest.manifest_version == 3 && target.manifest_version == 2) {
                        target_file = browser_platforms.includes(target.platform) ? source_file
                            .replace(/chrome\.action/gm, "browser.browserAction")
                            .replace(/chrome\./gm, "browser\.") :
                            source_file
                                .replace(/chrome\.action/gm, "chrome.browserAction");
                    } else if (source_manifest.manifest_version == 2 && target.manifest_version == 3) {
                        log("bump manifest version not yet supported");
                        process.exit(1);
                    } else {
                        log("manifest is equal, skipping parsing for file " + file);
                        target_file = browser_platforms.includes(target.platform) ? source_file
                            .replace(/chrome\./gm, "browser\.") :
                            source_file;
                    }
                } else {
                    log("platform not yet supported for directory sync");
                    process.exit(1);
                }
                fs.writeFileSync(target.directory + "/" + file, target_file);
                log_d("finished processing " + file);
            }
        }
        log_d("finished copying " + files.length + " files from " + config.source.platform + " into " + target.platform + " directory");
    }
    log("synced files between " + config.source.platform + " and " + targets.map(e => e.platform).join(", ") + " directories");
    if (will_git) {
        log("pushing synced directories to github");
        execSync(`git.sh \"${config.git_messages.directory_sync}\"`);
    }
} else {
    log("skipped copying files");
}

if (will_package) {
    log(`packaging ${source_manifest.version} for ` + targets.map(e => e.platform).join(", ") + " & " + config.source.platform);
    var packages = targets;
    packages.push(config.source);
    for (var package of packages) {
        execSync(`package.sh \"v${source_manifest.version}\" \"${config.project_name_short}\" \"${package.platform}\" \"${package.directory}\" \"${config.release_directory}\"`);
        log(`packaged ${source_manifest.version} for ` + package.platform);
    }
    if (will_git) {
        log("pushing completed packages to github");
        execSync(`git.sh \"${config.git_messages.packages}\"`);
    }
} else {
    log("skipping zipping files");
}