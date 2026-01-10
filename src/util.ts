interface BrowserAPI {
    storage: {
        local: {
            set(data: Record<string, unknown>): Promise<void>;
            get(keys: string[]): Promise<Record<string, unknown>>;
        };
    };
    runtime: {
        lastError: Error;
        getManifest(): { version: string };
        getURL(path: string): string;
    };
}

declare const browser: BrowserAPI;
declare const chrome: BrowserAPI;

/**
 * Returns the global namespace object used to access Web APIs
 */
function getBrowserNamespace() {
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
 * Sets a storage object with a new value
 */
function setStorage(key: string, value: unknown): Promise<void> {
    return getBrowserNamespace().storage.local.set({
        [key]: value,
    }) as Promise<void>;
}

function setStorageBatch(data: Record<string, unknown>) {
    return getBrowserNamespace().storage.local.set(data) as Promise<void>;
}

/**
 * Gets storage objects with the given key(s)
 */
function getStorage<T>(keys: string[]): Promise<T> {
    return new Promise((resolve, reject) => {
        const browser = getBrowserNamespace();

        browser.storage.local.get(keys).then(
            (result) => {
                resolve(result as T);
            },
            () => reject(browser.runtime.lastError)
        );
    });
}

export {
    getBrowserNamespace,
    isVersionNewer,
    setStorage,
    setStorageBatch,
    getStorage,
};
