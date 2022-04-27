var bg_selected, on_selected;
const custom_input = document.querySelector("#custom_input");
const custom_save = document.querySelector("#save_custom");
const description = document.querySelector("#description");
const invert = document.querySelector("#invert");

var descriptions = {
    "default": "The background color feature is currently disabled. The page color change feature has been integrated into Google Docs, which can be accessed by navigating to the File dropdown, Page setup, and Page color.",
    "shade": "A light shade of gray. Black text is still readable.",
    "dark": "A dark gray. Black text will become hard to read and color changes may be be required",
    "black": "A completely black background.",
    "custom": "Any valid CSS declaration for the background property may be used here."
}

document.querySelectorAll("#on_off button").forEach(function (e) {
    e.addEventListener("click", function (e) {
        var id = this.id;
        on_selected.classList.remove("selected");
        this.classList.add("selected");
        on_selected = this;
        browser.storage.local.set({ "on": id == "on" });
    })
})

// document.querySelectorAll("#document_bg button").forEach(function (e) {
//     e.addEventListener("click", function (e) {
//         var id = this.id;
//         bg_selected.classList.remove("selected");
//         this.classList.add("selected");
//         bg_selected = this;
//         invert.checked = false;
//         if (id != "custom") {
//             custom_input.classList.add("hidden");
//             custom_save.classList.add("hidden");
//         } else {
//             custom_input.classList.remove("hidden");
//             custom_save.classList.remove("hidden");
//         }
//         for (d in descriptions) {
//             if (id == d) {
//                 description.textContent = descriptions[d];
//             }
//         }
//         browser.storage.local.set({ "doc_bg": id, "invert": false });
//     })
// })

// custom_save.addEventListener("click", function (e) {
//     if (custom_input.value) {
//         browser.storage.local.set({ "custom_bg": custom_input.value });
//     }
// })

invert.addEventListener("click", function (e) {
    browser.storage.local.set({ "invert": this.checked });
})

try {
    browser.storage.local.get(["doc_bg", "custom_bg", "invert", "on"], function (data) {
        var option = data.doc_bg;
        var custom = data.custom_bg;
        var inverted = data.invert;
        var on = data.on;
        if (on == null) {
            browser.storage.local.set({ "on": true });
            on = true;
        }
        if (!option) {
            var option = "default";
            browser.storage.local.set({ "doc_bg": "default" });
        }
        var selected_option = document.querySelector(`#${option}`);
        selected_option.classList.add("selected");
        bg_selected = selected_option;
        description.textContent = descriptions[option];
        if (option == "custom") {
            custom_input.classList.remove("hidden");
            custom_input.value = custom ? custom : "";
            custom_save.classList.remove("hidden");
        }
        if (inverted) {
            invert.checked = true;
        }
        var on_off;
        on_off = on ? document.querySelector("#on") : document.querySelector("#off");
        on_selected = on_off;
        on_off.classList.add("selected");
    })
} catch (e) {
    description.textContent = "Something went wrong..."
    console.log(e);
}
