#! /bin/sh

set -e

# note: the build version is set by the version from manifest.json in the
# $BUILD_DIR directory. this script reads the version after the webpack step,
# during which the manifest's version is set using package.json's version.
#
# see: ./webpack.config.cjs

BUILD_DIR="./build"
RELEASE_DIR="./release"

print_red() { printf "\033[31m%s\033[0m\n" "${1}"; }
print_green() { printf "\033[32m%s\033[0m\n" "${1}"; }
print_yellow() { printf "\033[33m%s\033[0m\n" "${1}"; }
print_blue() { printf "\033[34m%s\033[0m\n" "${1}"; }
print_magenta() { printf "\033[35m%s\033[0m\n" "${1}"; }
print_cyan() { printf "\033[36m%s\033[0m\n" "${1}"; }
print_white() { printf "\033[37m%s\033[0m\n" "${1}"; }
print_bold() { printf "\033[1m%s\033[0m\n" "${1}"; }
print_dim() { printf "\033[2m%s\033[0m\n" "${1}"; }

print_success() { print_green "[ok] ${1}"; }
print_error() { print_red "[error] ${1}"; }
print_warning() { print_yellow "[warn] ${1}"; }
print_info() { print_blue "[info] ${1}"; }
print_step() { print_cyan "> ${1}"; }

#########
# CLEAN #
#########

print_step "cleaning build directory..."

if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR" || {
        print_error "failed to clean build directory"
        exit 1
    }
fi

###########
# WEBPACK #
###########

print_step "building files with webpack..."
webpack --mode=production || {
    print_error "webpack build failed"
    exit 1
}

########
# SCSS #
########

print_step "compiling scss files..."

sass src/scss/docs.scss build/docs.bundle.css || {
    print_error "docs.scss compilation failed"
    exit 1
}
sass src/scss/frame.scss build/frame.bundle.css || {
    print_error "frame.scss compilation failed"
    exit 1
}
sass src/scss/global.scss build/global.bundle.css || {
    print_error "global.scss compilation failed"
    exit 1
}

################
# WEB-EXT LINT #
################

print_step "running web-ext lint..."
web-ext lint --config=web-ext.config.mjs || {
    print_error "web-ext lint failed"
    exit 1
}

###########
# PACKAGE #
###########

print_step "reading manifest..."

get_manifest_version() {
    jq -r '.version' "$1"
}

# sanity check manifest file
if [ ! -f "$BUILD_DIR/manifest.json" ]; then
    print_error "manifest file not found in $BUILD_DIR"
    exit 1
fi

# get version from manifest
VERSION=$(get_manifest_version "$BUILD_DIR/manifest.json")
if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
    print_error "version not found in manifest.json"
    exit 1
fi

print_step "packaging docsafterdark v$VERSION..."

# create release directory
if [ ! -d "$RELEASE_DIR" ]; then
    mkdir -p "$RELEASE_DIR"
    print_info "created release directory: $RELEASE_DIR"
fi

# note: the build script will only warn you about an existing package with
# the same version. it will remove it and overwrite it by default.

TARGET_FILE="${RELEASE_DIR}/DocsAfterDark_${VERSION}.zip"
if [ -f "$TARGET_FILE" ]; then
    print_warning "packaged version already exists: $TARGET_FILE"

    print_warning "removing existing package"
    rm -f "${TARGET_FILE}"
fi

# create zip archive (exclude .ds_store files)
(cd "${BUILD_DIR}" && zip --quiet --recurse-paths "../$TARGET_FILE" . --exclude "**/.DS_Store") || {
    print_error "failed to create zip archive"
    exit 1
}

# success stats
ZIP_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
print_info "package created: $(basename "$TARGET_FILE") ($ZIP_SIZE)"

print_success "build completed successfully!"
