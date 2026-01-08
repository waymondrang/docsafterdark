import { Logger } from "./logger";
import { getBrowserNamespace, getStorage, setStorage } from "./util";

const browser = getBrowserNamespace();

enum ExtensionOperation {
    Off,
    LightMode,
    DarkMode,
}

enum DarkModeOperation {
    Normal,
    Eclipse,
}

const REPLACEMENTS_PATH = "assets/replacements/";
const CSS_PATH = "assets/css/";

// Do not run extension on Google Docs homepage
if (document.querySelector(".docs-homescreen-gb-container")) {
    Logger.debug("Not enabling on Google Docs homepage");
    throw new Error("Not enabling DocsAfterDark on Google Docs homepage");
}

function injectStylesheet(filename: string) {
    let file_id = "DocsAfterDark_" + filename.replace(".", "_");

    if (document.querySelector("#" + file_id)) return;

    const css = document.createElement("link");
    css.setAttribute("href", browser.runtime.getURL(CSS_PATH + filename));
    css.id = file_id;
    css.rel = "stylesheet";

    document.body.insertBefore(css, document.body.lastChild);
}

function applyDarkMode(darkMode: DarkModeOperation) {
    if (darkMode == DarkModeOperation.Eclipse) {
        // Instead of injecting another stylesheet change the HTML element
        // classes to control themeing
    }
}
