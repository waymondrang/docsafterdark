const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

class log {
    static info(...args) { console.log("[INFO]", ...args); }
    static warn(...args) { console.log("\x1b[33m%s\x1b[0m", "[WARN]", ...args); }
    static error(...args) { console.log("\x1b[31m%s\x1b[0m", "[ERROR]", ...args); }
    static success(...args) { console.log("\x1b[32m%s\x1b[0m", "[OKAY]", ...args); }
}

///////////////////
// CONFIGURATION //
///////////////////

// TODO: GENERATE V2 MANIFEST FROM V3 MANIFEST
const manifest_v3_file = "manifest.json";
const manifest_v2_file = "manifest_v2.json";

const global_special_files = [
    {
        file: "special*",
        include: false,
    },
    {
      file: "manifest*",
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
      {
        file: "manifest.json",
        include: true,
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
      {
        file: "manifest_v2.json",
        include: true,
        rename: "manifest.json",
      },
    ],
  }
];

const global_tests = [
  {
    name: "manifest_test",
    run: () => {
      const manifest_v3 = JSON.parse(fs.readFileSync(path.join(source_directory, manifest_v3_file)));
      const manifest_v2 = JSON.parse(fs.readFileSync(path.join(source_directory, manifest_v2_file)));

      if (manifest_v3.version !== manifest_v2.version) {
        log.error("manifest versions do not match!");
        process.exit(1);
      } else {
        log.success("manifest versions match");
      }
    },
  },
]

const releases_directory = "releases";
const source_directory = "src";
const manifest = JSON.parse(fs.readFileSync(path.join(source_directory, manifest_v3_file)));

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
    else log.warn("force packaging enabled, overwriting release");
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
    log.success(
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
        name: special_file[0].rename || file,
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

log.info(`running global tests`);

for (const test of global_tests) {
  log.info(`running test: ${test.name}`);
  test.run();
}

for (const release of releases) {
  generate_release(release);
}
