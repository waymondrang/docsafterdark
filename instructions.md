# Instructions for Packaging

Run `node package.js`

## How it Works

This program will copy all of the files from the `chrome` directory into the `firefox` directory *except* for the `manifest.json` file. It will then update the `manifest.json` file in the `firefox` directory to match the one in the `chrome` directory while preserving the `web-accessible-resources` and `manifest-version` fields.

`package.sh` will then compress the files in the `chrome` and `firefox` to their respective zip files located in `releases`. 

Finally, the changes are committed and pushed to the GitHub repository.