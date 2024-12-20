const head =
  document.head ||
  document.getElementsByTagName("head")[0] ||
  document.documentElement;
const version = chrome.runtime.getManifest().version;


const OFF_MODE = 0;
const LIGHT_MODE = 1;
const DARK_MODE = 2;
const DEFAULT_ACCENT_HUE = 88; // GREEN

const theme = "#90caf9";
const warning = "#90caf9";
const link_color = "#90caf9";
const invert_value = "invert(1)";
const grayscale_value = "contrast(82%) grayscale(100%)";
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

const static_light_mode_css_variables = {
  "--primary-text-color":     "#000000",
  "--secondary-text-color":   "#1A1A1A",
  "--tertiary-text-color":    "#333333",
  "--disabled-text":          "#666666",
};

const hsl_light_mode_css_variables = {
  "--root-background-color": {saturation: 20, lightness: 95},
  "--primary-background-color": {saturation: 20, lightness: 97.5},
  "--secondary-background-color": {saturation: 25, lightness: 90},
  "--tertiary-background-color": {saturation: 30, lightness: 85},
  "--quaternary-background-color": {saturation: 35, lightness: 80},
  "--background-color-5": {saturation: 40, lightness: 75}
};

const hsl_accent_color_css_variables = {
  "--accent-color": {saturation: 25, lightness: 50},
  "--light-accent-color": {saturation: 25, lightness: 60, alpha: 0.10},
  "--light-accent-hover-color": {saturation: 25, lightness: 40, alpha: 0.20},
  "--accent-hover-color": {saturation: 25, lightness: 60}
}

var mode;
var accent_color;

// DO NOT ENABLE DARK MODE ON GOOGLE DOCS HOMEPAGE
if (document.querySelector(".docs-homescreen-gb-container"))
  throw new Error("NOT ENABLING ON GOOGLE DOCS HOMEPAGE");

function inject_docs_css() {
  if (document.querySelector("#docs-dark-mode"))
    return;

  const css = document.createElement("link");
  css.setAttribute("href", chrome.runtime.getURL("docs.css"));
  css.id = "docs-dark-mode";
  css.rel = "stylesheet";

  document.body.insertBefore(css, document.body.lastChild);
}

function inject_dark_mode() {
  mode = DARK_MODE;

  inject_docs_css();
  remove_accent_color(); // TODO: USE ACCENT COLOR STILL IN DARK MODE

  insert_button();
}

function inject_light_mode() {
  mode = LIGHT_MODE;

  update_accent_color(accent_color);
  inject_docs_css();

  insert_button();
}

function remove_docsafterdark() {
  mode = OFF_MODE;

  if (document.querySelector("#docs-dark-mode"))
    document.querySelector("#docs-dark-mode").remove();

  if (document.querySelector("#dark-mode-switch"))
    document.querySelector("#dark-mode-switch").remove();
}

function insert_button() {
  if (document.querySelector("#dark-mode-switch"))
    return;

  let toggle_button = document.createElement("button");
  toggle_button.id = "dark-mode-switch";
  toggle_button.textContent = "🌞";
  toggle_button.onclick = function () {
    if (document.querySelector("#docs-dark-mode")) {
      document.querySelector("#docs-dark-mode").remove();
      this.textContent = "🌚";
      mode = false;
      //chrome.storage.local.set({ "gc-darkmode": false })
    } else {
      inject_dark_mode();
      this.textContent = "🌞";
      mode = true;
      //chrome.storage.local.set({ "gc-darkmode": true })
    }
  };

  document.body.insertBefore(toggle_button, document.body.lastChild);
}

function raise_button(condition) {
  document.documentElement.style.setProperty(
    "--dad-switch-position",
    condition ? "74px" : "24px"
  );
}

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

/**
 * Sets the accent color of the page.
 * 
 * @param {{hue: Number}} color 
 */
function update_accent_color(color) {
  accent_color = color;

  // SET CSS VARIABLES
  for (let [key, value] of Object.entries(static_light_mode_css_variables)) {
    document.documentElement.style.setProperty(key, value);
  }

  for (let [key, value] of Object.entries(hsl_light_mode_css_variables)) {
    document.documentElement.style.setProperty(key, rgbToHex(hslToRgb(color.hue, value.saturation, value.lightness)) + (value.alpha ? componentToHex(value.alpha * 255) : ""));
  }

  for (let [key, value] of Object.entries(hsl_accent_color_css_variables)) {
    document.documentElement.style.setProperty(key, rgbToHex(hslToRgb(color.hue, value.saturation, value.lightness)) + (value.alpha ? componentToHex(value.alpha * 255) : ""));
  }

  // document.documentElement.style.setProperty("--root-background-color", rootBackgroundColor);
  // document.documentElement.style.setProperty("--primary-background-color", primaryBackgroundColor);
  // document.documentElement.style.setProperty("--secondary-background-color", secondaryBackgroundColor);
  // document.documentElement.style.setProperty("--tertiary-background-color", tertiaryBackgroundColor);
  // document.documentElement.style.setProperty("--quaternary-background-color", quaternaryBackgroundColor);
  // document.documentElement.style.setProperty("--background-color-5", backgroundColor5);

  // document.documentElement.style.setProperty("--accent-color", primaryAccentColor);
  // document.documentElement.style.setProperty("--light-accent-color", primaryAccentColor + "1e");
  // document.documentElement.style.setProperty("--light-accent-hover-color", primaryAccentColor + "28");
  // document.documentElement.style.setProperty("--accent-hover-color", secondaryAccentColor);
}

function remove_accent_color() {
  for (let key of Object.keys(static_light_mode_css_variables)) {
    document.documentElement.style.removeProperty(key);
  }

  for (let key of Object.keys(hsl_light_mode_css_variables)) {
    document.documentElement.style.removeProperty(key);
  }

  for (let key of Object.keys(hsl_accent_color_css_variables)) {
    document.documentElement.style.removeProperty(key);
  }
}

function handle_mode(newMode) {
  mode = newMode;

  if (newMode == null) {
    // FIRST INVOCATION; ENABLE DARK MODE BY DEFAULT
    inject_dark_mode();
    chrome.storage.local.set({ mode: DARK_MODE });
    mode = DARK_MODE;
  } else if (newMode == DARK_MODE) {
    inject_dark_mode();
  } else if (newMode == LIGHT_MODE) {
    inject_light_mode();
  } else {
    // TURN OFF DOCSAFTERDARK
    remove_docsafterdark();
  }
}

/**
 * SET UP FUNCTION, ONLY CALLED ONCE
 */
function set_up() {
  document.documentElement.style.setProperty("--checkmark", "url(" + chrome.runtime.getURL("assets/checkmark.secondary.png") + ")");
  document.documentElement.style.setProperty("--revisions-sprite1", "url(" + chrome.runtime.getURL("assets/revisions_sprite1.secondary.svg") + ")");
  document.documentElement.style.setProperty("--close_18px", "url(" + chrome.runtime.getURL("assets/close_18px.svg") + ")");
  document.documentElement.style.setProperty("--lens", "url(" + chrome.runtime.getURL("assets/lens.svg") + ")");
  document.documentElement.style.setProperty("--jfk_sprite186", "url(" + chrome.runtime.getURL("assets/jfk_sprite186.edited.png") + ")");
  document.documentElement.style.setProperty("--dimension_highlighted", "url(" + chrome.runtime.getURL("assets/dimension-highlighted.edited.png") + ")");
  document.documentElement.style.setProperty("--dimension_unhighlighted", "url(" + chrome.runtime.getURL("assets/dimension-unhighlighted.edited.png") + ")");
  document.documentElement.style.setProperty("--access_denied", "url(" + chrome.runtime.getURL("assets/access_denied_transparent.png") + ")");
  document.documentElement.style.setProperty("--access_denied_600", "url(" + chrome.runtime.getURL("assets/access_denied_600_transparent.png") + ")");
  document.documentElement.style.setProperty("--gm_add_black_24dp", "url(" + chrome.runtime.getURL("assets/gm_add_black_24dp.png") + ")");

  let inverted;
  let grayscale;
  let show_border;

  chrome.storage.local.get(
    [
      "doc_bg",
      "custom_bg",
      "invert",
      "raise_button",
      "show_border",
      "updates",
      "accent_color"
    ],
    function (data) {
      console.log(data);
      if (Object.keys(data).includes("doc_bg")) {
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

      // Handle invert option
      if (Object.keys(data).includes("invert")) {
        inverted = data.invert.invert;
        grayscale = data.invert.grayscale;
      } else {
        // Enable inverted and grayscale by default
        inverted = true;
        grayscale = true;
      }

      // Handle show border option
      if (Object.keys(data).includes("show_border")) {
        show_border = data.show_border;
      } else {
        // Show border by default
        show_border = true;
      }

      //////////////////
      // ACCENT COLOR //
      //////////////////

      if (Object.keys(data).includes("accent_color")) {
        console.log("ACCENT COLOR", data.accent_color);

        accent_color = data.accent_color;

        update_accent_color(data.accent_color);
      } else {
        // SET DEFAULT ACCENT COLOR
        accent_color = { hue: DEFAULT_ACCENT_HUE };
        
        update_accent_color(accent_color);

        // SAVE DEFAULT ACCENT COLOR
        chrome.storage.local.set({ accent_color: { hue: DEFAULT_ACCENT_HUE } });
      }

      // Handle raise button option
      raise_button(
        Object.keys(data).includes("raise_button") ? data.raise_button : false
      );

      document.documentElement.style.setProperty("--document_invert", inverted ? (grayscale ? grayscale_value + " " : "") + invert_value : "none");
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
    }
  );

  chrome.storage.onChanged.addListener(function (changes, area) {
    console.log(changes, inverted);

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
    if (Object.keys(changes).includes("invert")) {
      console.log("INVERT CHANGED", inverted, changes);
      let invert_changes = changes.invert.newValue;
      inverted = invert_changes.invert;
      grayscale = invert_changes.grayscale;
      // Invert toggle property
      document.documentElement.style.setProperty(
        "--document_invert",
        inverted
          ? (grayscale ? grayscale_value + " " : "") + invert_value
          : "none"
      );
    }

    // HANDLE MODE CHANGE
    if (Object.keys(changes).includes("mode")) {
      handle_mode(changes.mode.newValue);
    }

    // Handle raise button option change
    if (Object.keys(changes).includes("raise_button")) {
      console.log("RAISE BUTTON CHANGED", changes);
      raise_button(changes.raise_button.newValue);
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
  });
}

set_up();

// Handle global toggle
chrome.storage.local.get(["mode"], function (data) {
  handle_mode(data.mode);
});

// LISTEN FOR MESSAGES FROM POPUP
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "setAccentColor") {
    update_accent_color(request.color);
  }
});
