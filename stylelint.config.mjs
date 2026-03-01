/** @type {import('stylelint').Config} */
export default {
    extends: ["stylelint-config-standard-scss"],
    rules: {
        "selector-class-pattern": null,
        "selector-id-pattern": null,
        "comment-whitespace-inside": null,
        "declaration-empty-line-before": null,
        "custom-property-empty-line-before": null,
        "comment-empty-line-before": null,
        "custom-property-pattern": null, // consider renaming css properties
        // to kebab-case
        "scss/dollar-variable-empty-line-before": null,
    },
};
