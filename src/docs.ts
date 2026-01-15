import {
    buttonPosition,
    defaultExtensionData,
    documentBackgroundStyles,
    documentBorder,
    documentInvert,
    replacements,
    themeClasses,
    updateLink,
} from "./values";
import { Logger } from "./logger";
import {
    DarkModeOperation,
    DocumentBackground,
    ExtensionOperation,
    LightModeOperation,
    type AccentColorOptions,
    type ExtensionData,
    type InvertOptions,
    type MessageListener,
    type StorageListener,
} from "./types";
import {
    getBrowserNamespace,
    getExtensionData,
    registerMessageListener,
    registerStorageListener,
    setStorageBatch,
    setStyleProperty,
} from "./util";

const browser = getBrowserNamespace();
const CURRENT_VERSION = browser.runtime.getManifest().version;

const REPLACEMENTS_PATH = "assets/replacements/";
const ELEMENT_ID_PREFIX = "DocsAfterDark_";

function getElementId(id: string): string {
    return (ELEMENT_ID_PREFIX + id).replace(/\.| /g, "_");
}

function removeElement(id: string) {
    document.querySelector(`#${getElementId(id)}`)?.remove();
}

class DocsAfterDark {
    private extensionData: ExtensionData = defaultExtensionData;

    async initialize(): Promise<void> {
        Logger.debug("Hello from DocsAfterDark!");

        const data = await getExtensionData();

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

        // Set CSS replacement URLs
        this.replaceStyleURLs();

        this.updateExtension();

        // Save the storage data to persist the default settings
        await setStorageBatch(this.extensionData);

        registerStorageListener(this.handleStorageUpdate);
        registerMessageListener(this.handleMessageUpdate);
    }

    private handleMessageUpdate: MessageListener = (message) => {
        Logger.debug("Update via message:", message);

        if (message.type == "setAccentColor") {
            this.extensionData.accent_color =
                message.color as AccentColorOptions;
        }

        this.updateExtension();
    };

    private handleStorageUpdate: StorageListener = (changes) => {
        Logger.debug("Update via storage:", changes);

        //////////
        // MODE //
        //////////

        // NOTE: Do not early stop if new mode is off because the state of the
        //       extension should still be synced (other variables must be
        //       updated).

        if (changes.mode !== undefined && changes.mode.newValue !== undefined) {
            this.extensionData.mode = changes.mode.newValue;
        }

        ///////////////////////
        // DARK MODE VARIANT //
        ///////////////////////

        if (
            changes.dark_mode !== undefined &&
            changes.dark_mode.newValue !== undefined
        ) {
            this.extensionData.dark_mode = changes.dark_mode.newValue;
        }

        ////////////////////////
        // LIGHT MODE VARIANT //
        ////////////////////////

        if (
            changes.light_mode !== undefined &&
            changes.light_mode.newValue !== undefined
        ) {
            this.extensionData.light_mode = changes.light_mode.newValue;
        }

        /////////////////////////
        // DOCUMENT BACKGROUND //
        /////////////////////////

        if (
            changes.doc_bg !== undefined &&
            changes.doc_bg.newValue !== undefined
        ) {
            this.extensionData.doc_bg = changes.doc_bg.newValue;
        }

        ////////////////////////////////
        // CUSTOM DOCUMENT BACKGROUND //
        ////////////////////////////////

        if (
            changes.custom_bg !== undefined &&
            changes.custom_bg.newValue !== undefined
        ) {
            this.extensionData.custom_bg = changes.custom_bg.newValue;
        }

        ////////////
        // INVERT //
        ////////////

        if (
            changes.invert !== undefined &&
            changes.invert.newValue !== undefined
        ) {
            this.extensionData.invert = changes.invert.newValue;
        }

        //////////////////
        // ACCENT COLOR //
        //////////////////

        if (
            changes.accent_color !== undefined &&
            changes.accent_color.newValue !== undefined
        ) {
            this.extensionData.accent_color = changes.accent_color.newValue;
        }

        ////////////
        // BUTTON //
        ////////////

        if (
            changes.button_options !== undefined &&
            changes.button_options.newValue !== undefined
        ) {
            this.extensionData.button_options = changes.button_options.newValue;
        }

        ////////////
        // BORDER //
        ////////////

        if (
            changes.show_border !== undefined &&
            changes.show_border.newValue !== undefined
        ) {
            this.extensionData.show_border = changes.show_border.newValue;
        }

        this.updateExtension();
    };

    // NOTE: When this function is called, the extension will be in DarkMode
    //       operation.

    private updateDarkMode() {
        if (this.extensionData.dark_mode.variant === DarkModeOperation.Normal) {
            document.documentElement.classList.add(
                themeClasses.dark,
                themeClasses.normal
            );
        } else if (
            this.extensionData.dark_mode.variant === DarkModeOperation.Midnight
        ) {
            document.documentElement.classList.add(
                themeClasses.dark,
                themeClasses.midnight
            );
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
            document.documentElement.classList.add(
                themeClasses.light,
                themeClasses.normal
            );
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
        this.resetMode();

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

    private resetMode(): void {
        document.documentElement.classList.remove(
            ...Object.values(themeClasses)
        );
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
                documentBackgroundStyles[this.extensionData.doc_bg]
            );
        }
    }

    private updateDocumentInvert() {
        const invertOptions: InvertOptions = this.extensionData.invert;

        if (!invertOptions.invert) {
            setStyleProperty("documentInvert", documentInvert.off);
            return;
        }

        if (invertOptions.black) {
            setStyleProperty("documentInvert", documentInvert.black);
        } else if (invertOptions.grayscale) {
            setStyleProperty("documentInvert", documentInvert.grayscale);
        } else {
            setStyleProperty("documentInvert", documentInvert.invert);
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

    showUpdateNotification() {
        // Remove existing updateNotification, if exists
        removeElement("updateNotification");

        const notificationElement = document.createElement("div");
        notificationElement.id = getElementId("updateNotification");

        const containerElement = document.createElement("div");
        containerElement.classList.add("container");
        notificationElement.appendChild(containerElement);

        ///////////////////////
        // MESSAGE CONTAINER //
        ///////////////////////

        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        containerElement.appendChild(messageElement);

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
        messageElement.appendChild(textElement);

        const linkElement = document.createElement("a");
        linkElement.href = updateLink;
        linkElement.target = "_blank";
        linkElement.textContent = "GitHub";

        textElement.appendChild(linkElement);
        textElement.appendChild(document.createTextNode("."));

        ////////////////////////////
        // CLOSE BUTTON CONTAINER //
        ////////////////////////////

        const closeElement = document.createElement("div");
        closeElement.classList.add("close");
        containerElement.appendChild(closeElement);

        const closeButton = document.createElement("button");
        closeButton.id = "closeButton";
        closeButton.onclick = function () {
            notificationElement.remove();
        };
        closeElement.appendChild(closeButton);

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttribute("height", "24px");
        svg.setAttribute("viewBox", "0 -960 960 960");
        svg.setAttribute("width", "24px");
        svg.setAttribute("fill", "#e3e3e3");
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );
        path.setAttribute(
            "d",
            "m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
        );
        svg.appendChild(path);
        closeButton.appendChild(svg);

        document.body.prepend(notificationElement);
    }

    private replaceStyleURLs() {
        for (const [key, value] of Object.entries(replacements)) {
            setStyleProperty(
                key,
                "url(" + browser.runtime.getURL(REPLACEMENTS_PATH + value) + ")"
            );
        }
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
