const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;

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
    css.setAttribute("href", chrome.runtime.getURL('docs.css'));
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
            //chrome.storage.local.set({ "gc-darkmode": false })
        } else {
            dad();
            this.textContent = "🌞";
            dark_mode_state = true
            //chrome.storage.local.set({ "gc-darkmode": true })
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

    document.documentElement.style.setProperty("--checkmark", "url(" + chrome.runtime.getURL('assets/checkmark.secondary.png') + ")");
    document.documentElement.style.setProperty("--revisions-sprite1", "url(" + chrome.runtime.getURL('assets/revisions_sprite1.secondary.svg') + ")");
    document.documentElement.style.setProperty("--close_18px", "url(" + chrome.runtime.getURL('assets/close_18px.svg') + ")");
    document.documentElement.style.setProperty("--lens", "url(" + chrome.runtime.getURL('assets/lens.svg') + ")");
    document.documentElement.style.setProperty("--jfk_sprite186", "url(" + chrome.runtime.getURL('assets/jfk_sprite186.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_highlighted", "url(" + chrome.runtime.getURL('assets/dimension-highlighted.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_unhighlighted", "url(" + chrome.runtime.getURL('assets/dimension-unhighlighted.edited.png') + ")");
    document.documentElement.style.setProperty("--access_denied", "url(" + chrome.runtime.getURL('assets/access_denied_transparent.png') + ")");
    document.documentElement.style.setProperty("--access_denied_600", "url(" + chrome.runtime.getURL('assets/access_denied_600_transparent.png') + ")");
    document.documentElement.style.setProperty("--gm_add_black_24dp", "url(" + chrome.runtime.getURL('assets/gm_add_black_24dp.png') + ")");

    var backgrounds = {
        "default": "#ffffff",
        "shade": "#999999",
        "dark": "#1b1b1b",
        "black": "#000000"
    }

    var inverted;

    console.log("GETTING FROM STORAGE");
    chrome.storage.local.get(["doc_bg", "custom_bg", "invert", "raise_button"], function (data) {
        console.log(data);
        if (data.doc_bg) {
            var option = data.doc_bg;
            var custom = data.custom_bg ? data.custom_bg : "";
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
        }
        if (data.invert) {
            inverted = data.invert;
            document.documentElement.style.setProperty("--document_invert", "invert(1)");
        }
        // Insert Button
        default_style.textContent = get_default_style(data.raise_button);
        console.log(default_style.textContent);
        document.body.insertBefore(default_style, document.body.lastChild);
    });

    chrome.storage.onChanged.addListener(function (changes, area) {
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
                chrome.storage.local.get(["custom_bg"], function (data) {
                    var custom = data.custom_bg ? data.custom_bg : "";
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
            inverted = changes.invert.newValue;
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
        // Invert toggle property
        document.documentElement.style.setProperty("--document_invert", inverted ? "invert(1)" : "none");
    })
}

set_up();

chrome.storage.local.get(["on"], function (data) {
    if (data.on == null) {
        dad();
        chrome.storage.local.set({ "on": true });
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