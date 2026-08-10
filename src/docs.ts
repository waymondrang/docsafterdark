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
    insertEphemeralScript,
    insertStylesheet,
    isElementVisible,
    isOnHomepage,
    registerMessageListener,
    registerStorageListener,
    removeClassFromHTML,
    removeElement,
    setStorage,
    setStyleProperty,
} from "./util";

const browserNamespace = getBrowserNamespace();

const CURRENT_VERSION = browserNamespace.runtime.getManifest().version;
const REPLACEMENTS_PATH = "assets/replacements/";

class DocsAfterDark {
    private extensionData: ExtensionData = defaultExtensionData;
    private isTempDisabled: boolean = false;

    async initialize(): Promise<void> {
        Logger.info("Hello from DocsAfterDark!");

        const data = await getExtensionData();
        this.extensionData = { ...this.extensionData, ...data };

        // DEBUG: Uncomment to always show the update notification
        // this.extensionData.version = defaultExtensionData.version;

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

    private updateCanvas() {
        if (this.extensionData.mode == ExtensionMode.Dark) {
            insertEphemeralScript("canvas.bundle.js");
        } else {
            this.restoreCanvas();
        }
    }

    private restoreCanvas() {
        Logger.debug("Restoring canvas rendering functions");
        // TODO: Create and run canvas restoration script
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

        this.updateExtension();
    };

    private handleStorageUpdate: StorageListener = (changes) => {
        Logger.debug("Update via storage:", changes);

        // Hold updated keys and values in an object for easy updating
        const updates: Partial<ExtensionData> = {};

        for (const [key, value] of Object.entries(changes)) {
            if (value.newValue !== undefined) {
                Object.assign(updates, { [key]: value.newValue });
        }
        }

        this.extensionData = { ...this.extensionData, ...updates };

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

    private updateExtension() {
        // Always update
        this.updateVersion(); // Always show update notification
        this.updateCanvas(); // Always update canvas rendering

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
        linkElement.href = links.release(CURRENT_VERSION); // Link to specific release via tag
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
        this.restoreCanvas();
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
