import { Logger } from "./logger";
import { replacements } from "./replacements";
import {
    DarkModeOperation,
    ExtensionOperation,
    LightModeOperation,
    type StorageData,
} from "./types";
import { getBrowserNamespace, getStorage, setStorage } from "./util";

const browser = getBrowserNamespace();

const REPLACEMENTS_PATH = "assets/replacements/";
const CSS_PATH = "assets/css/";
const ELEMENT_ID_PREFIX = "DocsAfterDark_";

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

function updateDarkMode(operation: DarkModeOperation) {
    if (operation === DarkModeOperation.Normal) {
        // TODO: Apply normal dark mode
    } else if (operation === DarkModeOperation.Eclipse) {
        // Instead of injecting another stylesheet change the HTML element
        // classes to control themeing
    } else {
        throw new Error("Unknown dark mode operation: " + operation);
    }
}

function updateLightMode(operation: LightModeOperation) {
    if (operation === LightModeOperation.Normal) {
        // TODO: Apply normal light mode
    } else {
        throw new Error("Unknown light mode operation: " + operation);
    }
}

function updateExtension(
    operation: ExtensionOperation,
    darkMode: DarkModeOperation,
    lightMode: LightModeOperation
) {
    if (operation === ExtensionOperation.DarkMode) {
        updateDarkMode(darkMode);
    } else if (operation === ExtensionOperation.LightMode) {
        updateLightMode(lightMode);
    } else if (operation === ExtensionOperation.Off) {
        removeExtension();
    } else {
        throw new Error("Unknown extension operation: " + operation);
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

    // Do not run extension on Google Docs homepage
    if (document.querySelector(".docs-homescreen-gb-container")) {
        Logger.debug("Not enabling on Google Docs homepage");
        return;
    }

    const data = await getStorage<StorageData>([
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

    let extensionOperation = data.mode ?? ExtensionOperation.DarkMode;
    let darkModeOperation = data.dark_mode ?? DarkModeOperation.Normal;
    let lightModeOperation = data.light_mode ?? LightModeOperation.Normal;

    updateExtension(extensionOperation, darkModeOperation, lightModeOperation);

    // NOTE: InitData is an incomplete type

    Logger.debug("Storage data:", data);

    await setStorage("mode", 99);
})();
