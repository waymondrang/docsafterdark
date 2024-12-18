///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

/**
 * Converts an hex format color to RGB.
 * https://stackoverflow.com/a/5624139
 *
 * @param {String} hex
 * @returns An object containing the RGB values
 */
function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts an RGB component to hex.
 *
 * @param {Number} c
 * @returns The hex value of the component
 */
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

/**
 * Converts an RGB color value into hex format.
 * https://stackoverflow.com/a/5624139
 *
 * @returns String of the hex value
 */
function rgbToHex({ r, g, b }) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Converts an RGB color value to HSL.
 *
 * @returns An object containing the HSL values
 */
function rgbToHsl({ r, g, b }) {
  (r /= 255), (g /= 255), (b /= 255);

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: h,
    s: s,
    l: l,
  };
}

/**
 * Converts an HSL color value to RGB.
 *
 * @param {Number} h
 * @param {Number} s
 * @param {Number} l
 * @returns An object containing the RGB values
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  s /= 100;
  l /= 100;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

///////////////
// VARIABLES //
///////////////

const OFF_MODE = 0;
const LIGHT_MODE = 1;
const DARK_MODE = 2;

var bg_selected;
var selected_mode;
const custom_input = document.querySelector("#custom_input");
const custom_save = document.querySelector("#save_custom");
const description = document.querySelector("#description");
const raise_button = document.querySelector("#raise_button");
const grayscale = document.querySelector("#grayscale");
const show_border = document.querySelector("#show_border");
const invert = document.querySelector("#invert");
const donate = document.querySelector("#donate");

const spectrum_input = document.querySelector("#spectrum_input");
const spectrum_save = document.querySelector("#spectrum_save");
const spectrum_reset = document.querySelector("#spectrum_reset");
const spectrum_bar = document.querySelector("#spectrum_bar");
const spectrum_knob = document.querySelector("#spectrum_knob");

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

/////////////////////
// EVENT LISTENERS //
/////////////////////

document.querySelectorAll("#modes button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    selected_mode.classList.remove("selected");
    this.classList.add("selected");
    selected_mode = this;
    
    if (this.id == "off") {
      chrome.storage.local.set({ mode: OFF_MODE });
    } else if (this.id == "light") {
      chrome.storage.local.set({ mode: LIGHT_MODE });
    } else if (this.id == "dark") {
      chrome.storage.local.set({ mode: DARK_MODE });
    }
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
  if (custom_input.value)
    chrome.storage.local.set({ custom_bg: custom_input.value });
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

////////////////////
// SPECTRUM INPUT //
////////////////////

spectrum_input.addEventListener("input", function (e) {
  if (spectrum_input.value) {
    // ENABLE RESET BUTTON
    spectrum_reset.disabled = false;

    // CLAMP INPUT VALUE
    spectrum_input.value = Math.min(Math.max(spectrum_input.value, 0), 360);

    // SET KNOB POSITION (USING LEFT OFFSET)
    let fraction = spectrum_input.value / 360;
    let offset = fraction * (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
    spectrum_knob.style.left = offset + "px";

    // SET BACKGROUND COLOR (CSS HUE RANGE IS [0, 360])
    spectrum_knob.style.backgroundColor = `hsl(${spectrum_input.value}, 100%, 50%)`;

    // SEND MESSAGE TO ACTIVE TAB (TODO: ALL DOCS TABS)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "setAccentColor",
        color: { hue: spectrum_input.value },
      });
    });
  }
});

////////////////////
// SPECTRUM RESET //
////////////////////

spectrum_reset.addEventListener("click", function (e) {
  chrome.storage.local.get("accent_color", function (data) {
    if (data.accent_color) {
      initiateKnob(data.accent_color.hue);
    } else {
      initiateKnob(0);
    }

    // DISABLE RESET BUTTON AFTER RESET
    spectrum_reset.disabled = true;

    // SEND MESSAGE TO ACTIVE TAB (TODO: ALL DOCS TABS)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "setAccentColor",
        color: { hue: spectrum_input.value },
      });
    });
  });
});

/////////////////////
// SPECTRUM SAVING //
/////////////////////

spectrum_save.addEventListener("click", function (e) {
  if (spectrum_input.value) {
    // TODO: VALIDATE HUE VALUE

    // SAVE HUE TO STORAGE
    chrome.storage.local.set({ accent_color: { hue: spectrum_input.value } });

    console.log("SAVED ACCENT HUE VALUE: " + spectrum_input.value);

    // DISABLE RESET BUTTON AFTER SAVING
    spectrum_reset.disabled = true;
  }
});

////////////////////////////
// SPECTRUM KNOB DRAGGING //
////////////////////////////

var mouseStartPosition = 0;
var knobOffset = 0;
var knobDragging = false;

function initiateKnob(hue) {
  let fraction = hue / 360;
  let offset = fraction * (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);

  // SET KNOB POSITION (USING LEFT OFFSET)
  spectrum_knob.style.left = offset + "px";

  // SET BACKGROUND COLOR (CSS HUE RANGE IS [0, 360])
  spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  // SET INPUT VALUE
  spectrum_input.value = hue;

  // UPDATE KNOB OFFSET
  knobOffset = offset;
}

function moveKnob(e) {
  // ENABLE RESET BUTTON
  spectrum_reset.disabled = false;

  let relativeMovement = e.clientX - mouseStartPosition;
  let offset = Math.min(Math.max(knobOffset + relativeMovement, 0), spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
  let fraction = offset / (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
  let hue = Math.min(Math.max(Math.round(fraction * 360), 0), 360);
  
  // SET KNOB POSITION (USING LEFT OFFSET)
  spectrum_knob.style.left = offset + "px";

  // SET BACKGROUND COLOR (CSS HUE RANGE IS [0, 360])
  spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  // SET INPUT VALUE
  spectrum_input.value = hue;

  // SEND MESSAGE TO ACTIVE TAB (TODO: ALL DOCS TABS)
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "setAccentColor",
      color: { hue: hue },
    });
  });
}

spectrum_knob.addEventListener("mousedown", function (e) {
  if (knobDragging) return;

  e.preventDefault();

  // SET DRAGGING FLAG
  knobDragging = true;

  // SAVE MOUSE START POSITION
  mouseStartPosition = e.clientX;

  document.addEventListener("mousemove", moveKnob);
  document.addEventListener("mouseup", function (e) {
    document.removeEventListener("mousemove", moveKnob);

    // UPDATE KNOB OFFSET
    knobOffset = parseFloat(spectrum_knob.style.left);

    // UNSET DRAGGING FLAG
    knobDragging = false;
  });
});

spectrum_bar.addEventListener("mousedown", function (e) {
  if (knobDragging) return;

  e.preventDefault();

  // SET DRAGGING FLAG
  knobDragging = true;

  let offset = Math.max(Math.min(e.clientX - spectrum_bar.getBoundingClientRect().left - spectrum_knob.offsetWidth / 2, spectrum_bar.offsetWidth - spectrum_knob.offsetWidth), 0);

  // UPDATE KNOB OFFSET
  knobOffset = offset;

  // SAVE MOUSE START POSITION
  mouseStartPosition = e.clientX;

  // SET KNOB POSITION (USING LEFT OFFSET)
  spectrum_knob.style.left = offset + "px";

  // SET BACKGROUND COLOR (CSS HUE RANGE IS [0, 360])
  let fraction = offset / (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
  let hue = Math.min(Math.max(Math.round(fraction * 360), 0), 360);
  spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  // SET INPUT VALUE
  spectrum_input.value = hue;

  // ENABLE RESET BUTTON
  spectrum_reset.disabled = false;

  // SEND MESSAGE TO ACTIVE TAB (TODO: ALL DOCS TABS)
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "setAccentColor",
      color: { hue: hue },
    });
  });

  document.addEventListener("mousemove", moveKnob);
  document.addEventListener("mouseup", function (e) {
    document.removeEventListener("mousemove", moveKnob);

    // UNSET DRAGGING FLAG
    knobDragging = false;

    // UPDATE KNOB OFFSET
    knobOffset = parseFloat(spectrum_knob.style.left);
  });
});

///////////////////
// LOAD SETTINGS //
///////////////////

try {
  chrome.storage.local.get(
    ["doc_bg",
      "custom_bg",
      "invert",
      "on", // OLD SETTING, DEPRECATED BUT KEPT FOR BACKWARDS COMPATIBILITY
      "mode",
      "raise_button",
      "show_border",
      "accent_color"],
    function (data) {
      var option = data.doc_bg;
      var custom_data = data.custom_bg;
      var invert_data = data.invert;
      var button_raised = data.raise_button;
      var border_shown = data.show_border;

      console.log(data);

      ////////////////////
      // PARSE SETTINGS //
      ////////////////////

      // RESET SETTINGS
      document.querySelectorAll("#modes button").forEach(function (e) {
        e.classList.remove("selected");
      });

      if (data.mode == null) {
        chrome.storage.local.set({ mode: DARK_MODE });
        selected_mode = document.querySelector("#dark");
      } else {
        if (data.mode == OFF_MODE) {
          selected_mode = document.querySelector("#off");
        } else if (data.mode == LIGHT_MODE) {
          selected_mode = document.querySelector("#light");
        } else if (data.mode == DARK_MODE) {
          selected_mode = document.querySelector("#dark");
        } else {
          // OLD SETTINGS
          if (data.on) {
            chrome.storage.local.set({ mode: DARK_MODE });
            selected_mode = document.querySelector("#dark");
          } else {
            // DO NOT FORCE USERS TO USE OUR LIGHT MODE
            chrome.storage.local.set({ mode: OFF_MODE });
            selected_mode = document.querySelector("#off");
          }
        }
      }

      selected_mode.classList.add("selected");

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

      if (data.accent_color) {
        initiateKnob(data.accent_color.hue);
      }
    }
  );
} catch (e) {
  description.textContent = "Something went wrong...";
  console.log(e);
}
