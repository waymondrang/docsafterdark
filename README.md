# DocsAfterDark

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pihphjfnfjmdbhakhjifipfdgbpenobg?color=%23262626%20)](https://chrome.google.com/webstore/detail/docsafterdark/pihphjfnfjmdbhakhjifipfdgbpenobg) [![Mozilla Add-on](https://img.shields.io/amo/v/docsafterdark?color=%23262626%20)](https://addons.mozilla.org/en-US/firefox/addon/docsafterdark/)

A free and open-source browser extension for customizing the appearance of Google Docs.

## Features

- Modern, sleek dark mode
- Colorful light mode
- Customizable accent color
- Quick toggle button
- Accessible settings popup

### Customization

- Choose between Normal and Midnight dark mode variants
- Change the highlight accent color hue for both dark and light mode
- Set the document background (may be unstable on Chromium-based browsers)
    - **Default** - white
    - **Shade** - tinted in light mode
    - **Blend** - transparent
    - **Black** - #000000
    - **Custom** - specify your own CSS value
- Display document content in dark mode with invert options (may invert images)
- Remove the document border for a seamless workspace
- Disable or move the toggle button

### Quick toggle button

If enabled, click the button in the bottom-left corner of the screen to instantly enable/disable the extension for the current document.

If it blocks other elements (like the word count widget), enable "Raise Button" in settings or hide it completely. Pressing this button only temporarily enables/disables the extension; to properly turn the extension off, use the settings popup.

## Installation

Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/docsafterdark/pihphjfnfjmdbhakhjifipfdgbpenobg) or [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/docsafterdark/).

## Development

### Prerequisites

- Node.js
- npm
- Firefox (optional, for hot-reload testing)

### Setup

**Install dependencies**

```sh
npm install
```

### Running

**Build and watch**

```sh
npm run dev
```

Changes to `src/` will automatically rebuild to `build/`. Changes to `webpack.config.cjs` require restarting the dev script.

**Firefox with hot-reload**

```sh
npm run firefox
```

Launches a temporary Firefox instance with the extension installed. The extension automatically reloads when files in `build/` change.

> **Note:** The Firefox profile is temporary and will not persist logins (on docs.google.com, for example) between sessions.

### Testing

**Check formatting and lint**

```sh
npm run check
```

This is also performed as a GitHub Action workflow. Pull requests must pass these checks before being merged.

### Building

**Build and package**

```sh
npm run build
```

This creates optimized bundles in `build/` and packages the extension as a `.zip` file in `release/`. The packaging process is handled by `package.ts` and reads the version from `src/manifest.json`.

The version in `package.json` is copied to the extension's `manifest.json` when the extension is built.

## Versions and tag names

The **version** must follow the structure: `<MAJOR VER>.<MINOR VER>.<PATCH VER>`.

The **tag name** for a release must follow the structure: `v<VERSION>`.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open-source and available under the [GNU GPLv3 License](LICENSE).
