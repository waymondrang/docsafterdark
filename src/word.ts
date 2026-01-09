import {
    buttonPosition,
    documentBackgrounds,
    documentBorder,
    documentInvert,
    replacements,
    updateLink,
} from "./values";
import { Logger } from "./logger";
import {
    DarkModeOperation,
    DocumentBackground,
    ExtensionOperation,
    LightModeOperation,
    type InvertOptions,
    type StorageData,
} from "./types";
import { getBrowserNamespace, getStorage, setStorageBatch } from "./util";

const browser = getBrowserNamespace();
const CURRENT_VERSION = browser.runtime.getManifest().version;

const REPLACEMENTS_PATH = "assets/replacements/";
const CSS_PATH = "assets/css/";
const ELEMENT_ID_PREFIX = "DocsAfterDark_";
const STYLE_PROPERTY_PREFIX = "--DocsAfterDark_";

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

/**
 * Sets the CSS property onto the html element's style declaration
 * @param property Name of property without --DocsAfterDark_ prefix
 */
function setStyleProperty(property: string, value: string) {
    document.documentElement.style.setProperty(
        STYLE_PROPERTY_PREFIX + property,
        value
    );
}

class DocsAfterDark {
    private extensionData: StorageData = {
        mode: ExtensionOperation.DarkMode,
        dark_mode: { variant: DarkModeOperation.Normal },
        light_mode: { variant: LightModeOperation.Normal },

        doc_bg: DocumentBackground.Dark,
        custom_bg: "",

        accent_color: { hue: 88 },
        invert: {
            invert: true,
            grayscale: true,
            black: true,
        },
        button_options: {
            show: true,
            raised: false,
        },

        show_border: true,

        version: {
            last_version: "",
        },
    };

    async initialize(): Promise<void> {
        const data = await this.getExtensionData();

        // Update extensionData with saved data (or use default values)

        if (data.mode !== undefined) {
            this.extensionData.mode = data.mode;
        }
        if (data.dark_mode !== undefined) {
            this.extensionData.dark_mode = data.dark_mode;
        }
        if (data.light_mode !== undefined) {
            this.extensionData.light_mode = data.light_mode;
        }

        if (data.doc_bg !== undefined) {
            this.extensionData.doc_bg = data.doc_bg;
        }
        if (data.custom_bg !== undefined) {
            this.extensionData.custom_bg = data.custom_bg;
        }

        if (data.accent_color !== undefined) {
            this.extensionData.accent_color = data.accent_color;
        }
        if (data.invert !== undefined) {
            this.extensionData.invert = data.invert;
        }
        if (data.button_options !== undefined) {
            this.extensionData.button_options = data.button_options;
        }

        if (data.show_border !== undefined) {
            this.extensionData.show_border = data.show_border;
        }

        if (data.version !== undefined) {
            this.extensionData.version = data.version;
        }

        Logger.debug(this.extensionData);

        this.updateExtension();

        // Save the storage data to persist the default settings
        this.saveExtensionData();
    }

    private async saveExtensionData(): Promise<void> {
        await setStorageBatch(this.extensionData);
    }

    private getExtensionData(): Promise<Partial<StorageData>> {
        return getStorage<Partial<StorageData>>([
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
        if (this.extensionData.dark_mode.variant === DarkModeOperation.Normal) {
            // TODO: Apply normal dark mode
        } else if (
            this.extensionData.dark_mode.variant === DarkModeOperation.Eclipse
        ) {
            // Instead of injecting another stylesheet change the HTML element
            // classes to control themeing
        } else {
            throw new Error(
                "Unknown dark mode operation: " +
                    this.extensionData.dark_mode.variant
            );
        }
    }

    private updateLightMode() {
        if (
            this.extensionData.light_mode.variant === LightModeOperation.Normal
        ) {
            // TODO: Apply normal light mode
        } else {
            throw new Error(
                "Unknown light mode operation: " +
                    this.extensionData.light_mode.variant
            );
        }
    }

    private updateExtension() {
        // Do not continue update if extension is off
        if (!this.updateMode()) {
            return;
        }

        this.updateVersion();

        this.updateDocumentBackground();
        this.updateDocumentInvert();
        this.updateDocumentBorder();
        this.updateAccentColor();
        this.updateButton();
    }

    private updateMode(): boolean {
        if (this.extensionData.mode === ExtensionOperation.DarkMode) {
            this.updateDarkMode();
        } else if (this.extensionData.mode === ExtensionOperation.LightMode) {
            this.updateLightMode();
        } else if (this.extensionData.mode === ExtensionOperation.Off) {
            this.removeExtension();
            return false;
        } else {
            throw new Error(
                "Unknown extension operation: " + this.extensionData.mode
            );
        }

        return true;
    }

    private updateDocumentBackground() {
        if (this.extensionData.doc_bg == DocumentBackground.Custom) {
            setStyleProperty(
                "documentBackground",
                this.extensionData.custom_bg ?? ""
            );
        } else {
            setStyleProperty(
                "documentBackground",
                documentBackgrounds[this.extensionData.doc_bg]
            );
        }
    }

    private updateDocumentInvert() {
        const invertOptions: InvertOptions = this.extensionData.invert;

        if (invertOptions.grayscale && invertOptions.black) {
            setStyleProperty("documentInvert", documentInvert.invert);
        } else if (invertOptions.grayscale) {
            setStyleProperty("documentInvert", documentInvert.grayscale);
        } else if (invertOptions.black) {
            setStyleProperty("documentInvert", documentInvert.black);
        } else {
            setStyleProperty("documentInvert", documentInvert.off);
        }
    }

    private updateDocumentBorder() {
        if (this.extensionData.show_border) {
            setStyleProperty("documentBorder", documentBorder.border);
        } else {
            setStyleProperty("documentBorder", documentBorder.off);
        }
    }

    private updateAccentColor() {
        setStyleProperty(
            "accentHue",
            this.extensionData.accent_color.hue.toString()
        );
    }

    private updateButton() {
        if (this.extensionData.button_options.show) {
            // TODO: Check if button is inserted

            if (this.extensionData.button_options.raised) {
                setStyleProperty("buttonPosition", buttonPosition.raised);
            } else {
                setStyleProperty("buttonPosition", buttonPosition.normal);
            }
        } else {
            // TODO: Remove button
        }
    }

    private showUpdateNotification() {
        const notificationElement = document.createElement("div");
        notificationElement.id = getElementId("updateNotification");

        const containerElement = document.createElement("div");
        containerElement.classList.add("container");
        notificationElement.appendChild(containerElement);

        const textElement = document.createElement("p");
        if (
            this.extensionData.version == null &&
            this.extensionData.updates == null
        ) {
            // If updates is not null, then not new install
            textElement.textContent =
                "Thank you for installing DocsAfterDark! You can read release notes on ";
        } else {
            textElement.textContent =
                "DocsAfterDark has been updated to version " +
                CURRENT_VERSION +
                ". Read release notes on ";
        }

        const linkElement = document.createElement("a");
        linkElement.href = updateLink;
        linkElement.target = "_blank";
        linkElement.textContent = "GitHub";

        textElement.appendChild(linkElement);
        textElement.appendChild(document.createTextNode("."));

        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.onclick = function () {
            notificationElement.remove();
        };

        textElement.appendChild(closeButton);
        containerElement.appendChild(textElement);
        document.body.prepend(notificationElement);
    }

    private updateVersion() {
        if (this.extensionData.version.last_version != CURRENT_VERSION) {
            Logger.info("Updated to version: " + CURRENT_VERSION);
            this.showUpdateNotification();
            this.extensionData.version.last_version = CURRENT_VERSION;
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
