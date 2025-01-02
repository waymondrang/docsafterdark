const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

class log {
    static info(...args) { console.log("[INFO]", ...args); }
    static warn(...args) { console.log("\x1b[33m%s\x1b[0m", "[WARN]", ...args); }
    static error(...args) { console.log("\x1b[31m%s\x1b[0m", "[ERROR]", ...args); }
}

///////////////////
// CONFIGURATION //
///////////////////

const global_special_files = [
    {
        file: "special*",
        include: false,
    },
];

const releases = [
  {
    browser: "chrome",
    special_files: [
      {
        file: "special_chrome.css",
        include: true,
        rename: "special.css",
      },
    ],
  },
  {
    browser: "firefox",
    special_files: [
      {
        file: "special_firefox.css",
        include: true,
        rename: "special.css",
      },
    ],
  }
];

const releases_directory = "releases";
const source_directory = "src";
const manifest_file = "manifest.json";
const manifest = JSON.parse(fs.readFileSync(path.join(source_directory, manifest_file)));

const force_package = process.argv.includes("--force") || process.argv.includes("-f");

/**
 * generate a release
 * 
 * @param {{browser: string, special_files: {file: string, include: boolean, rename?: string}[]}} release
 */
function generate_release(release) {
  log.info(`generating ${release.browser} v${manifest.version} release`);

  const release_name = `docsafterdark_v${manifest.version}_${release.browser}.zip`;

  // check if release already exists
  if (fs.existsSync(path.join(releases_directory, release_name))) {
    log.warn(
      `${release.browser} v${manifest.version} release already exists in \"${releases_directory}\"!`
    );

    if (!force_package) return;
    else log.info("force packaging enabled, overwriting release");
  }

  // ensure releases directory exists
  if (!fs.existsSync(releases_directory)) {
    log.info("creating release directory: ", releases_directory);
    fs.mkdirSync(releases_directory);
  }

  // create a file to stream archive data to
  const output = fs.createWriteStream(
    path.join(releases_directory, release_name)
  );

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  // listen for all archive data to be written
  output.on("close", function () {
    log.info(
      `${release_name} (${archive.pointer()} bytes) has been packaged into \"${releases_directory}\"`
    );
  });

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      log.warn(err);
    } else {
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });

  // pipe archive data to the file
  archive.pipe(output);

  // get a recursive list of files in the source directory
  const files = fs.readdirSync(source_directory, { recursive: true });

  for (const file of files) {
    // find special files
    var special_file = release.special_files.filter(
      (special_file) => special_file.include && file.match(special_file.file)
    );

    // add renamed special files
    if (special_file.length > 0) {
      archive.file(path.join(source_directory, file), {
        name: file.replace(special_file[0].file, special_file[0].rename),
      });
      continue;
    }

    // skip global filtered files
    if (
      global_special_files
        .filter((special_file) => !special_file.include)
        .some((special_file) => file.match(special_file.file))
    ) {
      continue;
    }

    archive.file(path.join(source_directory, file), { name: file });
  }

  // finalize the archive
  archive.finalize();
}

for (const release of releases) {
  generate_release(release);
}
