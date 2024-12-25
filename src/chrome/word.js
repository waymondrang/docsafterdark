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

  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

///////////////////////////
// END UTILITY FUNCTIONS //
///////////////////////////

const head =
  document.head ||
  document.getElementsByTagName("head")[0] ||
  document.documentElement;
const version = chrome.runtime.getManifest().version;


const mode_off              = 0;
const mode_light            = 1;
const mode_dark             = 2;

const dark_mode_normal      = 0;
const dark_mode_eclipse     = 1;

const default_accent_hue    = 88; // GREEN

const switch_on             = "🌚";
const switch_off            = "🌞";
const default_invert        = { invert: true, grayscale: true, oled: false }; // TODO: CHANGE NAME OF OLED PROPERTY

const replacements_path     = "assets/replacements/";
const css_path              = "assets/css/";

const replacements = {
  "--checkmark":                replacements_path + "checkmark.secondary.png",
  "--revisions-sprite1":        replacements_path + "revisions_sprite1.secondary.svg",
  "--close_18px":               replacements_path + "close_18px.svg",
  "--lens":                     replacements_path + "lens.svg",
  "--jfk_sprite186":            replacements_path + "jfk_sprite186.edited.png",
  "--dimension_highlighted":    replacements_path + "dimension-highlighted.edited.png",
  "--dimension_unhighlighted":  replacements_path + "dimension-unhighlighted.edited.png",
  "--access_denied":            replacements_path + "access_denied_transparent.png",
  "--access_denied_600":        replacements_path + "access_denied_600_transparent.png",
  "--gm_add_black_24dp":        replacements_path + "gm_add_black_24dp.png",
};

const document_inverted_value             = "invert(1)";
const document_inverted_grayscale_value   = "invert(1) contrast(79.5%) grayscale(100%)";
const document_inverted_oled_value        = "invert(1) grayscale(100%)";

const page_border = "0 0 0 1px";
const gm3_page_border = "1px solid var(--primary-border-color)";
const backgrounds = {
  default: "#ffffff",
  shade: "#999999",
  dark: "#1b1b1b",
  black: "#000000",
};
const default_background = "default";
const update_text_style =
  "border: 1px solid #4d4d4d; background-color: #212121; padding: 8px 12px; border-radius: 6px; box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22); font-size: 12px; font-family: Google Sans,Roboto,sans-serif;"; // use fixed font size
const close_button_style =
  "background-color: #4d4d4d; border-radius: 2px; color: #64b5f6; border: none; cursor: pointer; margin-left: 12px; font-size: inherit;";
const update_notification_style =
  "position: fixed; top: 12px; left: 0; right: 0; color: #cecece; padding: 12px; text-align: center; z-index: 2500000000; width: fit-content; margin: 0 auto;";
const update_link_href =
  "https://github.com/waymondrang/docsafterdark/releases";
const update_link_style = "color: #cecece; text-decoration: underline;";
const donation_link = "https://www.buymeacoffee.com/waymondrang";

var mode;
var dark_mode_options;
var button_options;
var accent_color;
var toggle_state = false;

// DO NOT ENABLE DARK MODE ON GOOGLE DOCS HOMEPAGE
if (document.querySelector(".docs-homescreen-gb-container"))
  throw new Error("NOT ENABLING DOCSAFTERDARK ON GOOGLE DOCS HOMEPAGE");

function inject_css_file(file) {
  let file_id = "docsafterdark_" + file.replace(".", "_");

  if (document.querySelector("#" + file_id))
    return;

  const css = document.createElement("link");
  css.setAttribute("href", chrome.runtime.getURL(css_path + file));
  css.id = file_id;
  css.rel = "stylesheet";

  document.body.insertBefore(css, document.body.lastChild);
}

function remove_css_file(file) {
  let file_id = "docsafterdark_" + file.replace(".", "_");

  if (document.querySelector("#" + file_id))
    document.querySelector("#" + file_id).remove();
}

/**
 * INJECTS DARK MODE VARIANT CSS
 * 
 * @param {{ variant: number }} dark_mode
 */
function inject_dark_mode(dark_mode) {  
  mode = mode_dark;
  
  remove_css_file("light.css");
  remove_css_file("dark_midnight.css");
  
  inject_css_file("docs.css");
  inject_css_file("dark_normal.css"); // BASE DARK MODE
  
  if (dark_mode.variant == dark_mode_eclipse) {
    inject_css_file("dark_midnight.css");
    // DO NOT REMOVE NORMAL DARK MODE CSS
  }
}

/**
 * INJECTS LIGHT MODE CSS
 */
function inject_light_mode() {
  mode = mode_light;

  remove_css_file("dark_midnight.css");
  remove_css_file("dark_normal.css");

  inject_css_file("docs.css");
  inject_css_file("light.css");
}

function remove_css_files() {
  remove_css_file("docs.css");
  remove_css_file("dark_midnight.css");
  remove_css_file("dark_normal.css");
  remove_css_file("light.css");
}

function remove_docsafterdark() {
  mode = mode_off;

  remove_css_files();

  if (document.querySelector("#docsafterdark_switch"))
    document.querySelector("#docsafterdark_switch").remove();
}

function button_callback(button) {
  if (toggle_state) {
    handle_mode(mode);

    toggle_state = false;
    button.textContent = switch_off;
  } else {
    remove_css_files();

    toggle_state = true;
    button.textContent = switch_on;
  }
}

function insert_button() {
  if (document.querySelector("#docsafterdark_switch"))
    return;

  let toggle_button = document.createElement("button");
  toggle_button.id = "docsafterdark_switch";
  toggle_button.textContent = switch_off;
  toggle_button.onclick = () => button_callback(toggle_button);

  document.body.insertBefore(toggle_button, document.body.lastChild);
}

/**
 * HANDLES BUTTON
 */
function handle_button() {
  if (button_options.show) {
    insert_button();
  } else {
    if (document.querySelector("#docsafterdark_switch"))
      document.querySelector("#docsafterdark_switch").remove();
  }

  document.documentElement.style.setProperty(
    "--docsafterdark-switch-position",
    button_options.raised ? "74px" : "24px"
  );
}

function update_accent_color(color) {
  accent_color = color;
  document.documentElement.style.setProperty("--accent-hue", color.hue);
}

function remove_accent_color() {
  document.documentElement.style.removeProperty("--accent-hue");
}

/**
 * HANDLES MODE AND VARIANT CHANGE
 * 
 * @param {{ mode: number | null, dark_mode: { variant: number } | null }} data
 */
function handle_mode() {
  if (mode != mode_off && button_options && button_options.show)
    handle_button();

  if (mode == null) {
    // FIRST INVOCATION (SHOULD NOT BE CALLED); ENABLE DARK MODE BY DEFAULT
    inject_dark_mode();

    mode = mode_dark;
    chrome.storage.local.set({ mode: mode });
  } else if (mode == mode_dark) {
    inject_dark_mode(dark_mode_options);
  } else if (mode == mode_light) {
    inject_light_mode();
  } else {
    // TURN OFF DOCSAFTERDARK
    remove_docsafterdark();
  }
}

/**
 * HANDLES DOCUMENT INVERT
 * 
 * @param {{invert: boolean, grayscale: boolean, oled: boolean}} invert
 */
function handle_document_invert(invert) {
  if (invert.invert) {
    if (invert.grayscale && invert.oled) {
      document.documentElement.style.setProperty("--document_invert", document_inverted_oled_value);
    } else if (invert.grayscale) {
      document.documentElement.style.setProperty("--document_invert", document_inverted_grayscale_value);
    } else {
      document.documentElement.style.setProperty("--document_invert", document_inverted_value);
    }
  } else {
    document.documentElement.style.setProperty("--document_invert", "none");
  }
}

/////////////////
// ENTRY POINT //
/////////////////

// SET REPLACEMENTS
for (let [key, value] of Object.entries(replacements)) {
  document.documentElement.style.setProperty(key, "url(" + chrome.runtime.getURL(value) + ")");
}

let show_border;

chrome.storage.local.get(
  [
    "mode",
    "dark_mode",
    "doc_bg",
    "custom_bg",
    "invert",
    "show_border",
    "updates",
    "accent_color",
    "button_options",
    "raise_button", // DEPRECATED BUT KEEP FOR BACKWARDS COMPATIBILITY
  ],
  function (data) {
    //////////
    // MODE //
    //////////

    if (data.mode != null) {
      mode = data.mode;
    } else {
      // SET DEFAULT MODE
      mode = mode_dark;
      chrome.storage.local.set({ mode: mode });
    }

    ///////////////////
    // MODE VARIANTS //
    ///////////////////

    if (data.dark_mode != null) {
      dark_mode_options = data.dark_mode;
    } else {
      // SET DEFAULT DARK MODE OPTIONS
      dark_mode_options = { variant: dark_mode_normal };
      chrome.storage.local.set({ dark_mode: dark_mode_options });
    }

    /////////////////////////
    // DOCUMENT BACKGROUND //
    /////////////////////////

    if (data.doc_bg != null) {
      let option = data.doc_bg;
      let custom = data.custom_bg;
      if (option == "custom") {
        document.documentElement.style.setProperty("--document_background", custom);
      } else {
        if (backgrounds[option]) {
          document.documentElement.style.setProperty("--document_background", backgrounds[option]);
        } else {
          console.error("Invalid background option");
        }
      }
    } else {
      // Use default_background background as default
      document.documentElement.style.setProperty(
        "--document_background",
        backgrounds[default_background]
      );
    }

    // HANDLE INVERT
    if (data.invert != null) {
      handle_document_invert(data.invert);
    } else {
      handle_document_invert(default_invert);
    }

    // HANDLE SHOW BORDER OPTION
    if (data.show_border != null) {
      show_border = data.show_border;
    } else {
      // Show border by default
      show_border = true;
    }

    //////////////////
    // ACCENT COLOR //
    //////////////////

    if (data.accent_color != null) {
      accent_color = data.accent_color;
      update_accent_color(data.accent_color);
    } else {
      // SET DEFAULT ACCENT COLOR
      accent_color = { hue: default_accent_hue };
      update_accent_color(accent_color);

      // SAVE DEFAULT ACCENT COLOR
      chrome.storage.local.set({ accent_color: { hue: default_accent_hue } });
    }

    ////////////
    // BUTTON //
    ////////////

    // NOTE: MUST BE CALLED BEFORE HANDLE_MODE

    // TODO: USE BACKGROUND WORKER TO CONSOLIDATE DEFAULT OPTIONS AND OPTION MIGRATION

    button_options = data.button_options;

    if (button_options == null) {
      // CHECK IMPORT RAISED BUTTON SETTING
      if (data.button_raised != null) {
        button_options = { show: true, raised: data.button_raised };
      } else {
        button_options = { show: true, raised: false };
      }

      chrome.storage.local.set({ button_options: button_options });
    }

    ////////////////////////////
    // HANDLE DOCUMENT BORDER //
    ////////////////////////////

    document.documentElement.style.setProperty("--document_border", show_border ? page_border : "none");
    document.documentElement.style.setProperty("--gm3_document_border", show_border ? gm3_page_border : "none");

    // Do not create notification if not needed

    // Show update notification if data.updates is not set or if it is
    // set but does not include the current version
    if ((data.updates && !data.updates.includes(version)) || !data.updates) {
      // Create notification
      let update_notification;

      update_notification = document.createElement("div");
      update_notification.id = "bb-update-notification";
      update_notification.style = update_notification_style;

      var update_text = document.createElement("span");
      update_text.textContent =
        "DocsAfterDark has been updated to version " +
        chrome.runtime.getManifest().version +
        ". Read update notes on ";
      update_text.style = update_text_style;

      var update_link = document.createElement("a");
      update_link.href = update_link_href;
      update_link.target = "_blank";
      update_link.textContent = "GitHub";
      update_link.style = update_link_style;
      update_text.appendChild(update_link);
      update_text.appendChild(document.createTextNode("."));

      var close_button = document.createElement("button");
      close_button.textContent = "Close";
      close_button.style = close_button_style;
      close_button.onclick = function () {
        update_notification.remove();
      };
      update_text.appendChild(close_button);
      update_notification.appendChild(update_text);

      // Insert notification into DOM
      document.body.prepend(update_notification);

      // Mark as seen in storage
      if (data.updates) {
        data.updates.push(version);
        chrome.storage.local.set({ updates: data.updates });
      } else {
        chrome.storage.local.set({ updates: [version] });
      }
    }

    /////////////////////
    // INVOKE HANDLERS //
    /////////////////////

    handle_mode();
  }
);

chrome.storage.onChanged.addListener(function (changes, area) {
  // Handle background change
  if (Object.keys(changes).includes("doc_bg")) {
    let option = changes.doc_bg.newValue;
    if (option != "custom") {
      if (backgrounds[option]) {
        document.documentElement.style.setProperty(
          "--document_background",
          backgrounds[option]
        );
      } else {
        console.error("Invalid background option");
      }
    } else {
      chrome.storage.local.get(["custom_bg"], function (data) {
        let custom = data.custom_bg;
        document.documentElement.style.setProperty(
          "--document_background",
          custom
        );
      });
    }
  }

  // Handle custom background change. This differs from above
  // because it is only called when doc_bg is already set
  // to "custom"
  if (Object.keys(changes).includes("custom_bg")) {
    var custom = changes.custom_bg.newValue;
    document.documentElement.style.setProperty(
      "--document_background",
      custom
    );
  }

  // Handle invert option change
  if (changes.invert != null) {
    handle_document_invert(changes.invert.newValue);
  }

  //////////
  // MODE //
  //////////

  if (changes.mode != null) {
    mode = changes.mode.newValue;
  }

  ///////////////////////
  // DARK MODE VARIANT //
  ///////////////////////

  if (changes.dark_mode != null) {
    dark_mode_options = changes.dark_mode.newValue;
  }

  ////////////
  // BUTTON //
  ////////////

  // NOTE: MUST BE CALLED BEFORE HANDLE_MODE

  if (changes.button_options != null) {
    button_options = changes.button_options.newValue;
    handle_button();
  }

  // Handle show border option change
  if (Object.keys(changes).includes("show_border")) {
    document.documentElement.style.setProperty(
      "--document_border",
      changes.show_border.newValue ? page_border : "none"
    );
  }

  // Handle show border option change
  if (Object.keys(changes).includes("show_border")) {
    document.documentElement.style.setProperty(
      "--gm3_document_border",
      changes.show_border.newValue ? gm3_page_border : "none"
    );
  }

  /////////////////////
  // INVOKE HANDLERS //
  /////////////////////

  if (changes.mode != null || changes.dark_mode != null) 
    handle_mode(); // ONLY HANDLE MODE IF THERE ARE CHANGES
});

// LISTEN FOR MESSAGES FROM POPUP
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "setAccentColor") {
    update_accent_color(request.color);
  }
});
