import { type DocumentBackground } from "./types";

const documentBackgrounds: Record<DocumentBackground, string> = {
    default: "#ffffff",
    shade: "var(--secondary-background-color)",
    dark: "var(--root-background-color)",
    black: "#000000",
    custom: "",
};

const replacements = {
    "--checkmark": "checkmark.secondary.png",
    "--revisions-sprite1": "revisions_sprite1.secondary.svg",
    "--close_18px": "close_18px.svg",
    "--lens": "lens.svg",
    "--jfk_sprite186": "jfk_sprite186.edited.png",
    "--dimension_highlighted": "dimension-highlighted.edited.png",
    "--dimension_unhighlighted": "dimension-unhighlighted.edited.png",
    "--access_denied": "access_denied_transparent.png",
    "--access_denied_600": "access_denied_600_transparent.png",
    "--gm_add_black_24dp": "gm_add_black_24dp.png",
};

const documentInvert = {
    invert: "invert(1)",
    grayscale: "invert(1) contrast(79.5%) grayscale(100%)",
    black: "invert(1) grayscale(100%)",
    off: "none",
};

const documentBorder = {
    border: "1px solid var(--primary-border-color)",
    off: "none",
};

const buttonPosition = {
    normal: "24px",
    raised: "74px",
};

const updateLink = "https://github.com/waymondrang/docsafterdark/releases";

export {
    replacements,
    documentBackgrounds,
    documentInvert,
    documentBorder,
    buttonPosition,
    updateLink,
};
