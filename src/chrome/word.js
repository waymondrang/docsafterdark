const head =
  document.head ||
  document.getElementsByTagName("head")[0] ||
  document.documentElement;
const version = chrome.runtime.getManifest().version;

const theme = "#90caf9";
const warning = "#90caf9";
const link_color = "#90caf9";
const invert_value = "invert(1)";
const grayscale_value = "contrast(79%) grayscale(100%)";
const page_border = "0 0 0 1px";
const gm3_page_border = "1px solid #404040";
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

var dark_mode_state;
var docs_homepage = document.querySelector(".docs-homescreen-gb-container");

function dad() {
  if (document.querySelector("#docs-dark-mode")) {
    return;
  }
  dark_mode_state = true;
  const css = document.createElement("link");
  css.setAttribute("href", chrome.runtime.getURL("docs.css"));
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
  let toggle_button = document.createElement("button");
  toggle_button.id = "dark-mode-switch";
  toggle_button.textContent = "🌞";
  toggle_button.onclick = function () {
    if (document.querySelector("#docs-dark-mode")) {
      document.querySelector("#docs-dark-mode").remove();
      this.textContent = "🌚";
      dark_mode_state = false;
      //chrome.storage.local.set({ "gc-darkmode": false })
    } else {
      dad();
      this.textContent = "🌞";
      dark_mode_state = true;
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

function set_up() {
  document.documentElement.style.setProperty(
    "--checkmark",
    "url(" + chrome.runtime.getURL("assets/checkmark.secondary.png") + ")"
  );
  document.documentElement.style.setProperty(
    "--revisions-sprite1",
    "url(" +
      chrome.runtime.getURL("assets/revisions_sprite1.secondary.svg") +
      ")"
  );
  document.documentElement.style.setProperty(
    "--close_18px",
    "url(" + chrome.runtime.getURL("assets/close_18px.svg") + ")"
  );
  document.documentElement.style.setProperty(
    "--lens",
    "url(" + chrome.runtime.getURL("assets/lens.svg") + ")"
  );
  document.documentElement.style.setProperty(
    "--jfk_sprite186",
    "url(" + chrome.runtime.getURL("assets/jfk_sprite186.edited.png") + ")"
  );
  document.documentElement.style.setProperty(
    "--dimension_highlighted",
    "url(" +
      chrome.runtime.getURL("assets/dimension-highlighted.edited.png") +
      ")"
  );
  document.documentElement.style.setProperty(
    "--dimension_unhighlighted",
    "url(" +
      chrome.runtime.getURL("assets/dimension-unhighlighted.edited.png") +
      ")"
  );
  document.documentElement.style.setProperty(
    "--access_denied",
    "url(" + chrome.runtime.getURL("assets/access_denied_transparent.png") + ")"
  );
  document.documentElement.style.setProperty(
    "--access_denied_600",
    "url(" +
      chrome.runtime.getURL("assets/access_denied_600_transparent.png") +
      ")"
  );
  document.documentElement.style.setProperty(
    "--gm_add_black_24dp",
    "url(" + chrome.runtime.getURL("assets/gm_add_black_24dp.png") + ")"
  );

  let inverted;
  let grayscale;
  let show_border;

  console.log("GETTING FROM STORAGE");
  chrome.storage.local.get(
    ["doc_bg", "custom_bg", "invert", "raise_button", "show_border", "updates"],
    function (data) {
      console.log(data);
      if (Object.keys(data).includes("doc_bg")) {
        let option = data.doc_bg;
        let custom = data.custom_bg;
        if (option == "custom") {
          document.documentElement.style.setProperty(
            "--document_background",
            custom
          );
        } else {
          if (backgrounds[option]) {
            document.documentElement.style.setProperty(
              "--document_background",
              backgrounds[option]
            );
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

      // Handle raise button option
      raise_button(
        Object.keys(data).includes("raise_button") ? data.raise_button : false
      );

      document.documentElement.style.setProperty(
        "--document_invert",
        inverted
          ? (grayscale ? grayscale_value + " " : "") + invert_value
          : "none"
      );

      document.documentElement.style.setProperty(
        "--document_border",
        show_border ? page_border : "none"
      );

      document.documentElement.style.setProperty(
        "--gm3_document_border",
        show_border ? gm3_page_border : "none"
      );

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

    // Handle toggle change
    if (Object.keys(changes).includes("on")) {
      if (changes.on.newValue) {
        dad();
      } else {
        remove_dad();
      }
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
chrome.storage.local.get(["on"], function (data) {
  // Initial installation state
  if (data.on == null) {
    dad();
    chrome.storage.local.set({ on: true }); // Enable by default
    dark_mode_state = true;
  } else if (data.on && !docs_homepage) {
    dad();
    dark_mode_state = true;
  }
});
