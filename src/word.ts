import { Logger } from "./logger";
import { replacements } from "./replacements";
import {
    DarkModeOperation,
    ExtensionOperation,
    LightModeOperation,
    type InitData,
} from "./types";
import { getBrowserNamespace, getStorage, setStorage } from "./util";

const browser = getBrowserNamespace();

let extensionOperation = ExtensionOperation.DarkMode;
let darkModeOperation = DarkModeOperation.Normal;
let lightModeOperation = LightModeOperation.Normal;

const REPLACEMENTS_PATH = "assets/replacements/";
const CSS_PATH = "assets/css/";
const ELEMENT_ID_PREFIX = "DocsAfterDark_";

// Do not run extension on Google Docs homepage
if (document.querySelector(".docs-homescreen-gb-container")) {
    Logger.debug("Not enabling on Google Docs homepage");
    throw new Error("Not enabling DocsAfterDark on Google Docs homepage");
}

function getElementId(id: string): string {
    return (ELEMENT_ID_PREFIX + id).replace(/\.|\ /g, "_");
}

function removeElement(id: string) {
    document.querySelector(`#${getElementId(id)}`)?.remove();
}

function appendStylesheet(filename: string) {
    const id = getElementId(filename);

    if (document.querySelector(`#${id}`)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = browser.runtime.getURL(CSS_PATH + filename);

    document.body.appendChild(link);
}

function updateDarkMode() {
    if (darkModeOperation == DarkModeOperation.Normal) {
    } else if (darkModeOperation == DarkModeOperation.Eclipse) {
        // Instead of injecting another stylesheet change the HTML element
        // classes to control themeing
    } else {
        throw new Error("Unknown dark mode operation: " + darkModeOperation);
    }
}

function updateLightMode() {
    if (lightModeOperation == LightModeOperation.Normal) {
    } else {
        throw new Error("Unknown light mode operation: " + lightModeOperation);
    }
}

function updateExtension() {
    if (extensionOperation == ExtensionOperation.DarkMode) {
        updateDarkMode();
    } else if (extensionOperation == ExtensionOperation.LightMode) {
        updateLightMode();
    } else if (extensionOperation == ExtensionOperation.Off) {
        removeExtension();
    } else {
        throw new Error("Unknown extension operation: " + extensionOperation);
    }
}

function removeExtension() {
    removeElement("docs.css");
    removeElement("button");
}

function setReplacementVariables() {
    for (let [key, value] of Object.entries(replacements)) {
        document.documentElement.style.setProperty(
            key,
            "url(" + browser.runtime.getURL(REPLACEMENTS_PATH + value) + ")"
        );
    }
}

/////////////////
// ENTRY POINT //
/////////////////

(async () => {
    Logger.info("Hello from DocsAfterDark!");

    const data = await getStorage<InitData>([
        "mode",
        "dark_mode",
        "doc_bg",
        "custom_bg",
        "invert",
        "show_border",
        "accent_color",
        "button_options",
        "version",
        "updates", // Deprecated, kept for backwards capacity
        "raise_button", // Deprecated, kept for backwards capacity
    ]);

    // NOTE: InitData is an incomplete type

    Logger.debug("Storage data:", data);

    await setStorage("mode", 99);
})();
