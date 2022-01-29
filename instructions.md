# Instructions for Development

*A note to self*

Edit source in the `chrome` directory and then run `node build.js` to sync changes between the `chrome` and `firefox` directories.

## Instructions for Release

1. Commit changes prior to build using `git.sh`
2. Run `node build.js` with the `--all` option

### How it Works

This program will copy all of the files from the `chrome` directory into the `firefox` directory *except* for the `manifest.json` file. It will then separately update the `manifest.json` file in the `firefox` directory to match the one in the `chrome` directory while preserving the `manifest-version` field and other special manifest version-specific fields.

## Options

If `--copy` is appended to the command, the `chrome` and `firefox` directories will be synced. If combined with the `--git` option, it will push the changes with the message `v{VERSION} directory sync`.

If `--package` is appended to the command, `package.sh` will compress the files in the `chrome` and `firefox` to their respective zip files located in `releases`. 

If the `--git` option is appended, `git.sh` will run, committing changes and pushing them to the upstream GitHub repository with the commit message `version v{VERSION}`.

If the `--all` option is appended, `build.js` will perform all steps.