var selected;
const custom_input = document.querySelector("#custom_input");
const custom_save = document.querySelector("#save_custom");
const description = document.querySelector("#description");
const invert = document.querySelector("#invert");

var descriptions = {
    "default": "The default, white background.",
    "shade": "A light shade of gray. Black text is still readable.",
    "dark": "A dark gray. Black text will become hard to read and color changes may be be required",
    "black": "A completely black background.",
    "custom": "Any valid CSS declaration for the background property may be used here."
}

document.querySelectorAll(".menu_bar button").forEach(function (e) {
    e.addEventListener("click", function (e) {
        var id = this.id;
        if (id != "custom") {
            custom_input.classList.add("hidden");
            custom_save.classList.add("hidden");
        } else {
            custom_input.classList.remove("hidden");
            custom_save.classList.remove("hidden");
        }
        for (d in descriptions) {
            if (id == d) {
                description.textContent = descriptions[d];
            }
        }
        chrome.storage.local.set({ "doc_bg": id, "invert": false });
        selected.classList.remove("selected");
        this.classList.add("selected");
        selected = this;
        invert.checked = false;
    })
})

custom_save.addEventListener("click", function (e) {
    if (custom_input.value) {
        chrome.storage.local.set({ "custom_bg": custom_input.value });
    }
})

invert.addEventListener("click", function (e) {
    chrome.storage.local.set({ "invert": this.checked });
})

try {
    chrome.storage.local.get(["doc_bg", "custom_bg", "invert"], function (data) {
        var option = data.doc_bg;
        var custom = data.custom_bg;
        var inverted = data.invert;
        if (!option) {
            var option = "default";
            chrome.storage.local.set({ "doc_bg": "default" });
        }
        var selected_option = document.querySelector(`#${option}`);
        selected_option.classList.add("selected");
        selected = selected_option;
        description.textContent = descriptions[option];
        if (option == "custom") {
            custom_input.classList.remove("hidden");
            custom_input.value = custom ? custom : "";
            custom_save.classList.remove("hidden");
        }
        if (inverted) {
            invert.checked = true;
        }
    })
} catch (e) {
    description.textContent = "Something went wrong..."
    console.log(e);
}
