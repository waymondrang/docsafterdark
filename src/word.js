/////////////
// LOGGING //
/////////////

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, OFF: 4 };

class log {
    static currentLevel = LOG_LEVELS.DEBUG;

    static debug(...args) {
        if (this.currentLevel <= LOG_LEVELS.DEBUG) {
            console.debug("[DocsAfterDark][DEBG]", ...args);
        }
    }

    static info(...args) {
        if (this.currentLevel <= LOG_LEVELS.INFO) {
            console.info("[DocsAfterDark][INFO]", ...args);
        }
    }

    static warn(...args) {
        if (this.currentLevel <= LOG_LEVELS.WARN) {
            console.warn("[DocsAfterDark][WARN]", ...args);
        }
    }

    static error(...args) {
        if (this.currentLevel <= LOG_LEVELS.ERROR) {
            console.error("[DocsAfterDark][ERRO]", ...args);
        }
    }
}

///////////////
// NAMESPACE //
///////////////

let browser_namespace;

// Prefer "browser" namespace over "chrome"
if (typeof browser !== "undefined") {
    log.debug("Using 'browser' namespace");
    browser_namespace = browser;
} else if (typeof chrome !== "undefined") {
    log.debug("Using 'chrome' namespace");
    browser_namespace = chrome;
} else {
    throw new Error("Could not find browser namespace");
}

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

/**
 * Updates a storage object with a new key-value pair
 *
 * @param {String} storage_object
 * @param {String} key
 * @param {*} value
 */
function update_storage(storage_object, key, value) {
    browser_namespace.storage.local.get(storage_object, function (data) {
        if (data[storage_object] != null) data[storage_object][key] = value;
        else data[storage_object] = { [key]: value };

        browser_namespace.storage.local.set({
            [storage_object]: data[storage_object],
        });
    });
}

/**
 * Sets a storage object with a new value
 *
 * @param {String} storage_object
 * @param {*} value
 */
function set_storage(storage_object, value) {
    browser_namespace.storage.local.set({ [storage_object]: value });
}

class update_storage_batch {
    constructor(storage_object) {
        this.storage_object = storage_object;
        this.storage = {};
    }

    set_storage_object(storage_object) {
        this.storage_object = storage_object;

        return this;
    }

    /**
     * Set a key-value pair
     *
     * @param {String} key
     * @param {*} value
     */
    set(key, value) {
        this.storage[key] = value;

        return this;
    }

    /**
     * Saves the storage object
     */
    update() {
        log.debug(
            "UPDATING STORAGE: " +
                this.storage_object +
                " WITH: " +
                JSON.stringify(this.storage)
        );

        const that = this;

        browser_namespace.storage.local.get(
            this.storage_object,
            function (data) {
                if (data[that.storage_object] != null) {
                    for (let key in that.storage) {
                        data[that.storage_object][key] = that.storage[key];
                    }
                } else {
                    data[that.storage_object] = that.storage;
                }

                browser_namespace.storage.local.set({
                    [that.storage_object]: data[that.storage_object],
                });
            }
        );
    }
}

/**
 * Check if the current version is newer or equal to target version
 *
 * @param {String} current_version
 * @param {String} target_version
 * @returns {boolean}
 */
function is_newer_or_equal_version(current_version, target_version) {
    let current = current_version.split(".");
    let target = target_version.split(".");

    for (let i = 0; i < current.length; i++) {
        if (parseInt(current[i]) > parseInt(target[i])) {
            return true;
        } else if (parseInt(current[i]) < parseInt(target[i])) {
            return false;
        }
    }

    // If the loop has not yet returned, the current version is equal to the
    // target version.

    return true;
}

///////////////////////////
// END UTILITY FUNCTIONS //
///////////////////////////

const head =
    document.head ||
    document.getElementsByTagName("head")[0] ||
    document.documentElement;
const version = browser_namespace.runtime.getManifest().version;

const mode_off = 0;
const mode_light = 1;
const mode_dark = 2;

const dark_mode_normal = 0;
const dark_mode_eclipse = 1;

const default_accent_hue = 88; // Green hue
const default_background = "dark";
const default_dark_mode = { variant: dark_mode_normal };
const default_invert = { invert: true, grayscale: true, black: false };

const switch_on = "🌚";
const switch_off = "🌞";

const replacements_path = "assets/replacements/";
const css_path = "assets/css/";

const replacements = {
    "--checkmark": replacements_path + "checkmark.secondary.png",
    "--revisions-sprite1":
        replacements_path + "revisions_sprite1.secondary.svg",
    "--close_18px": replacements_path + "close_18px.svg",
    "--lens": replacements_path + "lens.svg",
    "--jfk_sprite186": replacements_path + "jfk_sprite186.edited.png",
    "--dimension_highlighted":
        replacements_path + "dimension-highlighted.edited.png",
    "--dimension_unhighlighted":
        replacements_path + "dimension-unhighlighted.edited.png",
    "--access_denied": replacements_path + "access_denied_transparent.png",
    "--access_denied_600":
        replacements_path + "access_denied_600_transparent.png",
    "--gm_add_black_24dp": replacements_path + "gm_add_black_24dp.png",
};

const document_inverted_value = "invert(1)";
const document_inverted_grayscale_value =
    "invert(1) contrast(79.5%) grayscale(100%)";
const document_inverted_black_value = "invert(1) grayscale(100%)";

const docsafterdark_page_border = "1px solid var(--primary-border-color)";

const update_link_href =
    "https://github.com/waymondrang/docsafterdark/releases";
const donation_link = "https://www.buymeacoffee.com/waymondrang";
const docsafterdark_version = browser_namespace.runtime.getManifest().version;

////////////////////////////////
// DOCUMENT BACKGROUND VALUES //
////////////////////////////////

const backgrounds = {
    default: "#ffffff",
    shade: "var(--secondary-background-color)",
    dark: "var(--root-background-color)",
    black: "#000000",
};

// TODO: Toggle invert if dark or black background is selected.

let mode;
let dark_mode_options;
let button_options;
let accent_color;
let toggle_state = false;

// Ensure that dark mode does not get enabled on Google Docs homepage
if (document.querySelector(".docs-homescreen-gb-container"))
    throw new Error("NOT ENABLING DOCSAFTERDARK ON GOOGLE DOCS HOMEPAGE");

function inject_css_file(file) {
    let file_id = "docsafterdark_" + file.replace(".", "_");

    if (document.querySelector("#" + file_id)) return;

    const css = document.createElement("link");
    css.setAttribute("href", browser_namespace.runtime.getURL(css_path + file));
    css.id = file_id;
    css.rel = "stylesheet";

    document.body.insertBefore(css, document.body.lastChild);
}

function remove_css_file(file) {
    let file_id = "docsafterdark_" + file.replace(".", "_");

    if (document.querySelector("#" + file_id))
        document.querySelector("#" + file_id).remove();
}

/**
 * Injects dark mode variant CSS
 *
 * @param {{ variant: number }} dark_mode
 */
function inject_dark_mode(dark_mode) {
    mode = mode_dark;

    remove_css_file("light.css");
    remove_css_file("dark_midnight.css");

    inject_css_file("docs.css");
    inject_css_file("dark_normal.css"); // Base dark mode

    if (dark_mode.variant == dark_mode_eclipse) {
        inject_css_file("dark_midnight.css");
        // Do not remove normal dark mode CSS
    }
}

/**
 * Injects light mode CSS
 */
function inject_light_mode() {
    mode = mode_light;

    remove_css_file("dark_midnight.css");
    remove_css_file("dark_normal.css");

    inject_css_file("docs.css");
    inject_css_file("light.css");
}

function remove_css_files() {
    remove_css_file("docs.css");
    remove_css_file("dark_midnight.css");
    remove_css_file("dark_normal.css");
    remove_css_file("light.css");
}

function remove_docsafterdark() {
    mode = mode_off;

    remove_css_files();

    if (document.querySelector("#docsafterdark_switch"))
        document.querySelector("#docsafterdark_switch").remove();
}

function button_callback(button) {
    if (toggle_state) {
        handle_mode(mode);

        toggle_state = false;
        button.textContent = switch_off;
    } else {
        remove_css_files();

        toggle_state = true;
        button.textContent = switch_on;
    }
}

function insert_button() {
    if (document.querySelector("#docsafterdark_switch")) return;

    let toggle_button = document.createElement("button");
    toggle_button.id = "docsafterdark_switch";
    toggle_button.textContent = switch_off;
    toggle_button.onclick = () => button_callback(toggle_button);

    document.body.insertBefore(toggle_button, document.body.lastChild);
}

/**
 * Handles button
 */
function handle_button() {
    if (button_options.show) {
        insert_button();
    } else {
        if (document.querySelector("#docsafterdark_switch"))
            document.querySelector("#docsafterdark_switch").remove();
    }

    document.documentElement.style.setProperty(
        "--docsafterdark-switch-position",
        button_options.raised ? "74px" : "24px"
    );
}

function update_accent_color(color) {
    accent_color = color;
    document.documentElement.style.setProperty(
        "--docsafterdark-accent-hue",
        color.hue
    );
}

function remove_accent_color() {
    document.documentElement.style.removeProperty("--docsafterdark-accent-hue");
}

/**
 * Handles mode and variant change
 *
 */
function handle_mode() {
    if (mode != mode_off && button_options && button_options.show)
        handle_button();

    if (mode == null) {
        // First invocation (which should not be called), enable deafult dark
        // mode by default.
        inject_dark_mode(default_dark_mode);
        set_storage("mode", mode_dark);
    } else if (mode == mode_dark) {
        inject_dark_mode(dark_mode_options);
    } else if (mode == mode_light) {
        inject_light_mode();
    } else {
        // Turn off DocsAfterDark
        remove_docsafterdark();
    }
}

/**
 * Handles document invert
 *
 * @param {{invert: boolean, grayscale: boolean, black: boolean}} invert
 */
function handle_document_invert(invert) {
    if (invert.invert) {
        if (invert.grayscale && invert.black) {
            document.documentElement.style.setProperty(
                "--docsafterdark_document_invert",
                document_inverted_black_value
            );
        } else if (invert.grayscale) {
            document.documentElement.style.setProperty(
                "--docsafterdark_document_invert",
                document_inverted_grayscale_value
            );
        } else {
            document.documentElement.style.setProperty(
                "--docsafterdark_document_invert",
                document_inverted_value
            );
        }
    } else {
        document.documentElement.style.setProperty(
            "--docsafterdark_document_invert",
            "none"
        );
    }
}

/////////////////
// ENTRY POINT //
/////////////////

// Set replacements
for (let [key, value] of Object.entries(replacements)) {
    document.documentElement.style.setProperty(
        key,
        "url(" + browser_namespace.runtime.getURL(value) + ")"
    );
}

let show_border;

browser_namespace.storage.local.get(
    [
        "mode",
        "dark_mode",
        "doc_bg",
        "custom_bg",
        "invert",
        "show_border",
        "accent_color",
        "button_options",
        "version",
        "updates", // Deprecated but kept for backwards capacity
        "raise_button", // Deprecated but kept for backwards capacity
    ],
    function (data) {
        //////////
        // MODE //
        //////////

        if (data.mode != null) {
            mode = data.mode;
        } else {
            // Set default mode
            mode = mode_dark;
            set_storage("mode", mode);
        }

        ///////////////////
        // MODE VARIANTS //
        ///////////////////

        if (data.dark_mode != null) {
            dark_mode_options = data.dark_mode;
        } else {
            // Set default dark mode options
            dark_mode_options = { variant: dark_mode_normal };
            set_storage("dark_mode", dark_mode_options);
        }

        /////////////////////////
        // DOCUMENT BACKGROUND //
        /////////////////////////

        if (data.doc_bg != null) {
            if (data.doc_bg == "custom") {
                document.documentElement.style.setProperty(
                    "--docsafterdark_document_background",
                    data.custom_bg
                );
            } else {
                if (backgrounds[data.doc_bg]) {
                    document.documentElement.style.setProperty(
                        "--docsafterdark_document_background",
                        backgrounds[data.doc_bg]
                    );
                } else {
                    log.error("Invalid background option");
                }
            }
        } else {
            // Set default background
            document.documentElement.style.setProperty(
                "--docsafterdark_document_background",
                backgrounds[default_background]
            );
            set_storage("doc_bg", default_background);
        }

        ////////////
        // INVERT //
        ////////////

        if (data.invert == null) {
            // Set default invert
            data.invert = default_invert;
            set_storage("invert", default_invert);
        }

        handle_document_invert(data.invert);

        /////////////////
        // SHOW BORDER //
        /////////////////

        if (data.show_border != null) {
            show_border = data.show_border;
        } else {
            show_border = true;
        }

        document.documentElement.style.setProperty(
            "--docsafterdark_document_border",
            show_border ? docsafterdark_page_border : "none"
        );

        //////////////////
        // ACCENT COLOR //
        //////////////////

        if (data.accent_color != null) {
            log.debug("FOUND SAVED ACCENT COLOR");
            accent_color = data.accent_color;
            update_accent_color(data.accent_color);
        } else {
            log.debug("NO SAVED ACCENT COLOR FOUND");
            // Set default accent color
            accent_color = { hue: default_accent_hue };
            update_accent_color(accent_color);

            // Save default accent color
            update_storage("accent_color", "hue", default_accent_hue);
        }

        log.debug("ACCENT COLOR:", accent_color);

        ////////////
        // BUTTON //
        ////////////

        // NOTE: Must be called before handle_mode
        // TODO: Use background worker to consolidate default options and option
        //       migration

        button_options = data.button_options;

        if (button_options == null) {
            // Check import raised button setting
            if (data.button_raised != null) {
                button_options = { show: true, raised: data.button_raised };
            } else {
                button_options = { show: true, raised: false };
            }

            set_storage("button_options", button_options);
        }

        ////////////////////
        // HANDLE VERSION //
        ////////////////////

        if (
            data.version == null ||
            data.version.last_version != docsafterdark_version
        ) {
            log.info(
                "DocsAfterDark has been updated to version " +
                    docsafterdark_version
            );

            ////////////////////////////////
            // CREATE UPDATE NOTIFICATION //
            ////////////////////////////////

            let update_notification = document.createElement("div");
            update_notification.id = "docsafterdark_update_notification";

            let update_container = document.createElement("div");
            update_container.id = "docsafterdark_update_container";
            update_notification.appendChild(update_container);

            let update_text = document.createElement("p");
            if (data.version == null && data.updates == null) {
                // If updates is not null, then not new install
                update_text.textContent =
                    "Thank you for installing DocsAfterDark! You can read release notes on ";
            } else {
                update_text.textContent =
                    "DocsAfterDark has been updated to version " +
                    docsafterdark_version +
                    ". Read release notes on ";
            }

            let update_link = document.createElement("a");
            update_link.href = update_link_href;
            update_link.target = "_blank";
            update_link.textContent = "GitHub";
            update_text.appendChild(update_link);
            update_text.appendChild(document.createTextNode("."));

            let close_button = document.createElement("button");
            close_button.textContent = "Close";
            close_button.onclick = function () {
                update_notification.remove();
            };
            update_text.appendChild(close_button);
            update_container.appendChild(update_text);

            document.body.prepend(update_notification);

            /////////////////////////////////////
            // ONE-TIME VERSION OPTION PATCHES //
            /////////////////////////////////////

            // if (
            //   data.version != null &&
            //   is_newer_or_equal_version(docsafterdark_version, "1.1.0") &&
            //   !is_newer_or_equal_version(data.version.last_version, "1.1.0")
            // ) {
            //   // Enable invert if document background is not default or custom
            //   if (data.doc_bg != "default" && data.doc_bg != "custom") {
            //     let batch = new update_storage_batch("invert");
            //     batch.set("invert", true).set("grayscale", true).update();
            //   }
            // }
        }

        update_storage("version", "last_version", docsafterdark_version);

        /////////////////////
        // INVOKE HANDLERS //
        /////////////////////

        handle_mode();
    }
);

////////////////////////////
// HANDLE STORAGE CHANGES //
////////////////////////////

browser_namespace.storage.onChanged.addListener(function (changes, area) {
    /////////////////////////
    // DOCUMENT BACKGROUND //
    /////////////////////////

    if (changes.doc_bg != null) {
        log.debug("BACKGROUND CHANGES", changes.doc_bg.newValue);

        if (changes.doc_bg.newValue != "custom") {
            if (backgrounds[changes.doc_bg.newValue] != null) {
                document.documentElement.style.setProperty(
                    "--docsafterdark_document_background",
                    backgrounds[changes.doc_bg.newValue]
                );
            } else {
                log.error("INVALID BACKGROUND OPTION");
            }
        } else {
            browser_namespace.storage.local.get(["custom_bg"], function (data) {
                document.documentElement.style.setProperty(
                    "--docsafterdark_document_background",
                    data.custom_bg
                );
            });
        }
    }

    // Handle custom background change. This differs from above because it is
    // only called when doc_bg is already set to "custom".

    if (changes.custom_bg != null) {
        document.documentElement.style.setProperty(
            "--docsafterdark_document_background",
            changes.custom_bg.newValue
        );
    }

    ////////////
    // INVERT //
    ////////////

    if (changes.invert != null) {
        log.debug("INVERT CHANGES", changes.invert.newValue);
        handle_document_invert(changes.invert.newValue);
    }

    //////////
    // MODE //
    //////////

    if (changes.mode != null) {
        mode = changes.mode.newValue;
    }

    ///////////////////////
    // DARK MODE VARIANT //
    ///////////////////////

    if (changes.dark_mode != null) {
        dark_mode_options = changes.dark_mode.newValue;
    }

    //////////////////
    // ACCENT COLOR //
    //////////////////

    if (changes.accent_color != null) {
        accent_color = changes.accent_color.newValue;
        update_accent_color(accent_color);
    }

    ////////////
    // BUTTON //
    ////////////

    // NOTE: Must be called before handle_mode

    if (changes.button_options != null) {
        button_options = changes.button_options.newValue;
        handle_button();
    }

    /////////////////
    // SHOW BORDER //
    /////////////////

    if (changes.show_border != null) {
        document.documentElement.style.setProperty(
            "--docsafterdark_document_border",
            changes.show_border.newValue ? docsafterdark_page_border : "none"
        );
    }

    /////////////////////
    // INVOKE HANDLERS //
    /////////////////////

    // Only handle mode if there are changes
    if (changes.mode != null || changes.dark_mode != null) {
        handle_mode();
    }
});

// Listen for messages from popup
browser_namespace.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type == "setAccentColor") {
            update_accent_color(request.color);
        }
    }
);
