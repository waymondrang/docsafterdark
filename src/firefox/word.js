const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;

console.log("DOCS DARK MODE INJECTED")

var theme = `#90caf9`;
var warning = `#90caf9`;
var link_color = `#90caf9`;
var dark_mode_state = true;

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
default_style.innerHTML = `
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

document.body.insertBefore(toggle_button, document.body.lastChild)
document.body.insertBefore(default_style, document.body.lastChild)

insert_style();

