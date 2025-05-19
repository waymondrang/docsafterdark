///////////////
// NAMESPACE //
///////////////

var browser_namespace;

// PREFER BROWSER NAMESPACE OVER CHROME
if (typeof browser != "undefined") {
  console.log("\"BROWSER\" NAMESPACE FOUND");
  browser_namespace = browser;
} else if (typeof chrome != "undefined") {
  console.log("\"CHROME\" NAMESPACE FOUND");
  browser_namespace = chrome;
} else {
  throw new Error("COULD NOT FIND BROWSER NAMESPACE");
}

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

/**
 * HELPER FUNCTION TO SEND MESSAGES TO ACTIVE TAB
 * 
 * @param {*} message 
 */
function sendMessageToTabs(message) {
  try {
    browser_namespace.tabs.query(
      { active: true, currentWindow: true },
      function (tabs) {
        browser_namespace.tabs.sendMessage(tabs[0].id, message);
      }
    );
  } catch (e) {
    console.log(e);
  }
}

class update_storage_batch {
  constructor(storage_object) {
    this.storage_object = storage_object;
    this.storage = {};
  }

  /**
   * SETS THE STORAGE OBJECT
   * 
   * @param {String} storage_object 
   */
  set_storage_object(storage_object) {
    this.storage_object = storage_object;

    return this;
  }

  /**
   * SETS A KEY-VALUE PAIR
   * 
   * @param {String} key 
   * @param {*} value 
   */
  set(key, value) {
    this.storage[key] = value;

    return this;
  }

  /**
   * SAVES THE STORAGE OBJECT
   */
  update() {
    console.log("UPDATING STORAGE: " + this.storage_object + " WITH: " + JSON.stringify(this.storage));
    
    const that = this;

    browser_namespace.storage.local.get(this.storage_object, function (data) {
      if (data[that.storage_object] != null) {
        for (var key in that.storage) {
          data[that.storage_object][key] = that.storage[key];
        }
      } else {
        data[that.storage_object] = that.storage;
      }

      browser_namespace.storage.local.set({ [that.storage_object]: data[that.storage_object] });
    });
  }
}

/**
 * UPDATES A STORAGE OBJECT WITH A NEW KEY-VALUE PAIR
 * 
 * @param {String} storage_object 
 * @param {String} key 
 * @param {*} value 
 */
function update_storage(storage_object, key, value) {
  console.log("UPDATING STORAGE: " + storage_object + " KEY: " + key + " VALUE: " + value);

  browser_namespace.storage.local.get(storage_object, function (data) {
    if (data[storage_object] != null)
      data[storage_object][key] = value;
    else
      data[storage_object] = { [key]: value };
    
    browser_namespace.storage.local.set({ [storage_object]: data[storage_object] });
  });
}

/**
 * SETS A STORAGE OBJECT WITH A NEW VALUE
 * 
 * @param {String} storage_object
 * @param {*} value
 */
function set_storage(storage_object, value) {
  browser_namespace.storage.local.set({ [storage_object]: value });
}

/**
 * REMOVES A KEY FROM A STORAGE OBJECT
 * 
 * @param {String} key 
 */
function remove_storage(key) {
  browser_namespace.storage.local.remove(key);
}

/**
 * CLEARS ALL STORAGE
 */
function clear_storage() {
  browser_namespace.storage.local.clear();
}


///////////////
// VARIABLES //
///////////////

const mode_off            = 0;
const mode_light          = 1;
const mode_dark           = 2;
const mode_timer          = 3; 

const dark_mode_normal    = 0;
const dark_mode_eclipse   = 1;

const default_accent_hue  = 88; // GREEN
const default_background = "dark";

const document_bg_custom_container  = document.querySelector("#document_bg_custom_container");
const document_bg_custom_input      = document.querySelector("#document_bg_custom_input");
const document_bg_custom_save       = document.querySelector("#document_bg_save_custom");
const show_border                   = document.querySelector("#show_border");

var document_bg_option;
var selected_mode;

var document_inverted_state = false;

//Timing Related Variables for Switching on and Off. 
const timer_for_mode_switch         = document.querySelector("#timer_for_mode_switch");
const timer_set_times              = document.querySelector("#timer_save_times"); 
const timer_start_times             = document.querySelector("#startTime");
const timer_end_times             = document.querySelector("#endTime"); 

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

const manifestData = browser_namespace.runtime.getManifest();
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
    document.querySelectorAll("#modes button").forEach(function (e) {
      e.classList.remove("selected");
    });

    this.classList.add("selected");
    selected_mode = this.value;

    //
    if(selected_mode != "timer"){
      timer_for_mode_switch.classList.add("hidden");
    }
    else{
      timer_for_mode_switch.classList.remove("hidden");
      set_storage("mode", mode_timer)
    }
//
    if (selected_mode == "off") {
      set_storage("mode", mode_off);
    } 
  
    else if (selected_mode == "light") {
      set_storage("mode", mode_light);
      if (document_bg_option != "black" && document_bg_option != "custom") {
        // UPDATE INVERT CHECKBOXES
        document_inverted_checkbox.checked = false;
        checkbox_disable(document_inverted_grayscale_checkbox, true);
        checkbox_disable(document_inverted_black_checkbox, true);

        update_storage("invert", "invert", false);
      }
    } else if (selected_mode == "dark") {
      set_storage("mode", mode_dark);
      if (document_bg_option != "default" && document_bg_option != "custom") {
        // UPDATE INVERT CHECKBOXES
        document_inverted_checkbox.checked = true;
        checkbox_disable(document_inverted_grayscale_checkbox, false);
        checkbox_disable(document_inverted_black_checkbox, false);

        update_storage("invert", "invert", true);
      }
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

document.querySelectorAll("#document_bg_buttons button").forEach(function (e) {
  e.addEventListener("click", function (e) {
    document.querySelectorAll("#document_bg_buttons button").forEach(function (e) {
      e.classList.remove("selected");
    });

    this.classList.add("selected");
    document_bg_option = this.value;

    if (document_bg_option != "custom") {
      document_bg_custom_container.classList.add("hidden");
    } else {
      document_bg_custom_container.classList.remove("hidden");
    }
    
    // DO NOT MODIFY INVERT SETTINGS FOR CUSTOM BACKGROUND
    if (selected_mode == "light") {
      if (document_bg_option == "black") {
        document_inverted_checkbox.checked = true;      
        document_inverted_grayscale_checkbox.checked = true;
  
        let batch = new update_storage_batch("invert");
        batch.set("invert", true).set("grayscale", true).update();
      } else {
        document_inverted_checkbox.checked = false;
        update_storage("invert", "invert", false);
      }
    } else if (selected_mode == "dark") {
      if (document_bg_option == "default") {
        document_inverted_checkbox.checked = false;
        update_storage("invert", "invert", false);
      } else if (document_bg_option != "custom") {
        document_inverted_checkbox.checked = true;      
        document_inverted_grayscale_checkbox.checked = true;

        let batch = new update_storage_batch("invert");
        batch.set("invert", true).set("grayscale", true).update();
      }
    }

    document_inverted_state = document_inverted_checkbox.checked;
    checkbox_disable(document_inverted_grayscale_checkbox, !document_inverted_state);
    checkbox_disable(document_inverted_black_checkbox, !document_inverted_state || !document_inverted_grayscale_checkbox.checked);

    set_storage("doc_bg", document_bg_option);
  });
});

document_bg_custom_save.addEventListener("click", function (e) {
  if (document_bg_custom_input.value)
    set_storage("custom_bg", document_bg_custom_input.value);
});

// Add Timer Values to the Storage 
timer_set_times.addEventListener("click", function (e) {
  if(timer_start_times.value){
  set_storage("startTime", timer_start_times.value);
  set_storage("endTime", timer_end_times.value);
  }
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

  update_storage("invert", "grayscale", e.target.checked);
});

document_inverted_black_checkbox.addEventListener("click", function (e) {
  update_storage("invert", "black", e.target.checked);
});

////////////////////////////////
// END INVERT CLICK LISTENERS //
////////////////////////////////

show_border.addEventListener("click", function (e) {
  set_storage("show_border", e.target.checked);
});

donate.addEventListener("click", function (e) {
  browser_namespace.tabs.create({ url: "https://www.buymeacoffee.com/waymondrang" });
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
    set_storage("temp_accent_color", color);

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
  browser_namespace.storage.local.get("accent_color", function (data) {
    if (data.accent_color) {
      initiateKnob(data.accent_color.hue);
    } else {
      // SET DEFAULT ACCENT COLOR
      initiateKnob(default_accent_hue);
    }

    // DISABLE RESET AND SAVE BUTTONS AFTER RESET
    spectrum_reset.disabled = true;
    spectrum_save.disabled = true;

    // DO NOT SAVE TEMPORARY COLOR WHEN RESET
    handleTempColorChange({ hue: spectrum_input.value }, false);

    // REMOVE TEMPORARY COLOR
    remove_storage("temp_accent_color");
  });
});

/////////////////////
// SPECTRUM SAVING //
/////////////////////

spectrum_save.addEventListener("click", function (e) {
  if (spectrum_input.value) {
    // TODO: VALIDATE HUE VALUE

    // SAVE HUE TO STORAGE
    update_storage("accent_color", "hue", spectrum_input.value);

    // REMOVE TEMPORARY COLOR
    remove_storage("temp_accent_color");

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
  browser_namespace.storage.local.get(
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
      "endTime", 
      "startTime", 
      "raise_button", // DEPRECATED BUT KEEP FOR BACKWARDS COMPATIBILITY
      "on", // DEPRECATED BUT KEEP FOR BACKWARDS COMPATIBILITY
    ],
    function (data) {
      // TODO: REMOVE THESE VARIABLES AND INSTEAD USE data.XXX
      
      let custom_data   = data.custom_bg;
      let invert_data   = data.invert;
      let border_shown  = data.show_border;
      let setEndTime = data.endTime; 
      let setStartTime = data.startTime; 
      ////////////////////
      // PARSE SETTINGS //
      ////////////////////

      // RESET SETTINGS
      document.querySelectorAll("#modes button").forEach(function (e) {
        e.classList.remove("selected");
      });

      if (data.mode == null) {
        set_storage("mode", mode_dark);
        selected_mode = "dark";
      } else {
        if (data.mode == mode_off) {
          selected_mode = "off";
        } else if (data.mode == mode_light) {
          selected_mode = "light";
        } 
        else if(data.mode == mode_timer){
          selected_mode = "timer";
          timer_for_mode_switch.classList.remove("hidden");
          timer_start_times.value = setStartTime;
          timer_end_times.value = setEndTime; 

        }
        else {
          selected_mode = "dark";
        }
      }

      let selected_mode_button = document.querySelector(`#mode_${selected_mode}`);
      selected_mode_button.classList.add("selected");

      /////////////////////////
      // DOCUMENT BACKGROUND //
      /////////////////////////
      
      try {
        document_bg_option = data.doc_bg;

        if (document_bg_option == null) {
          // SET DEFAULT BACKGROUND
          document_bg_option = default_background;
          set_storage("doc_bg", document_bg_option);
        }

        var selected_option = document.querySelector(`#document_bg_${document_bg_option}`);
        selected_option.classList.add("selected");

        if (document_bg_option == "custom") {
          document_bg_custom_container.classList.remove("hidden");
          document_bg_custom_input.value = custom_data;
        }
      } catch (e) {
        console.log("ERROR SETTING DOCUMENT BACKGROUND");
        console.log(e);
      }

      ////////////
      // INVERT //
      ////////////

      if (invert_data == null) {
        // DEFAULT INVERT SETTINGS
        invert_data = { invert: true, grayscale: true, black: false };
        set_storage("invert", invert_data);
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

      /////////////////
      // SHOW BORDER //
      /////////////////

      if (border_shown == null) {
        border_shown = true;
        set_storage("show_border", border_shown);
      }

      show_border.checked = border_shown;

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

        set_storage("button_options", button_options);
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
        
        // SAVE DEFAULT ACCENT COLOR
        set_storage("accent_color", accent_color);
      }

      initiateKnob(accent_color.hue);
      setPopupAccentColor(accent_color);


      ///////////////////////
      // DARK MODE VARIANT //
      ///////////////////////

      if (data.dark_mode == null) {
        data.dark_mode = { variant: dark_mode_normal };
        set_storage("dark_mode", data.dark_mode);
      }

      dark_mode_normal_button.classList.remove("selected");
      dark_mode_eclipse_button.classList.remove("selected");
 
      if (data.dark_mode.variant == dark_mode_eclipse) {
        dark_mode_eclipse_button.classList.add("selected");
      } else if (data.dark_mode.variant == dark_mode_normal) {
        dark_mode_normal_button.classList.add("selected");
      } else {
        console.log("UNKNOWN DARK MODE VARIANT");
      }

      ///////////////////////////
      // END DARK MODE VARIANT //
      ///////////////////////////
    }
  );
} catch (e) {
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



