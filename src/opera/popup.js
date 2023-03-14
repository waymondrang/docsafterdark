var bg_selected, on_selected;
const custom_input = document.querySelector("#custom_input");
const custom_save = document.querySelector("#save_custom");
const description = document.querySelector("#description");
const raise_button = document.querySelector("#raise_button");
const grayscale = document.querySelector("#grayscale");
const show_border = document.querySelector("#show_border");
const invert = document.querySelector("#invert");
const donate = document.querySelector("#donate");

var descriptions = {
  default: "The default, white background.",
  shade: "A light shade of gray. Black text is still readable.",
  dark: "A dark gray. Black text will become hard to read and color changes may be be required.", // A special, dark gray. This background is unaffected by the invert option.
  black: "A completely black background.",
  custom:
    "Any valid CSS declaration for the background property may be used here.",
};

const default_background = "default";

const manifestData = chrome.runtime.getManifest();
const version = manifestData.version;
const versionElement = document.querySelector("#version");
versionElement.textContent = version ? "v" + version : "";

document.querySelectorAll("#on_off button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    var id = this.id;
    on_selected.classList.remove("selected");
    this.classList.add("selected");
    on_selected = this;
    chrome.storage.local.set({ on: id == "on" });
  });
});

document.querySelectorAll("#document_bg button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    var id = this.id;
    bg_selected.classList.remove("selected");
    this.classList.add("selected");
    bg_selected = this;
    invert.checked = false;
    grayscale.checked = false;
    grayscale.disabled = true;
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
    chrome.storage.local.set({
      doc_bg: id,
      invert: { invert: false, grayscale: false },
    });
  });
});

custom_save.addEventListener("click", function (e) {
  if (custom_input.value) {
    chrome.storage.local.set({ custom_bg: custom_input.value });
  }
});

invert.addEventListener("click", function (e) {
  grayscale.disabled = !e.target.checked;
  grayscale.checked = e.target.checked;
  chrome.storage.local.set({
    invert: { invert: e.target.checked, grayscale: e.target.checked },
  });
});

grayscale.addEventListener("click", function (e) {
  chrome.storage.local.set({
    invert: { invert: invert.checked, grayscale: e.target.checked },
  });
});

show_border.addEventListener("click", function (e) {
  chrome.storage.local.set({ show_border: e.target.checked });
});

raise_button.addEventListener("click", function (e) {
  chrome.storage.local.set({ raise_button: this.checked });
});

donate.addEventListener("click", function (e) {
  chrome.tabs.create({ url: "https://www.buymeacoffee.com/waymondrang" });
});

try {
  chrome.storage.local.get(
    ["doc_bg", "custom_bg", "invert", "on", "raise_button", "show_border"],
    function (data) {
      var option = data.doc_bg;
      var custom_data = data.custom_bg;
      var invert_data = data.invert;
      var button_raised = data.raise_button;
      var border_shown = data.show_border;
      var on = data.on;

      console.log(data);

      // Initiate settings
      if (on == null) {
        on = true;
        chrome.storage.local.set({ on: on });
      }
      if (option == null) {
        // Set default option to default_background
        option = default_background;
        chrome.storage.local.set({ doc_bg: option });
      }
      if (invert_data == null) {
        invert_data = { invert: true, grayscale: true };
        chrome.storage.local.set({ invert: invert_data });
      }
      if (button_raised == null) {
        button_raised = false;
        chrome.storage.local.set({ raise_button: button_raised });
      }
      if (border_shown == null) {
        border_shown = true;
        chrome.storage.local.set({ show_border: border_shown });
      }

      var selected_option = document.querySelector(`#${option}`);
      selected_option.classList.add("selected");
      bg_selected = selected_option;
      description.textContent = descriptions[option];
      if (option == "custom") {
        custom_input.classList.remove("hidden");
        custom_input.value = custom_data;
        custom_save.classList.remove("hidden");
      }

      if (invert_data.invert) {
        invert.checked = true;
      } else {
        grayscale.disabled = true;
      }

      if (invert_data.grayscale) {
        grayscale.checked = true;
      }

      if (border_shown) {
        show_border.checked = true;
      }

      if (button_raised) {
        raise_button.checked = true;
      }

      var on_off = on
        ? document.querySelector("#on")
        : document.querySelector("#off");
      on_selected = on_off;
      on_off.classList.add("selected");
    }
  );
} catch (e) {
  description.textContent = "Something went wrong...";
  console.log(e);
}
