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

/**
 * HELPER FUNCTION TO SEND MESSAGES TO ACTIVE TAB
 * 
 * @param {*} message 
 */
function sendMessageToTabs(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

/**
 * UPDATES A STORAGE OBJECT WITH A NEW KEY-VALUE PAIR
 * 
 * @param {String} storage_object 
 * @param {String} key 
 * @param {*} value 
 */
function update_storage(storage_object, key, value) {
  chrome.storage.local.get(storage_object, function (data) {
    if (data[storage_object] != null)
      data[storage_object][key] = value;
    else
      data[storage_object] = { [key]: value };
    
    chrome.storage.local.set({ [storage_object]: data[storage_object] });
  });
}

/**
 * SETS A STORAGE OBJECT WITH A NEW VALUE
 * 
 * @param {String} storage_object
 * @param {*} value
 */
function set_storage(storage_object, value) {
  chrome.storage.local.set({ [storage_object]: value });
}

/**
 * REMOVES A KEY FROM A STORAGE OBJECT
 * 
 * @param {String} key 
 */
function remove_storage(key) {
  chrome.storage.local.remove(key);
}

/**
 * CLEARS ALL STORAGE
 */
function clear_storage() {
  chrome.storage.local.clear();
}

///////////////
// VARIABLES //
///////////////

const mode_off            = 0;
const mode_light          = 1;
const mode_dark           = 2;

const dark_mode_normal    = 0;
const dark_mode_eclipse   = 1;

const default_accent_hue  = 88; // GREEN

const document_bg_custom_container  = document.querySelector("#document_bg_custom_container");
const document_bg_custom_input      = document.querySelector("#document_bg_custom_input");
const document_bg_custom_save       = document.querySelector("#document_bg_save_custom");
const document_bg_description       = document.querySelector("#document_bg_description");
const show_border                   = document.querySelector("#show_border");

var document_bg_option;
var selected_mode;

var document_inverted_state = false;

// DARK MODE VARIANTS
const dark_mode_normal_button   = document.querySelector("#dark_mode_normal");
const dark_mode_eclipse_button  = document.querySelector("#dark_mode_eclipse");

// DOCUMENT OPTIONS
const document_inverted_checkbox            = document.querySelector("#document_inverted");
const document_inverted_grayscale_checkbox  = document.querySelector("#document_inverted_grayscale");
const document_inverted_black_checkbox       = document.querySelector("#document_inverted_black");

// BUTTON OPTIONS
const show_button_checkbox      = document.querySelector("#show_button");
const raise_button_checkbox     = document.querySelector("#raise_button");

// TIP
const tip_button = document.querySelector("#tip_button");
const tip_container = document.querySelector("#tip_container");

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

/**
 * DISABLES A CHECKBOX AND ADDS A DISABLED CLASS TO THE PARENT ELEMENT
 * 
 * @param {HTMLInputElement} checkbox
 * @param {Boolean} disabled
 */
function checkbox_disable(checkbox, disabled) {
  checkbox.disabled = disabled;
  if (disabled)
    checkbox.parentElement.classList.add("disabled");
  else
    checkbox.parentElement.classList.remove("disabled");
}

/////////////////////
// EVENT LISTENERS //
/////////////////////

document.querySelectorAll("#modes button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    selected_mode.classList.remove("selected");
    this.classList.add("selected");
    selected_mode = this;
    
    if (this.id == "off") {
      set_storage("mode", mode_off);
    } else if (this.id == "light") {
      set_storage("mode", mode_light);

      // UPDATE INVERT SETTINGS
      document_inverted_checkbox.checked = false;

      // DISABLE INVERT SETTINGS
      checkbox_disable(document_inverted_grayscale_checkbox, true);
      checkbox_disable(document_inverted_black_checkbox, true);

      update_storage("invert", "invert", false);
    } else if (this.id == "dark") {
      set_storage("mode", mode_dark);
    }
  });
});

dark_mode_normal_button.addEventListener("click", (e) => {
  dark_mode_eclipse_button.classList.remove("selected");
  e.target.classList.add("selected");

  // UPDATE INVERT SETTINGS
  document_inverted_black_checkbox.checked = false;

  update_storage("dark_mode", "variant", dark_mode_normal);
  update_storage("invert", "black", false);
});

dark_mode_eclipse_button.addEventListener("click", (e) => {
  dark_mode_normal_button.classList.remove("selected");
  e.target.classList.add("selected");

  // UPDATE INVERT SETTINGS
  document_inverted_black_checkbox.checked = true;

  update_storage("dark_mode", "variant", dark_mode_eclipse);
  update_storage("invert", "black", true);
});

tip_button.addEventListener("mouseenter", (e) => {
  // WAIT BEFORE SHOWING TIP
  let timeout = setTimeout(() => {
    tip_container.classList.remove("hidden");
  }, 250);

  tip_button.addEventListener("mouseleave", (e) => {
    clearTimeout(timeout);
  });
});

tip_container.addEventListener("mouseleave", (e) => {
  tip_container.classList.add("hidden");
});

show_button_checkbox.addEventListener("click", function (e) {
  checkbox_disable(raise_button_checkbox, !e.target.checked);

  update_storage("button_options", "show", e.target.checked);
});

raise_button_checkbox.addEventListener("click", function (e) {
  update_storage("button_options", "raised", e.target.checked);
});

// DEPRECATED IN CHROME (FOR NOW)
document.querySelectorAll("#document_bg_buttons button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    var id = this.id;

    document_bg_option.classList.remove("selected");
    this.classList.add("selected");

    document_bg_option = this;

    document_inverted_checkbox.checked = false;
    document_inverted_grayscale_checkbox.checked = false;
    checkbox_disable(document_inverted_grayscale_checkbox, true);

    if (id != "custom") {
      document_bg_custom_container.classList.add("hidden");
    } else {
      document_bg_custom_container.classList.remove("hidden");
    }
    for (d in descriptions) {
      if (id == d) {
        document_bg_description.textContent = descriptions[d];
      }
    }
    chrome.storage.local.set({
      doc_bg: id,
      invert: { invert: false, grayscale: false },
    });
  });
});

document_bg_custom_save.addEventListener("click", function (e) {
  if (document_bg_custom_input.value)
    chrome.storage.local.set({ custom_bg: document_bg_custom_input.value });
});

////////////////////////////
// INVERT CLICK LISTENERS //
////////////////////////////

document_inverted_checkbox.addEventListener("click", function (e) {
  document_inverted_state = e.target.checked;

  checkbox_disable(document_inverted_grayscale_checkbox, !document_inverted_state);
  checkbox_disable(document_inverted_black_checkbox, !document_inverted_state || !document_inverted_grayscale_checkbox.checked);

  update_storage("invert", "invert", document_inverted_state); // TODO: SEPARATE INVERT FROM INVERT OPTIONS OR CONSOLIDATE OPTIONS INTO DOCUMENT OPTIONS
});

document_inverted_grayscale_checkbox.addEventListener("click", function (e) {
  checkbox_disable(document_inverted_black_checkbox, !e.target.checked);
  
  chrome.storage.local.set({
    invert: { invert: document_inverted_state, grayscale: e.target.checked, black: document_inverted_black_checkbox.checked },
  });
});

document_inverted_black_checkbox.addEventListener("click", function (e) {
  chrome.storage.local.set({
    invert: { invert: document_inverted_state, grayscale: document_inverted_grayscale_checkbox.checked, black: e.target.checked },
  });
});

////////////////////////////////
// END INVERT CLICK LISTENERS //
////////////////////////////////

show_border.addEventListener("click", function (e) {
  chrome.storage.local.set({ show_border: e.target.checked });
});

donate.addEventListener("click", function (e) {
  chrome.tabs.create({ url: "https://www.buymeacoffee.com/waymondrang" });
});

/**
 * CALLED WHEN THE COLOR PICKER CHANGES FOR PREVIEWING TEMPORARY COLOR CHANGES
 * 
 * @param {{hue: Number}} color
 */
function handleTempColorChange(color, saveToStorage = true) {
  sendMessageToTabs({
    type: "setAccentColor",
    color: color,
  });

  // SAVE TEMPORARY COLOR TO STORAGE
  if (saveToStorage)
    chrome.storage.local.set({ temp_accent_color: color });

  console.log("SAVED TEMP ACCENT COLOR: ", color);

  // SET POPUP ACCENT COLOR
  setPopupAccentColor(color);
}

////////////////////////////
// SET POPUP ACCENT COLOR //
////////////////////////////

function setPopupAccentColor(color) {
  document.documentElement.style.setProperty("--docsafterdark-accent-hue", color.hue);
}

////////////////////
// SPECTRUM INPUT //
////////////////////

spectrum_input.addEventListener("input", function (e) {
  if (spectrum_input.value) {
    // ENABLE RESET AND SAVE BUTTONS
    spectrum_reset.disabled = false;
    spectrum_save.disabled = false;

    // CLAMP INPUT VALUE
    spectrum_input.value = Math.min(Math.max(spectrum_input.value, 0), 360);

    // SET KNOB POSITION (USING LEFT OFFSET)
    let fraction = spectrum_input.value / 360;
    let offset = fraction * (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
    spectrum_knob.style.left = offset + "px";

    // SET BACKGROUND COLOR (CSS HUE RANGE IS [0, 360])
    spectrum_knob.style.backgroundColor = `hsl(${spectrum_input.value}, 100%, 50%)`;

    handleTempColorChange({ hue: spectrum_input.value });
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
      // SET DEFAULT ACCENT COLOR
      initiateKnob(0);
    }

    // DISABLE RESET AND SAVE BUTTONS AFTER RESET
    spectrum_reset.disabled = true;
    spectrum_save.disabled = true;

    // DO NOT SAVE TEMPORARY COLOR WHEN RESET
    handleTempColorChange({ hue: spectrum_input.value }, false);

    // REMOVE TEMPORARY COLOR
    chrome.storage.local.remove("temp_accent_color");
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

    // REMOVE TEMPORARY COLOR
    chrome.storage.local.remove("temp_accent_color");

    console.log("SAVED ACCENT HUE VALUE: " + spectrum_input.value);

    // DISABLE RESET AND SAVE BUTTONS AFTER SAVING
    spectrum_reset.disabled = true;
    spectrum_save.disabled = true;
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
  // ENABLE RESET AND SAVE BUTTONS
  spectrum_reset.disabled = false;
  spectrum_save.disabled = false;

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

  handleTempColorChange({ hue: hue });
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

  // ENABLE RESET AND SAVE BUTTONS
  spectrum_reset.disabled = false;
  spectrum_save.disabled = false;

  // SEND MESSAGE TO ACTIVE TAB (TODO: ALL DOCS TABS)
  handleTempColorChange({ hue: hue });

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
    [
      "doc_bg",
      "custom_bg",
      "invert",
      "mode",
      "show_border",
      "accent_color",
      "temp_accent_color",
      "dark_mode",
      "button_options",
      "raise_button", // DEPRECATED BUT KEEP FOR BACKWARDS COMPATIBILITY
      "on", // DEPRECATED BUT KEEP FOR BACKWARDS COMPATIBILITY
    ],
    function (data) {
      let option        = data.doc_bg;
      let custom_data   = data.custom_bg;
      let invert_data   = data.invert;
      let button_raised = data.raise_button;
      let border_shown  = data.show_border;

      ////////////////////
      // PARSE SETTINGS //
      ////////////////////

      // RESET SETTINGS
      document.querySelectorAll("#modes button").forEach(function (e) {
        e.classList.remove("selected");
      });

      if (data.mode == null) {
        chrome.storage.local.set({ mode: mode_dark });
        selected_mode = document.querySelector("#dark");
      } else {
        if (data.mode == mode_off) {
          selected_mode = document.querySelector("#off");
        } else if (data.mode == mode_light) {
          selected_mode = document.querySelector("#light");
        } else {
          selected_mode = document.querySelector("#dark");
        }
      }

      selected_mode.classList.add("selected");

      if (option == null) {
        // Set default option to default_background
        option = default_background;
        chrome.storage.local.set({ doc_bg: option });
      }

      ////////////
      // INVERT //
      ////////////

      if (invert_data == null) {
        invert_data = { invert: true, grayscale: true, black: false };
        chrome.storage.local.set({ invert: invert_data });
      }

      document_inverted_checkbox.checked = invert_data.invert;
      document_inverted_grayscale_checkbox.checked = invert_data.grayscale;
      document_inverted_black_checkbox.checked = invert_data.black;
      
      checkbox_disable(document_inverted_grayscale_checkbox, !invert_data.invert);
      checkbox_disable(document_inverted_black_checkbox, !invert_data.grayscale || !invert_data.invert);
      
      document_inverted_state = invert_data.invert;

      ////////////////
      // END INVERT //
      ////////////////

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
      document_bg_option = selected_option;
      document_bg_description.textContent = descriptions[option];

      if (option == "custom") {
        document_bg_custom_container.classList.remove("hidden");
        document_bg_custom_input.value = custom_data;
      }

      if (border_shown) {
        show_border.checked = true;
      }

      ////////////
      // BUTTON //
      ////////////

      let button_options = data.button_options;

      if (button_options == null) {
        // CHECK IMPORT RAISED BUTTON SETTING
        if (data.button_raised != null) {
          button_options = { show: true, raised: data.button_raised };
        } else {
          button_options = { show: true, raised: false };
        }

        chrome.storage.local.set({ button_options: button_options });
      }

      show_button_checkbox.checked = button_options.show;

      raise_button_checkbox.checked = button_options.raised;
      checkbox_disable(raise_button_checkbox, !button_options.show);

      //////////////////
      // ACCENT COLOR //
      //////////////////

      // SET DEFAULT ACCENT COLOR
      let accent_color = { hue: default_accent_hue };

      if (data.temp_accent_color) {
        accent_color = data.temp_accent_color;
        // ENABLE RESET AND SAVE BUTTONS
        spectrum_reset.disabled = false;
        spectrum_save.disabled = false;
      } else if (data.accent_color) {
        accent_color = data.accent_color;
        // DISABLE RESET AND SAVE BUTTONS (SANITY)
        spectrum_reset.disabled = true;
        spectrum_save.disabled = true;
      } else {
        spectrum_reset.disabled = true;
        spectrum_save.disabled = true;
      }

      initiateKnob(accent_color.hue);
      setPopupAccentColor(accent_color);

      ///////////////////////
      // DARK MODE VARIANT //
      ///////////////////////

      if (data.dark_mode == null) {
        data.dark_mode = { variant: dark_mode_normal };
        chrome.storage.local.set({ dark_mode: data.dark_mode });
      }

      dark_mode_normal_button.classList.remove("selected");
      dark_mode_eclipse_button.classList.remove("selected");
 
      if (data.dark_mode.variant == dark_mode_eclipse) {
        dark_mode_eclipse_button.classList.add("selected");
      } else {
        dark_mode_normal_button.classList.add("selected");
      }

      ///////////////////////////
      // END DARK MODE VARIANT //
      ///////////////////////////
    }
  );
} catch (e) {
  document_bg_description.textContent = "SOMETHING WENT WRONG!";
  console.log(e);
}

///////////
// DEBUG //
///////////

// const debug_storage_key_input         = document.querySelector("#debug_storage_key");
// const debug_storage_key_clear_button  = document.querySelector("#debug_storage_key_clear");
// const debug_kv_key                    = document.querySelector("#debug_kv_key");
// const debug_kv_value                  = document.querySelector("#debug_kv_value");
// const debug_key_value                 = document.querySelector("#debug_key_value");
// const debug_save_button               = document.querySelector("#debug_save");
// const debug_clear_button              = document.querySelector("#debug_clear");

// debug_storage_key_clear_button.addEventListener("click", function (e) {
//   if (debug_storage_key_input.value) {
//     remove_storage(debug_storage_key_input.value);
//     debug_storage_key_input.value = "";
//   }
// });

// debug_save_button.addEventListener("click", function (e) {
//   if (debug_storage_key_input.value && debug_kv_key.value && debug_kv_value.value) {
//     update_storage(debug_storage_key_input.value, debug_kv_key.value, debug_kv_value.value);
//   } else if (debug_storage_key_input.value && debug_key_value.value) {
//     set_storage(debug_storage_key_input.value, debug_key_value.value);
//   }
// });

// debug_clear_button.addEventListener("click", function (e) {
//   clear_storage();
// });


