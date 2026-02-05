import {
    buttonPosition,
    defaultExtensionData,
    documentBackgroundStyles,
    documentBorder,
    documentInvert,
    enabledClass,
    links,
    replacements,
    themeClasses,
} from "./values";
import { Logger } from "./logger";
import {
    DarkModeOperation,
    DocumentBackground,
    ExtensionMode,
    InvertMode,
    LightModeOperation,
    type AccentColorOptions,
    type ExtensionData,
    type MessageListener,
    type StorageListener,
} from "./types";
import {
    addClassToHTML,
    getAssetURL,
    getBrowserNamespace,
    getElement,
    getElementId,
    getExtensionData,
    insertStylesheet,
    isElementVisible,
    isOnHomepage,
    registerMessageListener,
    registerStorageListener,
    removeClassFromHTML,
    removeElement,
    setStorage,
    setStyleProperty,
    getDocumentID,
} from "./util";

const browser_ns = getBrowserNamespace();
const CURRENT_VERSION = browser_ns.runtime.getManifest().version;

const REPLACEMENTS_PATH = "assets/replacements/";

class DocsAfterDark {
    private extensionData: ExtensionData = defaultExtensionData;
    private isTempDisabled: boolean = false;

    async initialize(): Promise<void> {
        Logger.info("Hello from DocsAfterDark!");

        const data = await getExtensionData();

        // Update extensionData with saved data (or use default values)

        if (data.disabled_documents !== undefined) {
            this.extensionData.disabled_documents = data.disabled_documents;
        }
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

        if (data.invert_enabled !== undefined) {
            this.extensionData.invert_enabled = data.invert_enabled;
        }

        if (data.invert_mode !== undefined) {
            this.extensionData.invert_mode = data.invert_mode;
        }

        if (data.button_options !== undefined) {
            this.extensionData.button_options = data.button_options;
        }

        if (data.show_border !== undefined) {
            this.extensionData.show_border = data.show_border;
        }

        // Uncomment to always show the update notification
        if (data.version !== undefined) {
            this.extensionData.version = data.version;
        }

        Logger.debug(this.extensionData);

        // Run functions that aren't dependent on extension data
        this.replaceStyleURLs();
        this.registerMetricWidgetWatcher();

        this.updateExtension();

        // Save the storage data to persist the default settings
        await setStorage(this.extensionData);

        registerStorageListener(this.handleStorageUpdate);
        registerMessageListener(this.handleMessageUpdate);
    }

    private raiseButton(raise: boolean) {
        if (raise) {
            setStyleProperty("buttonPosition", buttonPosition.raised);
        } else {
            setStyleProperty("buttonPosition", buttonPosition.normal);
        }
    }

    private registerMetricWidgetWatcher() {
        // NOTE: We cannot assume that the document metrics widget will always
        //       exist in the DOM.

        let currMetricsWidget: HTMLDivElement | null;
        let attributeObserver: MutationObserver | null;
        let prevIsVisible: boolean = false;

        const reset = () => {
            if (attributeObserver != null) {
                attributeObserver.disconnect();
            }

            attributeObserver = null;
            currMetricsWidget = null;
        };

        const handleMutation = () => {
            const metricsWidget = document.querySelector(
                ".kix-documentmetrics-widget"
            ) as HTMLDivElement;

            if (metricsWidget == null) {
                reset();
                return;
            }

            const isVisible = isElementVisible(metricsWidget);

            if (metricsWidget !== currMetricsWidget) {
                reset();

                currMetricsWidget = metricsWidget;

                attributeObserver = new MutationObserver(handleMutation);
                attributeObserver.observe(currMetricsWidget, {
                    attributes: true,
                    attributeFilter: ["style", "class"],
                });
            }

            if (isVisible !== prevIsVisible) {
                prevIsVisible = isVisible;
                this.raiseButton(prevIsVisible);
            }
        };

        this.raiseButton(false);
        handleMutation();

        const elementObserver = new MutationObserver(handleMutation);
        elementObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    private handleMessageUpdate: MessageListener = (message) => {
        Logger.debug("Update via message:", message);

        if (message.type == "setAccentColor") {
            this.extensionData.accent_color =
                message.color as AccentColorOptions;
        }

        if (message.type == "setDocumentEnabled") {
            if (!message.enabled) {           
                this.removeExtension();
            }
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
            changes.invert_enabled !== undefined &&
            changes.invert_enabled.newValue !== undefined
        ) {
            this.extensionData.invert_enabled = changes.invert_enabled.newValue;
        }

        if (
            changes.invert_mode !== undefined &&
            changes.invert_mode.newValue !== undefined
        ) {
            this.extensionData.invert_mode = changes.invert_mode.newValue;
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
    //       operation. Vice versa for updateLightMode().

    private updateDarkMode() {
        if (this.extensionData.dark_mode.variant === DarkModeOperation.Normal) {
            addClassToHTML(themeClasses.dark, themeClasses.normal);
        } else if (
            this.extensionData.dark_mode.variant === DarkModeOperation.Midnight
        ) {
            addClassToHTML(themeClasses.dark, themeClasses.midnight);
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
            addClassToHTML(themeClasses.light, themeClasses.normal);
        } else {
            throw new Error(
                "Unknown light mode operation: " +
                    this.extensionData.light_mode.variant
            );
        }
    }

    private async updateExtension() {
        // Always update version, regardless of extension mode
        this.updateVersion();

        // Do not continue if this document is disabled
        // We have to pull extensiondata for this again; this will cause a performance hit
        // Currently this does not propagate On -> Off to other tabs
        var newExtensionData = await getExtensionData();
        if (newExtensionData.disabled_documents.indexOf(getDocumentID(window.location.href), 0) > -1) {
            Logger.debug('updateExtension called but document is in disabled list');
            return;
        }

        // Do not continue update if extension is off
        if (!this.updateMode()) {
            return;
        }

        this.updateDocumentBackground();
        this.updateDocumentInvert();
        this.updateDocumentBorder();
        this.updateAccentColor();
        this.updateButton();
    }

    private updateMode(): boolean {
        this.resetMode();

        if (this.extensionData.mode === ExtensionMode.Off) {
            this.removeExtension();
            return false;
        }

        this.isTempDisabled = false;

        addClassToHTML(enabledClass);
        insertStylesheet("docs.bundle.css", "stylesheet");

        if (this.extensionData.mode === ExtensionMode.Dark) {
            this.updateDarkMode();
        } else if (this.extensionData.mode === ExtensionMode.Light) {
            this.updateLightMode();
        } else {
            throw new Error(
                "Unknown extension operation: " + this.extensionData.mode
            );
        }

        return true;
    }

    private resetMode(): void {
        removeClassFromHTML(...Object.values(themeClasses));
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
        if (!this.extensionData.invert_enabled) {
            setStyleProperty("documentInvert", documentInvert.off);
            return;
        }

        switch (this.extensionData.invert_mode) {
            case InvertMode.Gray:
                setStyleProperty("documentInvert", documentInvert.grayscale);
                break;
            case InvertMode.Black:
                setStyleProperty("documentInvert", documentInvert.black);
                break;
            case InvertMode.Colorful:
                setStyleProperty("documentInvert", documentInvert.colorful);
                break;
            case InvertMode.Normal:
                setStyleProperty("documentInvert", documentInvert.normal);
                break;
            default:
                break;
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

    private buttonCallback(event: MouseEvent) {
        // The button will temporarily set the extension to be off (unload
        // the stylesheet).

        const button = event.currentTarget as HTMLButtonElement;

        if (this.isTempDisabled) {
            insertStylesheet("docs.bundle.css", "stylesheet");
            button.classList.remove("enabled");
        } else {
            removeElement("stylesheet");
            button.classList.add("enabled");
        }

        this.isTempDisabled = !this.isTempDisabled;
    }

    private createButton(): HTMLButtonElement {
        const existingButton = getElement("button");
        if (existingButton) {
            return existingButton as HTMLButtonElement;
        }

        const button = document.createElement("button");
        button.id = getElementId("button");
        button.onclick = (event) => this.buttonCallback(event);

        const buttonFill = document.createElement("div");
        buttonFill.classList.add("fill");
        button.appendChild(buttonFill);

        document.body.prepend(button);

        return button;
    }

    private updateButton() {
        if (this.extensionData.button_options.show) {
            const button = this.createButton();

            // NOTE: We do not need to add "enabled" here because that is
            //       triggered by a button click, not an update. isTempDisabled
            //       is independent from the extensionData state.

            if (!this.isTempDisabled) {
                button.classList.remove("enabled");
            }
        } else {
            removeElement("button");
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

        // extensionData.version will never be null, so the old condition does
        // not work.

        if (this.extensionData.version.last_version == "") {
            textElement.textContent =
                "Thank you for installing DocsAfterDark! Read release notes on ";
        } else {
            textElement.textContent =
                "DocsAfterDark has been updated to version " +
                CURRENT_VERSION +
                ". Read release notes on ";
        }
        messageElement.appendChild(textElement);

        const linkElement = document.createElement("a");
        linkElement.href = links.update;
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
                "url(" + getAssetURL(REPLACEMENTS_PATH + value) + ")"
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
        removeClassFromHTML(enabledClass);
        removeElement("stylesheet");
        removeElement("button");
    }
}

/////////////////
// ENTRY POINT //
/////////////////

(async () => {
    if (isOnHomepage()) {
        Logger.debug("On Google Docs homepage, will not enable DocsAfterDark.");
        return;
    }

    const extension = new DocsAfterDark();
    extension.initialize();
})();
