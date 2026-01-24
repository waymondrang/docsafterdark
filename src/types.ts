// NOTE: Many of these types were not optimally designed but must be kept for
//       legacy reasons.
//
//       We could technically perform a migration simply by checking if the
//       old properties exist and use new names for them while preserving user
//       preferences...

///////////
// ENUMS //
///////////

enum ExtensionMode {
    Off = 0,
    Light = 1,
    Dark = 2,
}

enum DarkModeOperation {
    Normal = 0,
    Midnight = 1,
}

enum LightModeOperation {
    Normal = 0,
}

enum DocumentBackground {
    Default = "default",
    Shade = "shade",
    // "dark" is used in storage, "blend" is what the user selects
    Blend = "dark",
    Black = "black",
    Custom = "custom",
}

////////////////////
// STORAGE FIELDS //
////////////////////

interface DarkModeOptions {
    variant: DarkModeOperation;
}

interface LightModeOptions {
    variant: LightModeOperation;
}

interface InvertOptions {
    invert: boolean;
    grayscale: boolean;
    black: boolean;
}

interface AccentColorOptions {
    hue: number;
}

interface ButtonOptions {
    show: boolean;
}

interface VersionInfo {
    last_version: string;
}

////////////////////
// STORAGE SCHEMA //
////////////////////

type ExtensionData = {
    mode: ExtensionMode;
    dark_mode: DarkModeOptions;
    // NOTE: Currently there is no light mode operation, the light_mode field
    //       only exists to provide consistency with the other mode fields.
    light_mode: LightModeOptions;

    doc_bg: DocumentBackground;
    custom_bg: string;
    invert: InvertOptions;
    show_border: boolean;

    accent_color: AccentColorOptions;
    button_options: ButtonOptions;

    version: VersionInfo;

    // Deprecated fields (kept for backwards compatibility)
    // Very very few, if any, users will still use these fields.
    updates?: unknown;
    raise_button?: boolean;
};

///////////////////////////
// BROWSER EXTENSION API //
///////////////////////////

// Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageChange
type StorageChange<T> = {
    oldValue?: T;
    newValue?: T;
};

type StorageChanges = {
    // Use ?: over Partial<StorageChanges> because the changes will always
    // be partial, so having StorageChanges without optional fields would
    // be meaningless.
    [K in keyof ExtensionData]?: StorageChange<ExtensionData[K]>;
};

type StorageListener = (
    changes: StorageChanges,
    area: "sync" | "local" | "managed"
) => void;

interface MessagePayload {
    type: string;
    color: AccentColorOptions;
}

type MessageListener = (
    message: MessagePayload,
    sender: unknown,
    sendResponse: (payload: unknown) => void
) => void;

interface ListenerFunctions<T> {
    addListener(listener: T): void;
    removeListener(listener: T): void;
    hasListener(listener: T): boolean;
}

interface QueryInfo {
    active?: boolean;
    currentWindow?: boolean;
}

interface Tab {
    active: boolean;
    id?: number;
}

interface CreateProperties {
    url?: string;
}

// Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/
interface BrowserAPI {
    storage: {
        local: {
            set(data: Record<string, unknown>): Promise<void>;
            get(keys: string | string[]): Promise<Record<string, unknown>>;
            remove(keys: string | string[]): Promise<void>;
        };
        onChanged: ListenerFunctions<StorageListener>;
    };
    runtime: {
        lastError: Error;
        getManifest(): { version: string };
        getURL(path: string): string;
        onMessage: ListenerFunctions<MessageListener>;
    };
    tabs: {
        query(queryInfo: QueryInfo): Promise<Tab[]>;
        // Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/sendMessage
        sendMessage<T>(tabId: number, message: T): Promise<unknown>;
        create(properties: CreateProperties): void;
    };
}

export {
    ExtensionMode,
    DarkModeOperation,
    LightModeOperation,
    DocumentBackground,
    type ExtensionData,
    type DarkModeOptions,
    type LightModeOptions,
    type InvertOptions,
    type AccentColorOptions,
    type ButtonOptions,
    type VersionInfo,
    type BrowserAPI,
    type StorageChange,
    type StorageChanges,
    type StorageListener,
    type MessageListener,
    type MessagePayload,
};
