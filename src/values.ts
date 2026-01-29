import {
    DarkModeOperation,
    ExtensionMode,
    LightModeOperation,
    DocumentBackground,
    type ExtensionData,
    InvertMode,
} from "./types";

const STYLE_PROPERTY_PREFIX = "--DocsAfterDark_";
const SELECTOR_PREFIX = "DocsAfterDark_";

const documentBackgroundStyles: Record<DocumentBackground, string> = {
    default: "#ffffff",
    shade: "var(--secondary-background-color)",
    dark: "var(--root-background-color)",
    black: "#000000",
    custom: "",
};

const documentBackgroundDescriptions = {
    default: "The default, white background.",
    shade: "A light shade of gray. Black text is still readable.",
    // A special, dark gray. This background is unaffected by the invert option.
    dark: "A dark gray. Black text will become hard to read and color changes may be be required.",
    black: "A complet ely black background.",
    custom: "Any valid CSS declaration for the background property may be used here.",
};

const themeClasses = {
    dark: "dark",
    light: "light",
    normal: "normal",
    midnight: "midnight",
};

const enabledClass = "enabled";

// NOTE: revisions-sprite1 has been renamed with an underscore (_).

const replacements = {
    checkmark: "checkmark.secondary.png",
    revisions_sprite1: "revisions_sprite1.secondary.svg",
    close_18px: "close_18px.svg",
    lens: "lens.svg",
    jfk_sprite186: "jfk_sprite186.edited.png",
    dimension_highlighted: "dimension-highlighted.edited.png",
    dimension_unhighlighted: "dimension-unhighlighted.edited.png",
    access_denied: "access_denied_transparent.png",
    access_denied_600: "access_denied_600_transparent.png",
    gm_add_black_24dp: "gm_add_black_24dp.png",
};

const documentInvert = {
    normal: "invert(1)",
    grayscale: "invert(1) contrast(79.5%) grayscale(100%)",
    black: "invert(1) grayscale(100%)",
    colorful: "invert(1) hue-rotate(180deg)",
    off: "none",
};

const documentBorder = {
    border: "1px solid var(--primary-border-color)",
    off: "none",
};

const buttonPosition = {
    normal: "1.5rem",
    raised: "4.75rem",
};

const defaultExtensionData: ExtensionData = {
    mode: ExtensionMode.Dark,

    dark_mode: { variant: DarkModeOperation.Normal },
    light_mode: { variant: LightModeOperation.Normal },

    doc_bg: DocumentBackground.Blend,
    custom_bg: "beige",

    // Dark blue
    accent_color: { hue: 225 },

    invert_enabled: true,
    invert_mode: InvertMode.Colorful,

    button_options: {
        show: true,
    },

    show_border: true,

    version: {
        last_version: "",
    },
};

const updateLink = "https://github.com/waymondrang/docsafterdark/releases";

// Planned for the future...
const guideLink = "https://docsafterdark.com/guide";

export {
    STYLE_PROPERTY_PREFIX,
    SELECTOR_PREFIX,
    replacements,
    documentBackgroundStyles,
    documentBackgroundDescriptions,
    documentInvert,
    documentBorder,
    buttonPosition,
    updateLink,
    guideLink,
    themeClasses,
    enabledClass,
    defaultExtensionData,
};
