import { existsSync, readFileSync, createWriteStream, mkdirSync } from "fs";
import { resolve, join } from "path";
import archiver from "archiver";

////////////
// CONFIG //
////////////

const CONFIG = {
    extensionName: "DocsAfterDark",
    manifestPath: "build/manifest.json",
    buildDir: "build",
    releaseDir: "release",
    ignoreFiles: ["**/.DS_Store"],
};

/////////////
// LOGGING //
/////////////

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, OFF: 4 };

// ANSI color codes
const COLORS = {
    reset: "\x1b[0m",

    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    strikethrough: "\x1b[9m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    grey: "\x1b[90m",
};

class Logger {
    static currentLevel = LOG_LEVELS.DEBUG;

    static debug(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.DEBUG) {
            console.debug(`${COLORS.gray}[DEBG]${COLORS.reset}`, ...args);
        }
    }

    static info(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.INFO) {
            console.info(`${COLORS.reset}[INFO]`, ...args);
        }
    }

    // step() is a type of info()
    static step(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.INFO) {
            console.info(`${COLORS.blue}>`, ...args);
        }
    }

    static warn(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.WARN) {
            console.warn(`${COLORS.yellow}[WARN]${COLORS.reset}`, ...args);
        }
    }

    static error(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.ERROR) {
            console.error(`${COLORS.red}[ERRO]${COLORS.reset}`, ...args);
        }
    }
}

function getManifest(): Manifest {
    const manifestPath = resolve(CONFIG.manifestPath);
    if (!existsSync(manifestPath)) {
        Logger.error(`Manifest file not found at: ${manifestPath}`);
        process.exit(1);
    }

    const manifestContent = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent) as Manifest;

    if (!manifest.version) {
        Logger.error("Version not found in manifest.json");
        process.exit(1);
    }

    return manifest;
}

function getZipFileName(version: string): string {
    return `${CONFIG.extensionName}_${version}.zip`;
}

function getZipFilePath(version: string): string {
    return join(resolve(CONFIG.releaseDir), getZipFileName(version));
}

///////////////
// PACKAGING //
///////////////

interface Manifest {
    version: string;
    [key: string]: unknown;
}

async function packageExtension(
    manifest: Manifest,
    force: boolean = false
): Promise<void> {
    try {
        ///////////////////
        // READ MANIFEST //
        ///////////////////

        Logger.step("Processing manifest.json");

        const version = manifest.version;

        const zipFilePath = getZipFilePath(version);
        const zipFileName = getZipFileName(version);

        Logger.info(`Manifest version: ${version}`);

        ///////////////
        // BUILD DIR //
        ///////////////

        const buildDir = resolve(CONFIG.buildDir);
        if (!existsSync(buildDir)) {
            Logger.error(`Build directory not found at: ${buildDir}`);
            process.exit(1);
        }

        //////////////////////
        // EXISTING PACKAGE //
        //////////////////////

        // Sanity check, do not print step

        const packageExists = existsSync(zipFilePath);

        if (packageExists && !force) {
            Logger.warn(
                `Package already exists: ${zipFilePath}. Use --force flag to overwrite existing package.`
            );
            process.exit(2);
        }

        if (packageExists && force) {
            Logger.info(`Overwriting existing package: ${zipFilePath}`);
        }

        //////////////
        // ZIPEYYY! //
        //////////////

        Logger.step(`Packaging extension to: ${zipFilePath}`);

        if (!existsSync(CONFIG.releaseDir)) {
            mkdirSync(CONFIG.releaseDir, { recursive: true });
            Logger.info(`Created release directory: ${CONFIG.releaseDir}`);
        }

        // Use Promise to wait for archiver to finish
        // See: https://www.npmjs.com/package/archiver
        await new Promise<void>((resolve, reject) => {
            const output = createWriteStream(zipFilePath);
            const archive = archiver("zip", {
                zlib: { level: 9 },
            });

            output.on("close", () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                Logger.info(
                    `Package created successfully: ${zipFileName} (${sizeInMB} MB)`
                );
                resolve();
            });

            archive.on("error", (err) => {
                Logger.error("Error creating archive:", err);
                reject(err);
            });

            archive.on("warning", (err) => {
                if (err.code === "ENOENT") {
                    Logger.warn("Archive warning:", err);
                } else {
                    reject(err);
                }
            });

            archive.pipe(output);
            archive.directory(buildDir, false, (entry) => {
                // Check if file is ignored
                for (const pattern of CONFIG.ignoreFiles) {
                    const glob = pattern
                        .replace(/\*\*/g, ".*")
                        .replace(/\*/g, "[^/]*");
                    const regex = new RegExp(glob);

                    if (regex.test(entry.name)) {
                        return false;
                    }
                }

                return entry;
            });
            archive.finalize();
        });

        Logger.step("Packaging completed successfully!");
    } catch (error) {
        Logger.error("Packaging failed:", error);
        process.exit(1);
    }
}

//////////
// MAIN //
//////////

const args = process.argv.slice(2);
const withForce = args.includes("--force") || args.includes("-f");

// NOTE: Passing args from npm run build -- only works if package.ts is the
//       last command in the script.

const manifest = getManifest();

packageExtension(manifest, withForce);
