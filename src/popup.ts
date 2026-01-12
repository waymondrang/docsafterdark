import { Logger } from "./logger";
import {
    DarkModeOperation,
    ExtensionOperation,
    type DarkModeOptions,
    type ExtensionData,
} from "./types";
import { getBrowserNamespace, setStorage } from "./util";
import { defaultExtensionData } from "./values";

const browser = getBrowserNamespace();
const VERSION = browser.runtime.getManifest().version;

// NOTE: The UI should prefer user responsiveness over correctness, meaning the
//       state of the UI should update before the underlying storage updates.
//       For example, in ModesManager, the selected class is immediately added
//       to the button element instead of updating the button in response to
//       a storage update.

// NOTE: Managers that will update based on changes that happen to the global
//       state (coupled logic between managers) should implement the
//       SubscribedManager abstract class.

class PopupState {
    // extensionData must not be directly mutated
    private extensionData: ExtensionData = defaultExtensionData;
    private subscribers: StateSubscriber[] = [];

    subscribe(subscriber: StateSubscriber) {
        this.subscribers.push(subscriber);
    }

    getData(): ExtensionData {
        // Use structuredClone instead of spread operator (...)
        return structuredClone(this.extensionData);
    }

    async setData(updates: Partial<ExtensionData>): Promise<void> {
        Logger.debug("Received data update: ", updates);

        this.extensionData = { ...this.extensionData, ...updates };

        // Update changed fields in storage
        for (const [key, value] of Object.entries(updates)) {
            await setStorage(key, value);
        }

        this.updateSubscribers();
    }

    updateSubscribers() {
        const newData = this.getData();
        for (const subscriber of this.subscribers) {
            subscriber.update(newData);
        }
    }
}

abstract class StateSubscriber {
    constructor(protected state: PopupState) {
        this.state.subscribe(this);
    }

    abstract initialize(): void;
    abstract update(newData: ExtensionData): void;
}

class OperationModeManager extends StateSubscriber {
    private modeButtons = document.querySelectorAll(
        "#modes button"
    ) as NodeListOf<HTMLButtonElement>;

    initialize() {
        Logger.debug(this.modeButtons);

        this.modeButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
                // NOTE: Only include state management logic here, as the
                //       view logic will reflect the internal state when the
                //       update() function is called.

                const target = event.currentTarget as HTMLButtonElement;

                Logger.debug(
                    "Operation mode button clicked with value: " + target.value
                );

                switch (target.value) {
                    case "off":
                        this.state.setData({ mode: ExtensionOperation.Off });
                        break;
                    case "dark":
                        this.state.setData({
                            mode: ExtensionOperation.DarkMode,
                        });
                        break;
                    case "light":
                        this.state.setData({
                            mode: ExtensionOperation.LightMode,
                        });
                        break;
                }
            });
        });
    }

    update(newData: ExtensionData) {
        this.resetButtons();

        this.modeButtons.forEach((button) => {
            if (
                (button.value == "off" &&
                    newData.mode == ExtensionOperation.Off) ||
                (button.value == "dark" &&
                    newData.mode == ExtensionOperation.DarkMode) ||
                (button.value == "light" &&
                    newData.mode == ExtensionOperation.LightMode)
            ) {
                button.classList.add("selected");
            }
        });
    }

    private resetButtons() {
        this.modeButtons.forEach((button) => {
            button.classList.remove("selected");
        });
    }
}

class DarkModeManager {
    private normalButton = document.querySelector(
        "#dark_mode_normal"
    ) as HTMLButtonElement;
    private midnightButton = document.querySelector(
        "#dark_mode_midnight"
    ) as HTMLButtonElement;

    initialize() {
        this.normalButton.addEventListener("click", this.handleButtonClick);
        this.midnightButton.addEventListener("click", this.handleButtonClick);
    }

    private handleButtonClick = (event: PointerEvent) => {
        this.resetButtons();

        const target = event.currentTarget as HTMLButtonElement;
        target.classList.add("selected");

        switch (target.value) {
            case "normal":
                setStorage("dark_mode", {
                    variant: DarkModeOperation.Normal,
                } as DarkModeOptions);
                break;
            case "midnight":
                setStorage("dark_mode", {
                    variant: DarkModeOperation.Midnight,
                } as DarkModeOptions);
                break;
        }
    };

    private resetButtons() {
        this.normalButton.classList.remove("selected");
        this.midnightButton.classList.remove("selected");
    }
}

class SpectrumManager {
    private input = document.querySelector("#spectrum_input");
    private save = document.querySelector("#spectrum_save");
    private reset = document.querySelector("#spectrum_reset");
    private bar = document.querySelector("#spectrum_bar");
    private knob = document.querySelector("#spectrum_knob");
}

class DocumentBackgroundManager {
    private container = document.querySelector("#document_bg_custom_container");
    private customInput = document.querySelector("#document_bg_custom_input");
    private customSave = document.querySelector("#document_bg_save_custom");
}

class BorderManager {
    private showBorderCheckbox = document.querySelector("#show_border");
}

class ButtonManager {
    private showButtonCheckbox = document.querySelector("#show_button");
    private raiseButtonCheckbox = document.querySelector("#raise_button");
}

class DonateManager {
    private tipButton = document.querySelector("#tip_button");
    private tipContainer = document.querySelector("#tip_container");
    private donateButton = document.querySelector("#donate");
}

class VersionManager {
    private versionElement = document.querySelector("#version");

    initialize() {
        if (!this.versionElement) {
            throw new Error("VersionManager missing elements");
        }

        this.versionElement.textContent = `v${VERSION}`;
    }
}

class Popup {
    private state: PopupState = new PopupState();

    private operationModesManager: OperationModeManager =
        new OperationModeManager(this.state);
    private darkModeManager: DarkModeManager = new DarkModeManager();
    private spectrumManager: SpectrumManager = new SpectrumManager();
    private documentBackgroundManager: DocumentBackgroundManager =
        new DocumentBackgroundManager();
    private borderManager: BorderManager = new BorderManager();
    private buttonManager: ButtonManager = new ButtonManager();
    private donateManager: DonateManager = new DonateManager();
    private versionManager: VersionManager = new VersionManager();

    initialize() {
        Logger.debug("Hello from DocsAfterDark Popup!");

        this.operationModesManager.initialize();

        this.state.updateSubscribers();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const popup = new Popup();
    popup.initialize();
});
