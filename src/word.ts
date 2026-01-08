import { Logger } from "./logger";
import { replacements } from "./replacements";
import {
    DarkModeOperation,
    ExtensionOperation,
    LightModeOperation,
    type StorageData,
} from "./types";
import { getBrowserNamespace, getStorage, setStorageBatch } from "./util";

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

function setReplacementVariables() {
    for (let [key, value] of Object.entries(replacements)) {
        document.documentElement.style.setProperty(
            key,
            "url(" + browser.runtime.getURL(REPLACEMENTS_PATH + value) + ")"
        );
    }
}

class DocsAfterDark {
    private extensionOperation = ExtensionOperation.DarkMode;
    private darkModeOperation = DarkModeOperation.Normal;
    private lightModeOperation = LightModeOperation.Normal;

    async initialize(): Promise<void> {
        const data = await this.getStorageData();

        this.extensionOperation = data.mode ?? this.extensionOperation;
        this.darkModeOperation =
            data.dark_mode?.variant ?? this.darkModeOperation;
        this.lightModeOperation =
            data.light_mode?.variant ?? this.lightModeOperation;

        Logger.debug(data);

        this.updateExtension();

        // Save the storage data to persist the default settings
        this.saveStorageData();
    }

    private async saveStorageData(): Promise<void> {
        const data: StorageData = {
            mode: this.extensionOperation,
            dark_mode: { variant: this.darkModeOperation },
            light_mode: { variant: this.lightModeOperation },
        };

        await setStorageBatch(data);
    }

    private getStorageData(): Promise<StorageData> {
        return getStorage<StorageData>([
            "mode",
            "dark_mode",
            "light_mode",
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
    }

    private updateDarkMode() {
        if (this.darkModeOperation === DarkModeOperation.Normal) {
            // TODO: Apply normal dark mode
        } else if (this.darkModeOperation === DarkModeOperation.Eclipse) {
            // Instead of injecting another stylesheet change the HTML element
            // classes to control themeing
        } else {
            throw new Error(
                "Unknown dark mode operation: " + this.darkModeOperation
            );
        }
    }

    private updateLightMode() {
        if (this.lightModeOperation === LightModeOperation.Normal) {
            // TODO: Apply normal light mode
        } else {
            throw new Error(
                "Unknown light mode operation: " + this.lightModeOperation
            );
        }
    }

    private updateExtension() {
        if (this.extensionOperation === ExtensionOperation.DarkMode) {
            this.updateDarkMode();
        } else if (this.extensionOperation === ExtensionOperation.LightMode) {
            this.updateLightMode();
        } else if (this.extensionOperation === ExtensionOperation.Off) {
            this.removeExtension();
        } else {
            throw new Error(
                "Unknown extension operation: " + this.extensionOperation
            );
        }
    }

    private removeExtension() {
        removeElement("docs.css");
        removeElement("button");
    }
}

/////////////////
// ENTRY POINT //
/////////////////

(async () => {
    const extension = new DocsAfterDark();
    extension.initialize();
})();
