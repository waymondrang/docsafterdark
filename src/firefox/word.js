const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
const version = browser.runtime.getManifest().version;

var theme = `#90caf9`;
var warning = `#90caf9`;
var link_color = `#90caf9`;
var dark_mode_state;
var raise_button = false;

var docs_homepage = document.querySelector(".docs-homescreen-gb-container");

function dad() {
    if (document.querySelector("#docs-dark-mode")) {
        return;
    }
    dark_mode_state = true;
    const css = document.createElement('link');
    css.setAttribute("href", browser.runtime.getURL('docs.css'));
    css.id = "docs-dark-mode";
    css.rel = "stylesheet";
    document.body.insertBefore(css, document.body.lastChild);
    insert_button();
}

function remove_dad() {
    dark_mode_state = false;
    if (document.querySelector("#docs-dark-mode"))
        document.querySelector("#docs-dark-mode").remove();
    if (document.querySelector("#dark-mode-switch"))
        document.querySelector("#dark-mode-switch").remove();
}

function insert_button() {
    if (document.querySelector("#dark-mode-switch")) {
        return;
    }
    var toggle_button = document.createElement("button");
    toggle_button.id = "dark-mode-switch";
    toggle_button.textContent = "🌞"
    toggle_button.onclick = function () {
        if (document.querySelector("#docs-dark-mode")) {
            document.querySelector("#docs-dark-mode").remove();
            this.textContent = "🌚";
            dark_mode_state = false;
            //browser.storage.local.set({ "gc-darkmode": false })
        } else {
            dad();
            this.textContent = "🌞";
            dark_mode_state = true
            //browser.storage.local.set({ "gc-darkmode": true })
        }
    }
    document.body.insertBefore(toggle_button, document.body.lastChild);
}

function get_default_style(condition) {
    return `
    #dark-mode-switch {
        position: fixed;
        left: 24px;
        bottom: ${condition ? "74px" : "24px"};
        border: .0625rem solid #3737371a;
        border-radius: 500px;
        background-color: #2121211a;
        color: #cecece;
        padding: 2px 8px;
        z-index: 2500000000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);   
    }
    `
}

function set_up() {
    var default_style = document.createElement("style")

    document.documentElement.style.setProperty("--checkmark", "url(" + browser.runtime.getURL('assets/checkmark.secondary.png') + ")");
    document.documentElement.style.setProperty("--revisions-sprite1", "url(" + browser.runtime.getURL('assets/revisions_sprite1.secondary.svg') + ")");
    document.documentElement.style.setProperty("--close_18px", "url(" + browser.runtime.getURL('assets/close_18px.svg') + ")");
    document.documentElement.style.setProperty("--lens", "url(" + browser.runtime.getURL('assets/lens.svg') + ")");
    document.documentElement.style.setProperty("--jfk_sprite186", "url(" + browser.runtime.getURL('assets/jfk_sprite186.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_highlighted", "url(" + browser.runtime.getURL('assets/dimension-highlighted.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_unhighlighted", "url(" + browser.runtime.getURL('assets/dimension-unhighlighted.edited.png') + ")");
    document.documentElement.style.setProperty("--access_denied", "url(" + browser.runtime.getURL('assets/access_denied_transparent.png') + ")");
    document.documentElement.style.setProperty("--access_denied_600", "url(" + browser.runtime.getURL('assets/access_denied_600_transparent.png') + ")");
    document.documentElement.style.setProperty("--gm_add_black_24dp", "url(" + browser.runtime.getURL('assets/gm_add_black_24dp.png') + ")");

    var backgrounds = {
        "default": "#ffffff",
        "shade": "#999999",
        "dark": "transparent",
        "black": "#000000"
    }

    var inverted;
    var grayscale;
    var show_border;
    var raise_button;
    var updates;

    console.log("GETTING FROM STORAGE");
    browser.storage.local.get(["doc_bg", "custom_bg", "invert", "raise_button", "show_border", "updates"], function (data) {
        console.log(data);
        if (Object.keys(data).includes("doc_bg")) {
            let option = data.doc_bg;
            let custom = data.custom_bg;
            if (option == "custom") {
                document.documentElement.style.setProperty("--document_background", custom);
            } else {
                for (bg in backgrounds) {
                    if (option == bg) {
                        document.documentElement.style.setProperty("--document_background", backgrounds[bg]);
                        break;
                    }
                }
            }
        } else {
            // Use "dark" background as default
            document.documentElement.style.setProperty("--document_background", backgrounds["dark"]);
        }

        if (Object.keys(data).includes("invert")) {
            inverted = data.invert.invert;
            grayscale = data.invert.grayscale;
        } else {
            // Enable inverted and grayscale by default
            inverted = true;
            grayscale = true;
        }

        if (Object.keys(data).includes("show_border")) {
            show_border = data.show_border;
        } else {
            // Show border by default
            show_border = true;
        }

        if (Object.keys(data).includes("raise_button")) {
            raise_button = data.raise_button;
        } else {
            // Don't raise button by default
            raise_button = false;
        }

        document.documentElement.style.setProperty("--document_invert", inverted ? `${grayscale ? `contrast(79%) grayscale(100%) ` : ""}invert(1)` : "none");
        document.documentElement.style.setProperty("--document_border", show_border ? "0 0 0 1px" : "none");
        // Insert Button
        default_style.textContent = get_default_style(raise_button);
        document.body.insertBefore(default_style, document.body.lastChild);

        var update_notification = document.createElement("div");
        update_notification.id = "update-notification";
        update_notification.style = "top: 0; left: 0; right: 0; background-color: #212121; color: #cecece; padding: 0.5em; text-align: center; z-index: 2500000000;";
        update_notification.textContent = "DocsAfterDark has been updated to version " + browser.runtime.getManifest().version + ". Read update notes on ";
        var update_link = document.createElement("a");
        update_link.href = "https://github.com/waymondrang/docsafterdark/releases";
        update_link.target = "_blank";
        update_link.textContent = "GitHub";
        update_link.style = "color: #cecece; text-decoration: underline;";
        update_notification.appendChild(update_link);
        update_notification.appendChild(document.createTextNode("."));
        var close_button = document.createElement("button");
        close_button.textContent = "Close";
        close_button.style = "background-color: #4d4d4d; border-radius: 2px; color: #64b5f6; border: none; cursor: pointer; margin-left: 1em;";
        close_button.onclick = function () {
            update_notification.style.display = "none";
            if (updates) {
                if (!updates.includes(version)) {
                    updates.push(version);
                    browser.storage.local.set({ "updates": updates });
                }
            } else {
                browser.storage.local.set({ "updates": [version] });
            }
        }
        update_notification.appendChild(close_button);

        // User must be on page for 10 seconds or manually close notification
        if (Object.keys(data).includes("updates")) {
            updates = data.updates;
            if (!updates.includes(version)) {
                // Extension updated
                document.body.prepend(update_notification);
            }
        } else {
            // Extension updated
            document.body.prepend(update_notification);
        }
    });

    browser.storage.onChanged.addListener(function (changes, area) {
        console.log(changes, inverted);
        if (Object.keys(changes).includes("doc_bg")) {
            var option = changes.doc_bg.newValue;
            if (option != "custom") {
                for (bg in backgrounds) {
                    if (option == bg) {
                        document.documentElement.style.setProperty("--document_background", backgrounds[bg]);
                        break;
                    }
                }
            } else {
                browser.storage.local.get(["custom_bg"], function (data) {
                    var custom = data.custom_bg;
                    document.documentElement.style.setProperty("--document_background", custom);
                })
            }
        }
        if (Object.keys(changes).includes("custom_bg")) {
            var custom = changes.custom_bg.newValue;
            document.documentElement.style.setProperty("--document_background", custom);
        }
        if (Object.keys(changes).includes("invert")) {
            console.log("INVERT CHANGED", inverted, changes)
            let invert_changes = changes.invert.newValue;
            inverted = invert_changes.invert;
            grayscale = invert_changes.grayscale;
            // Invert toggle property
            document.documentElement.style.setProperty("--document_invert", inverted ? `${grayscale ? `contrast(79%) grayscale(100%) ` : ""}invert(1)` : "none");
        }
        if (Object.keys(changes).includes("on")) {
            if (changes.on.newValue) {
                dad();
            } else {
                remove_dad();
            }
        }
        if (Object.keys(changes).includes("raise_button")) {
            console.log("RAISE BUTTON CHANGED", changes);
            default_style.textContent = get_default_style(changes.raise_button.newValue);
        }
        if (Object.keys(changes).includes("show_border")) {
            document.documentElement.style.setProperty("--document_border", changes.show_border.newValue ? "0 0 0 1px" : "none");
        }
    })
}

set_up();

browser.storage.local.get(["on"], function (data) {
    if (data.on == null) {
        dad();
        browser.storage.local.set({ "on": true });
        dark_mode_state = true;
    } else if (data.on && !docs_homepage) {
        dad();
        dark_mode_state = true;
    }
});

// DEV SOLUTION (not in use)

/**
 * 
 * @param {HTMLElement} element 
 */
function apply_dark_mode(element) {
    console.log(element);

    let style = window.getComputedStyle ? getComputedStyle(element, null) : element.currentStyle;

    // Backgrounds

    if (style.backgroundColor == "rgb(255, 255, 255)") {
        element.style.backgroundColor = "#262626";
    }

    if (style.backgroundColor == "rgb(248, 249, 250)") {
        element.style.backgroundColor = "#262626";
    }

    // Borders

    if (style.borderBottomColor == "rgb(218, 220, 224)") {
        element.style.borderBottomColor = "#4d4d4d";
    }

    if (style.borderTopColor == "rgb(218, 220, 224)") {
        element.style.borderTopColor = "#4d4d4d";
    }

    if (style.borderLeftColor == "rgb(218, 220, 224)") {
        element.style.borderLeftColor = "#4d4d4d";
    }

    if (style.borderRightColor == "rgb(218, 220, 224)") {
        element.style.borderRightColor = "#4d4d4d";
    }

    // Color

    if (style.color == "rgb(32, 33, 36)") {
        element.style.color = "#f2f2f2";
    }

    if (!element.children.length)
        return;

    for (var i = 0; i < element.children.length; i++) {
        apply_dark_mode(element.children[i]);
    }

    return;
}

// var mutationObserver = new MutationObserver(function (mutationList, observer) {
//     var target = document.querySelector(".docs-gm .docs-tiled-sidebar");

//     if (target && target.style.display != "none") {
//         // SIDEBAR APPEARED
//         apply_dark_mode(target);
//         mutationObserver.disconnect();
//     }
// })

// mutationObserver.observe(document.body, {
//     childList: true,
//     subtree: true
// });