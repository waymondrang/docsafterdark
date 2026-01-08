enum ExtensionOperation {
    Off,
    LightMode,
    DarkMode,
}

enum DarkModeOperation {
    Normal,
    Eclipse,
}

enum LightModeOperation {
    Normal,
}

interface StorageData {
    mode?: ExtensionOperation;
    dark_mode?: DarkModeOperation;

    // NOTE: Currently there is no light mode operation, the light_mode field
    //       only exists to provide consistency with the other mode fields.

    light_mode?: LightModeOperation;

    // TODO: Add additional fields
}

export {
    ExtensionOperation,
    DarkModeOperation,
    LightModeOperation,
    type StorageData,
};
