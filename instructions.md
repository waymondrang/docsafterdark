# Instructions for Development

*A note to self*

Edit source in the `chrome` directory and then run `node build.js` to sync changes between the `chrome` and `firefox` directories.

## Instructions for Release

1. Commit changes prior to build using `git.sh`
2. Run `node build.js` with the `--all` option

### How it Works

This program will sync the `firefox` and `opera` directories with the `chrome` source directory. It will separately update the `manifest.json` file and parse manifest version-specific fields. Specified JavaScript files will also be handled separately to address browser-specific and manifest version-specific methods.

## Options

If `--copy` is appended to the command, the `chrome` and browser directories will be synced. If combined with the `--git` option, it will push the changes with the message specified in `build_config.json`.

If `--package` is appended to the command, `package.sh` will compress the files in each platform directory to their respective zip files located in `releases`. 

If the `--git` option is appended, `git.sh` will run, committing changes and pushing them to the upstream GitHub repository with the commit message `version v{VERSION}`.

If the `--all` option is appended, `build.js` will perform all steps.