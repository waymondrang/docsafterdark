import { Logger } from "./logger";
import {
    InvertMode,
    type BrowserAPI,
    type ExtensionData,
    type MessageListener,
    type StorageListener,
} from "./types";
import { SELECTOR_PREFIX, STYLE_PROPERTY_PREFIX } from "./values";

declare const browser: BrowserAPI;
declare const chrome: BrowserAPI;
const browser_ns = getBrowserNamespace();

/**
 * Returns the global namespace object used to access Web APIs
 */
function getBrowserNamespace(): BrowserAPI {
    let namespace;

    // Prefer "browser" namespace over "chrome"
    if (typeof browser !== "undefined") {
        namespace = browser;
    } else if (typeof chrome !== "undefined") {
        namespace = chrome;
    } else {
        throw new Error('Could not find "browser" or "chrome" namespace');
    }

    return namespace;
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

/**
 * Returns true if the current version is newer (or equal) to the target version
 */
function isVersionNewer(curr: string, target: string) {
    if (!target) {
        return true;
    }

    if (!curr) {
        return false;
    }

    const currSplit = curr.split(".");
    const targetSplit = target.split(".");
    const minLength = Math.min(currSplit.length, targetSplit.length);

    for (let i = 0; i < minLength; i++) {
        // In the case that a section of the version is empty (i.e. "5..1"),
        // that version will be automatically considered older than the other
        // version. In the event of a tie, the current version will be newer.

        if (!targetSplit[i]) {
            return true;
        }

        if (!currSplit[i]) {
            return false;
        }

        const currVal = parseInt(currSplit[i]!) || 0;
        const targetVal = parseInt(targetSplit[i]!) || 0;

        if (currVal > targetVal) {
            return true;
        } else if (currVal < targetVal) {
            return false;
        }
    }

    // If the loop has not yet returned, the current version is either equal
    // or greater than the target version.

    return true;
}

/**
 * Send message payload to active tabs in current window
 */
async function messageTabs<T>(message: T): Promise<void> {
    try {
        const tabs = await browser_ns.tabs.query({
            active: true,
            currentWindow: true,
        });

        await Promise.all(
            tabs
                .filter((tab) => tab.id !== undefined)
                .map((tab) => browser_ns.tabs.sendMessage<T>(tab.id!, message))
        );
    } catch (err: unknown) {
        Logger.debug("Could not message tabs:", err);
    }
}

function setStorage(update: Partial<ExtensionData>) {
    return browser_ns.storage.local.set(update) as Promise<void>;
}

/**
 * Gets storage items with the given key(s)
 */
function getStorage<T>(...keys: (keyof ExtensionData)[]): Promise<T> {
    return new Promise((resolve, reject) => {
        browser_ns.storage.local.get(keys).then(
            (result) => {
                resolve(result as T);
            },
            () => reject(browser_ns.runtime.lastError)
        );
    });
}

/**
 * Deletes storage items by key(s)
 */
function deleteStorage(...keys: (keyof ExtensionData)[]): Promise<void> {
    return browser_ns.storage.local.remove(keys) as Promise<void>;
}

function registerStorageListener(listener: StorageListener) {
    browser_ns.storage.onChanged.addListener(listener);
}

function hasStorageListener(listener: StorageListener) {
    return browser_ns.storage.onChanged.hasListener(listener);
}

function removeStorageListener(listener: StorageListener) {
    browser_ns.storage.onChanged.removeListener(listener);
}

// Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
function registerMessageListener(listener: MessageListener) {
    browser_ns.runtime.onMessage.addListener(listener);
}

function hasMessageListener(listener: MessageListener) {
    browser_ns.runtime.onMessage.hasListener(listener);
}

function removeMessageListener(listener: MessageListener) {
    browser_ns.runtime.onMessage.removeListener(listener);
}

async function getExtensionData(): Promise<ExtensionData> {
    let data = await getStorage<ExtensionData>(
        "mode",
        "dark_mode",
        "light_mode",
        "doc_bg",
        "custom_bg",
        "show_border",
        "accent_color",
        "button_options",
        "invert_enabled",
        "invert_mode",
        "version",
        // Deprecated
        "invert"
    );

    data = updateExtensionData(data);

    Logger.debug(data);

    return data;
}

function addClassToParent(element: HTMLElement, ...classes: string[]): void {
    if (!element.parentElement) {
        return;
    }

    element.parentElement.classList.add(...classes);
}

function removeClassFromParent(
    element: HTMLElement,
    ...classes: string[]
): void {
    if (!element.parentElement) {
        return;
    }

    element.parentElement.classList.remove(...classes);
}

function addClassToHTML(...classes: string[]): void {
    document.documentElement.classList.add(
        ...classes.map((c) => SELECTOR_PREFIX + c)
    );
}

function removeClassFromHTML(...classes: string[]): void {
    document.documentElement.classList.remove(
        ...classes.map((c) => SELECTOR_PREFIX + c)
    );
}

function isOnHomepage(): boolean {
    return document.querySelector(".docs-homescreen-gb-container") != null;
}

function getElementId(id: string): string {
    return (SELECTOR_PREFIX + id).replace(/\.| /g, "_");
}

function removeElement(id: string) {
    document.querySelector(`#${getElementId(id)}`)?.remove();
}

function getElement(id: string): HTMLElement | null {
    return document.querySelector(`#${getElementId(id)}`);
}

function hasElement(id: string): boolean {
    return document.querySelector(`#${getElementId(id)}`) != null;
}

/**
 * Inserts a stylesheet link element using non-prefixed id into the document
 * head. Remove using removeElement()
 */
function insertStylesheet(path: string, id: string): void {
    const elementId = getElementId(id);

    // Only one stylesheet should be inserted
    if (document.getElementById(elementId)) {
        return;
    }

    const link = document.createElement("link");
    link.id = elementId;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = getAssetURL(path);

    document.head.appendChild(link);
}

function getAssetURL(path: string): string {
    return browser_ns.runtime.getURL(path);
}

function isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
}

function updateExtensionData(data: ExtensionData): ExtensionData {
    if (data.invert != undefined) {
        data.invert_enabled = data.invert.invert;

        if (data.invert.black) {
            data.invert_mode = InvertMode.Black;
        } else {
            // If was previously using normal invert mode, convert to grayscale
            data.invert_mode = InvertMode.Gray;
        }

        deleteStorage("invert");
        delete data.invert;

        Logger.debug("Converted and deleted deprecated invert field");
    }

    return data;
}

export {
    getBrowserNamespace,
    setStyleProperty,
    isVersionNewer,
    setStorage,
    getStorage,
    deleteStorage,
    registerStorageListener,
    hasStorageListener,
    removeStorageListener,
    registerMessageListener,
    hasMessageListener,
    removeMessageListener,
    messageTabs,
    getExtensionData,
    addClassToParent,
    removeClassFromParent,
    addClassToHTML,
    removeClassFromHTML,
    isOnHomepage,
    getElementId,
    removeElement,
    hasElement,
    getElement,
    insertStylesheet,
    getAssetURL,
    isElementVisible,
    updateExtensionData,
};
