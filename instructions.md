# Instructions for Development

Edit source in the `chrome` directory and then run `node package.js` to sync changes between the `chrome` and `firefox` directories.

# Instructions for Packaging

Run `node package.js`

## How it Works

This program will copy all of the files from the `chrome` directory into the `firefox` directory *except* for the `manifest.json` file. It will then update the `manifest.json` file in the `firefox` directory to match the one in the `chrome` directory while preserving the `manifest-version` field and separately handling the `web-accessible-resources` field.

If `--package` is appended to the command, `package.sh` will compress the files in the `chrome` and `firefox` to their respective zip files located in `releases`. 

Finally, if the `--git` option is appended, `git.sh` will run, committing changes and pushing them to the upstream GitHub repository.