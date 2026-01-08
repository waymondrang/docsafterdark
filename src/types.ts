// NOTE: Many of these types were not optimally designed but must be kept for
//       legacy reasons.
//
//       We could technically perform a migration simply by checking if the
//       old properties exist and use new names for them while preserving user
//       preferences...

///////////
// ENUMS //
///////////

enum ExtensionOperation {
    Off = 0,
    LightMode = 1,
    DarkMode = 2,
}

enum DarkModeOperation {
    Normal = 0,
    Eclipse = 1,
}

enum LightModeOperation {
    Normal = 0,
}

enum DocumentBackground {
    Default = "default",
    Shade = "shade",
    Dark = "dark",
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

interface AccentColor {
    hue: number;
}

interface ButtonOptions {
    show: boolean;
    raised: boolean;
}

interface VersionInfo {
    last_version: string;
}

////////////////////
// STORAGE SCHEMA //
////////////////////

interface StorageData {
    mode?: ExtensionOperation;
    dark_mode?: DarkModeOptions;
    // NOTE: Currently there is no light mode operation, the light_mode field
    //       only exists to provide consistency with the other mode fields.
    light_mode?: LightModeOptions;

    doc_bg?: DocumentBackground | string;
    custom_bg?: string;
    invert?: InvertOptions;
    show_border?: boolean;

    accent_color?: AccentColor;
    button_options?: ButtonOptions;

    version?: VersionInfo;

    // Deprecated fields (kept for backwards compatibility)
    // Very very few, if any, users will still use these fields.
    updates?: any;
    raise_button?: boolean;
}

export {
    ExtensionOperation,
    DarkModeOperation,
    LightModeOperation,
    DocumentBackground,
    type StorageData,
    type DarkModeOptions,
    type LightModeOptions,
    type InvertOptions,
    type AccentColor,
    type ButtonOptions,
    type VersionInfo,
};
