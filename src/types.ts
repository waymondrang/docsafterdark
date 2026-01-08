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

interface InitData {
    mode?: ExtensionOperation;
    dark_mode?: DarkModeOperation;
    
    // TODO: Add additional fields
}

export { ExtensionOperation, DarkModeOperation, LightModeOperation, type InitData };
