# DocsAfterDark Rework

Currently DocsAfterDark is going through a major refactoring/rewrite.

## Development

### Requirements

- `npm`
- Firefox

### Installation

Install dependencies with `npm`:

```sh
npm install
```

### Running

Run and debug the extension using the `dev` script:

```sh
npm run dev
```

Currently the bundled JavaScript file is written to `test/word.bundle.js`, which
also contains the test `manifest.json`. web-ext in `npm run dev` currently
points to the `test/` directory.

## Todo

- [x] Move from CSS to SCSS and compile all stylesheets into a single one
- [x] Control themeing with HTML element classes instead of inserting/removing
      link elements
- [ ] Move from JavaScript to TypeScript
    - [x] Refactor from global-state procedural code to class-encapsulated state
          management
    - [x] Define StorageData type interface for type-safe storage operations
    - [x] Abstract browser APIs behind utility functions
    - [x] Rewrite word.js in TypeScript
    - [ ] Rewrite popup.js in TypeScript
