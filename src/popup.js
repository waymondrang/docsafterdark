///////////////
// NAMESPACE //
///////////////

let browser_namespace;

// Prefer browser namespace over chrome
if (typeof browser != "undefined") {
    console.log('"BROWSER" NAMESPACE FOUND');
    browser_namespace = browser;
} else if (typeof chrome != "undefined") {
    console.log('"CHROME" NAMESPACE FOUND');
    browser_namespace = chrome;
} else {
    throw new Error("COULD NOT FIND BROWSER NAMESPACE");
}

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

/**
 * Helper function to send messages to active tab
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
     * Sets the storage object
     *
     * @param {String} storage_object
     */
    set_storage_object(storage_object) {
        this.storage_object = storage_object;

        return this;
    }

    /**
     * Set a key-value pair
     *
     * @param {String} key
     * @param {*} value
     */
    set(key, value) {
        this.storage[key] = value;

        return this;
    }

    /**
     * Saves the storage object
     */
    update() {
        console.log(
            "UPDATING STORAGE: " +
                this.storage_object +
                " WITH: " +
                JSON.stringify(this.storage)
        );

        const that = this;

        browser_namespace.storage.local.get(
            this.storage_object,
            function (data) {
                if (data[that.storage_object] != null) {
                    for (let key in that.storage) {
                        data[that.storage_object][key] = that.storage[key];
                    }
                } else {
                    data[that.storage_object] = that.storage;
                }

                browser_namespace.storage.local.set({
                    [that.storage_object]: data[that.storage_object],
                });
            }
        );
    }
}

/**
 * Updates a storage object with a new key-value pair
 *
 * @param {String} storage_object
 * @param {String} key
 * @param {*} value
 */
function update_storage(storage_object, key, value) {
    console.log(
        "UPDATING STORAGE: " +
            storage_object +
            " KEY: " +
            key +
            " VALUE: " +
            value
    );

    browser_namespace.storage.local.get(storage_object, function (data) {
        if (data[storage_object] != null) data[storage_object][key] = value;
        else data[storage_object] = { [key]: value };

        browser_namespace.storage.local.set({
            [storage_object]: data[storage_object],
        });
    });
}

/**
 * Sets a storage object with a new value
 *
 * @param {String} storage_object
 * @param {*} value
 */
function set_storage(storage_object, value) {
    browser_namespace.storage.local.set({ [storage_object]: value });
}

/**
 * Removes a key from a storage object
 *
 * @param {String} key
 */
function remove_storage(key) {
    browser_namespace.storage.local.remove(key);
}

/**
 * Clears all storage
 */
function clear_storage() {
    browser_namespace.storage.local.clear();
}

///////////////
// VARIABLES //
///////////////

const mode_off = 0;
const mode_light = 1;
const mode_dark = 2;

const dark_mode_normal = 0;
const dark_mode_eclipse = 1;

const default_accent_hue = 88; // Green
const default_background = "dark";

const document_bg_custom_container = document.querySelector(
    "#document_bg_custom_container"
);
const document_bg_custom_input = document.querySelector(
    "#document_bg_custom_input"
);
const document_bg_custom_save = document.querySelector(
    "#document_bg_save_custom"
);
const show_border = document.querySelector("#show_border");

let document_bg_option;
let selected_mode;

let document_inverted_state = false;

// Dark mode variants
const dark_mode_normal_button = document.querySelector("#dark_mode_normal");
const dark_mode_eclipse_button = document.querySelector("#dark_mode_eclipse");

// Document options
const document_inverted_checkbox = document.querySelector("#document_inverted");
const document_inverted_grayscale_checkbox = document.querySelector(
    "#document_inverted_grayscale"
);
const document_inverted_black_checkbox = document.querySelector(
    "#document_inverted_black"
);

// Button options
const show_button_checkbox = document.querySelector("#show_button");
const raise_button_checkbox = document.querySelector("#raise_button");

// Tip
const tip_button = document.querySelector("#tip_button");
const tip_container = document.querySelector("#tip_container");

const donate = document.querySelector("#donate");

const spectrum_input = document.querySelector("#spectrum_input");
const spectrum_save = document.querySelector("#spectrum_save");
const spectrum_reset = document.querySelector("#spectrum_reset");
const spectrum_bar = document.querySelector("#spectrum_bar");
const spectrum_knob = document.querySelector("#spectrum_knob");

let descriptions = {
    default: "The default, white background.",
    shade: "A light shade of gray. Black text is still readable.",
    // A special, dark gray. This background is unaffected by the invert option.
    dark: "A dark gray. Black text will become hard to read and color changes may be be required.",
    black: "A complet ely black background.",
    custom: "Any valid CSS declaration for the background property may be used here.",
};

const manifestData = browser_namespace.runtime.getManifest();
const version = manifestData.version;
const versionElement = document.querySelector("#version");
versionElement.textContent = version ? "v" + version : "";

/**
 * Disables a checkbox and adds a disabled class to the parent element
 *
 * @param {HTMLInputElement} checkbox
 * @param {Boolean} disabled
 */
function checkbox_disable(checkbox, disabled) {
    checkbox.disabled = disabled;
    if (disabled) checkbox.parentElement.classList.add("disabled");
    else checkbox.parentElement.classList.remove("disabled");
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

        if (selected_mode == "off") {
            set_storage("mode", mode_off);
        } else if (selected_mode == "light") {
            set_storage("mode", mode_light);

            if (
                document_bg_option != "black" &&
                document_bg_option != "custom"
            ) {
                // Update invert checkboxes
                document_inverted_checkbox.checked = false;
                checkbox_disable(document_inverted_grayscale_checkbox, true);
                checkbox_disable(document_inverted_black_checkbox, true);

                update_storage("invert", "invert", false);
            }
        } else if (selected_mode == "dark") {
            set_storage("mode", mode_dark);

            if (
                document_bg_option != "default" &&
                document_bg_option != "custom"
            ) {
                // Update invert checkboxes
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

    // Update invert settings
    document_inverted_black_checkbox.checked = false;

    update_storage("dark_mode", "variant", dark_mode_normal);
    update_storage("invert", "black", false);
});

dark_mode_eclipse_button.addEventListener("click", (e) => {
    dark_mode_normal_button.classList.remove("selected");
    e.target.classList.add("selected");

    // Update invert settings
    document_inverted_black_checkbox.checked = true;

    update_storage("dark_mode", "variant", dark_mode_eclipse);
    update_storage("invert", "black", true);
});

tip_button.addEventListener("mouseenter", (e) => {
    // Wait before showing tip
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
        document
            .querySelectorAll("#document_bg_buttons button")
            .forEach(function (e) {
                e.classList.remove("selected");
            });

        this.classList.add("selected");
        document_bg_option = this.value;

        if (document_bg_option != "custom") {
            document_bg_custom_container.classList.add("hidden");
        } else {
            document_bg_custom_container.classList.remove("hidden");
        }

        // Do not modify invert settings for custom background
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
        checkbox_disable(
            document_inverted_grayscale_checkbox,
            !document_inverted_state
        );
        checkbox_disable(
            document_inverted_black_checkbox,
            !document_inverted_state ||
                !document_inverted_grayscale_checkbox.checked
        );

        set_storage("doc_bg", document_bg_option);
    });
});

document_bg_custom_save.addEventListener("click", function (e) {
    if (document_bg_custom_input.value)
        set_storage("custom_bg", document_bg_custom_input.value);
});

////////////////////////////
// INVERT CLICK LISTENERS //
////////////////////////////

document_inverted_checkbox.addEventListener("click", function (e) {
    document_inverted_state = e.target.checked;

    checkbox_disable(
        document_inverted_grayscale_checkbox,
        !document_inverted_state
    );
    checkbox_disable(
        document_inverted_black_checkbox,
        !document_inverted_state ||
            !document_inverted_grayscale_checkbox.checked
    );

    // TODO: Separate invert from invert options or consolidate options into
    //       document options

    update_storage("invert", "invert", document_inverted_state);
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
    browser_namespace.tabs.create({
        url: "https://www.buymeacoffee.com/waymondrang",
    });
});

/**
 * Called when the color picker changes for previewing temporary color changes
 *
 * @param {{hue: Number}} color
 */
function handleTempColorChange(color, saveToStorage = true) {
    sendMessageToTabs({
        type: "setAccentColor",
        color: color,
    });

    // Save temporary color to storage
    if (saveToStorage) set_storage("temp_accent_color", color);

    // Set popup accent color
    setPopupAccentColor(color);
}

////////////////////////////
// SET POPUP ACCENT COLOR //
////////////////////////////

function setPopupAccentColor(color) {
    document.documentElement.style.setProperty(
        "--docsafterdark-accent-hue",
        color.hue
    );
}

////////////////////
// SPECTRUM INPUT //
////////////////////

spectrum_input.addEventListener("input", function (e) {
    if (spectrum_input.value) {
        // Enable reset and save buttons
        spectrum_reset.disabled = false;
        spectrum_save.disabled = false;

        // Clamp input value
        spectrum_input.value = Math.min(Math.max(spectrum_input.value, 0), 360);

        // Set knob position (using left offset)
        let fraction = spectrum_input.value / 360;
        let offset =
            fraction * (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
        spectrum_knob.style.left = offset + "px";

        // Set background color (CSS hue range is [0, 360])
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
            // Set default accent color
            initiateKnob(default_accent_hue);
        }

        // Disable reset and save buttons after reset
        spectrum_reset.disabled = true;
        spectrum_save.disabled = true;

        // Do not save temporary color when reset
        handleTempColorChange({ hue: spectrum_input.value }, false);

        // Remove temporary color
        remove_storage("temp_accent_color");
    });
});

/////////////////////
// SPECTRUM SAVING //
/////////////////////

spectrum_save.addEventListener("click", function (e) {
    if (spectrum_input.value) {
        // TODO: Validate hue value

        // Save hue to storage
        update_storage("accent_color", "hue", spectrum_input.value);

        // Remove temporary color
        remove_storage("temp_accent_color");

        console.log("SAVED ACCENT HUE VALUE: " + spectrum_input.value);

        // Disable reset and save buttons after saving
        spectrum_reset.disabled = true;
        spectrum_save.disabled = true;
    }
});

////////////////////////////
// SPECTRUM KNOB DRAGGING //
////////////////////////////

let mouseStartPosition = 0;
let knobOffset = 0;
let knobDragging = false;

function initiateKnob(hue) {
    let fraction = hue / 360;
    let offset =
        fraction * (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);

    // Set knob position (using left offset)
    spectrum_knob.style.left = offset + "px";

    // Set background color (CSS hue range is [0, 360])
    spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    // Set input value
    spectrum_input.value = hue;

    // Update knob offset
    knobOffset = offset;
}

function moveKnob(e) {
    // Enable reset and save buttons
    spectrum_reset.disabled = false;
    spectrum_save.disabled = false;

    let relativeMovement = e.clientX - mouseStartPosition;
    let offset = Math.min(
        Math.max(knobOffset + relativeMovement, 0),
        spectrum_bar.offsetWidth - spectrum_knob.offsetWidth
    );
    let fraction =
        offset / (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
    let hue = Math.min(Math.max(Math.round(fraction * 360), 0), 360);

    // Set knob position (using left offset)
    spectrum_knob.style.left = offset + "px";

    // Set background color (CSS hue range is [0, 360])
    spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    // Set input value
    spectrum_input.value = hue;

    handleTempColorChange({ hue: hue });
}

spectrum_knob.addEventListener("mousedown", function (e) {
    if (knobDragging) return;

    e.preventDefault();

    // Set dragging flag
    knobDragging = true;

    // Save mouse start position
    mouseStartPosition = e.clientX;

    document.addEventListener("mousemove", moveKnob);
    document.addEventListener("mouseup", function (e) {
        document.removeEventListener("mousemove", moveKnob);

        // Update knob offset
        knobOffset = parseFloat(spectrum_knob.style.left);

        // Unset dragging flag
        knobDragging = false;
    });
});

spectrum_bar.addEventListener("mousedown", function (e) {
    if (knobDragging) return;

    e.preventDefault();

    // Set dragging flag
    knobDragging = true;

    let offset = Math.max(
        Math.min(
            e.clientX -
                spectrum_bar.getBoundingClientRect().left -
                spectrum_knob.offsetWidth / 2,
            spectrum_bar.offsetWidth - spectrum_knob.offsetWidth
        ),
        0
    );

    // Update knob offset
    knobOffset = offset;

    // Save mouse start position
    mouseStartPosition = e.clientX;

    // Set knob position (using left offset)
    spectrum_knob.style.left = offset + "px";

    // Set background color (CSS hue range is [0, 360])
    let fraction =
        offset / (spectrum_bar.offsetWidth - spectrum_knob.offsetWidth);
    let hue = Math.min(Math.max(Math.round(fraction * 360), 0), 360);
    spectrum_knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    // Set input value
    spectrum_input.value = hue;

    // Enable reset and save buttons
    spectrum_reset.disabled = false;
    spectrum_save.disabled = false;

    // Send message to active tab (TODO: All docs tabs)
    handleTempColorChange({ hue: hue });

    document.addEventListener("mousemove", moveKnob);
    document.addEventListener("mouseup", function (e) {
        document.removeEventListener("mousemove", moveKnob);

        // Unset dragging flag
        knobDragging = false;

        // Update knob offset
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
            "raise_button", // Deprecated but keep for backwards compatibility
            "on", // Deprecated but keep for backwards compatibility
        ],
        function (data) {
            // TODO: Remove these variables and instead use data.xxx

            let custom_data = data.custom_bg;
            let invert_data = data.invert;
            let border_shown = data.show_border;

            ////////////////////
            // PARSE SETTINGS //
            ////////////////////

            // Reset settings
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
                } else {
                    selected_mode = "dark";
                }
            }

            let selected_mode_button = document.querySelector(
                `#mode_${selected_mode}`
            );
            selected_mode_button.classList.add("selected");

            /////////////////////////
            // DOCUMENT BACKGROUND //
            /////////////////////////

            try {
                document_bg_option = data.doc_bg;

                if (document_bg_option == null) {
                    // Set default background
                    document_bg_option = default_background;
                    set_storage("doc_bg", document_bg_option);
                }

                let selected_option = document.querySelector(
                    `#document_bg_${document_bg_option}`
                );
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
                // Default invert settings
                invert_data = { invert: true, grayscale: true, black: false };
                set_storage("invert", invert_data);
            }

            document_inverted_checkbox.checked = invert_data.invert;
            document_inverted_grayscale_checkbox.checked =
                invert_data.grayscale;
            document_inverted_black_checkbox.checked = invert_data.black;

            checkbox_disable(
                document_inverted_grayscale_checkbox,
                !invert_data.invert
            );
            checkbox_disable(
                document_inverted_black_checkbox,
                !invert_data.grayscale || !invert_data.invert
            );

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
                // Check import raised button setting
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

            // Set default accent color
            let accent_color = { hue: default_accent_hue };

            if (data.temp_accent_color) {
                accent_color = data.temp_accent_color;
                // Enable reset and save buttons
                spectrum_reset.disabled = false;
                spectrum_save.disabled = false;
            } else if (data.accent_color) {
                accent_color = data.accent_color;
                // Disable reset and save buttons (sanity)
                spectrum_reset.disabled = true;
                spectrum_save.disabled = true;
            } else {
                spectrum_reset.disabled = true;
                spectrum_save.disabled = true;

                // Save default accent color
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
