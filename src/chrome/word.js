const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;

console.log("DOCS DARK MODE INJECTED")

var theme = `#90caf9`;
var warning = `#90caf9`;
var link_color = `#90caf9`;
var dark_mode_state = true;

var docs_homepage = document.querySelector(".docs-homescreen-gb-container");

if (!docs_homepage) {
    function insert_style() {
        //inject docs css
        const css = document.createElement('link');
        css.setAttribute("href", chrome.runtime.getURL('docs.css'));
        css.id = "docs-dark-mode";
        css.rel = "stylesheet";
        document.body.insertBefore(css, document.body.lastChild);
    }

    var toggle_button = document.createElement("button");
    toggle_button.id = "dark-mode-switch";
    toggle_button.innerHTML = "🌞"
    toggle_button.onclick = function () {
        if (dark_mode_state) {
            document.querySelector("#docs-dark-mode").remove()
            document.querySelector("#dark-mode-switch").innerHTML = "🌚"
            dark_mode_state = false
            //chrome.storage.local.set({ "gc-darkmode": false })
        } else {
            insert_style()
            document.querySelector("#dark-mode-switch").innerHTML = "🌞"
            dark_mode_state = true
            //chrome.storage.local.set({ "gc-darkmode": true })
        }
    }

    var default_style = document.createElement("style")
    default_style.textContent = `
#dark-mode-switch {
    position: fixed;
    left: 24px;
    bottom: 24px;
    border: .0625rem solid #3737371a;
    border-radius: 500px;
    background-color: #2121211a;
    color: #cecece;
    padding: 2px 8px;
    z-index: 2500000000;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);   
}
`

    document.body.insertBefore(toggle_button, document.body.lastChild);
    document.body.insertBefore(default_style, document.body.lastChild);

    document.documentElement.style.setProperty("--checkmark", "url(" + chrome.runtime.getURL('assets/checkmark.secondary.png') + ")");
    document.documentElement.style.setProperty("--revisions-sprite1", "url(" + chrome.runtime.getURL('assets/revisions_sprite1.secondary.svg') + ")");
    document.documentElement.style.setProperty("--close_18px", "url(" + chrome.runtime.getURL('assets/close_18px.svg') + ")");
    document.documentElement.style.setProperty("--lens", "url(" + chrome.runtime.getURL('assets/lens.svg') + ")");
    document.documentElement.style.setProperty("--jfk_sprite186", "url(" + chrome.runtime.getURL('assets/jfk_sprite186.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_highlighted", "url(" + chrome.runtime.getURL('assets/dimension-highlighted.edited.png') + ")");
    document.documentElement.style.setProperty("--dimension_unhighlighted", "url(" + chrome.runtime.getURL('assets/dimension-unhighlighted.edited.png') + ")");

    var backgrounds = {
        "default": "#ffffff",
        "shade": "#999999",
        "dark": "#1b1b1b",
        "black": "#000000"
    }

    var inverted;

    console.log("GETTING FROM STORAGE");
    chrome.storage.local.get(["doc_bg", "custom_bg", "invert"], function (data) {
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
        document.documentElement.style.setProperty("--document_invert", inverted ? "invert(1)" : "none");
    })

    insert_style();
}

