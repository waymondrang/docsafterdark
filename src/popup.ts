import { Logger } from "./logger";
import {
    DarkModeOperation,
    DocumentBackground,
    ExtensionOperation,
    type DarkModeOptions,
    type ExtensionData,
} from "./types";
import { getBrowserNamespace, getExtensionData, setStorage } from "./util";
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

class DocumentBackgroundManager extends StateSubscriber {
    private buttons = document.querySelectorAll(
        "#document_bg_buttons button"
    ) as NodeListOf<HTMLButtonElement>;
    private customContainer = document.querySelector(
        "#document_bg_custom_container"
    ) as HTMLDivElement;
    private customInput = document.querySelector(
        "#document_bg_custom_input"
    ) as HTMLInputElement;
    private customSave = document.querySelector(
        "#document_bg_save_custom"
    ) as HTMLButtonElement;

    initialize(): void {
        this.buttons.forEach((button) => {
            button.addEventListener("click", () => {
                this.state.setData({
                    doc_bg: button.value as DocumentBackground,
                });
            });
        });

        this.customSave.addEventListener("click", () => {
            this.state.setData({ custom_bg: this.customInput.value });
        });
    }

    private reset(): void {
        this.buttons.forEach((button) => {
            button.classList.remove("selected");
        });

        this.customContainer.classList.add("hidden");
    }

    update(newData: ExtensionData): void {
        this.reset();

        this.buttons.forEach((button) => {
            if (button.value == newData.doc_bg) {
                button.classList.add("selected");
            }
        });

        if (newData.doc_bg == DocumentBackground.Custom) {
            this.customContainer.classList.remove("hidden");
        }
    }
}

class BorderManager extends StateSubscriber {
    private showBorderCheckbox = document.querySelector(
        "#show_border"
    ) as HTMLInputElement;

    initialize(): void {
        this.showBorderCheckbox.addEventListener("click", () => {
            this.state.setData({
                show_border: this.showBorderCheckbox.checked,
            });
        });
    }

    update(newData: ExtensionData): void {
        this.showBorderCheckbox.checked = newData.show_border;
    }
}

class ButtonManager extends StateSubscriber {
    private showButtonCheckbox = document.querySelector(
        "#show_button"
    ) as HTMLInputElement;
    private raiseButtonCheckbox = document.querySelector(
        "#raise_button"
    ) as HTMLInputElement;

    initialize() {
        this.showButtonCheckbox.addEventListener("click", () => {
            const extensionData = this.state.getData();
            this.state.setData({
                button_options: {
                    ...extensionData.button_options,
                    show: this.showButtonCheckbox.checked,
                },
            });
        });

        this.raiseButtonCheckbox.addEventListener("click", () => {
            const extensionData = this.state.getData();
            this.state.setData({
                button_options: {
                    ...extensionData.button_options,
                    raised: this.raiseButtonCheckbox.checked,
                },
            });
        });
    }

    update(newData: ExtensionData): void {
        this.showButtonCheckbox.checked = newData.button_options.show;

        this.raiseButtonCheckbox.disabled = !newData.button_options.show;
        this.raiseButtonCheckbox.checked = newData.button_options.raised;
    }
}

class TipManager {
    private tipButton = document.querySelector("#tip_button") as HTMLDivElement;
    private tipContainer = document.querySelector(
        "#tip_container"
    ) as HTMLDivElement;

    initialize() {
        this.tipButton.addEventListener("mouseenter", () => {
            const timeoutHandle = setTimeout(() => {
                this.tipContainer.classList.remove("hidden");
            }, 250);

            this.tipButton.addEventListener("mouseleave", () => {
                clearTimeout(timeoutHandle);
            });
        });

        this.tipContainer.addEventListener("mouseleave", () => {
            this.tipContainer.classList.add("hidden");
        });
    }
}

class DonateManager {
    private donateButton = document.querySelector("#donate");
}

class InvertManager extends StateSubscriber {
    private invertedCheckbox = document.querySelector(
        "#document_inverted"
    ) as HTMLInputElement;
    private grayscaleCheckbox = document.querySelector(
        "#document_inverted_grayscale"
    ) as HTMLInputElement;
    private blackCheckbox = document.querySelector(
        "#document_inverted_black"
    ) as HTMLInputElement;

    initialize(): void {
        this.invertedCheckbox.addEventListener("click", () => {
            const extensionData = this.state.getData();
            this.state.setData({
                invert: {
                    ...extensionData.invert,
                    invert: this.invertedCheckbox.checked,
                },
            });
        });

        this.grayscaleCheckbox.addEventListener("click", () => {
            const extensionData = this.state.getData();
            this.state.setData({
                invert: {
                    ...extensionData.invert,
                    grayscale: this.grayscaleCheckbox.checked,
                },
            });
        });

        this.blackCheckbox.addEventListener("click", () => {
            const extensionData = this.state.getData();
            this.state.setData({
                invert: {
                    ...extensionData.invert,
                    // For sanity, also set grayscale to true in case user
                    // clicks black without first enabling grayscale
                    grayscale: true,
                    black: this.blackCheckbox.checked,
                },
            });
        });
    }

    update(newData: ExtensionData): void {
        this.grayscaleCheckbox.disabled = !newData.invert.invert;
        this.blackCheckbox.disabled = !newData.invert.invert;
    }
}

class VersionManager {
    private versionElement = document.querySelector(
        "#version"
    ) as HTMLParagraphElement;

    initialize() {
        this.versionElement.textContent = `v${VERSION}`;
    }
}

class Popup {
    private state: PopupState = new PopupState();

    private operationModesManager: OperationModeManager =
        new OperationModeManager(this.state);
    private buttonManager: ButtonManager = new ButtonManager(this.state);
    private invertManager: InvertManager = new InvertManager(this.state);

    private darkModeManager: DarkModeManager = new DarkModeManager();

    private tipManager: TipManager = new TipManager();

    private spectrumManager: SpectrumManager = new SpectrumManager();
    private documentBackgroundManager: DocumentBackgroundManager =
        new DocumentBackgroundManager(this.state);
    private borderManager: BorderManager = new BorderManager(this.state);
    private donateManager: DonateManager = new DonateManager();
    private versionManager: VersionManager = new VersionManager();

    async initialize() {
        Logger.debug("Hello from DocsAfterDark Popup!");

        // Set the state's data in case any initialize functions need to
        // access it (ideally state is consumed during update function)
        const extensionData = await getExtensionData();
        this.state.setData(extensionData);

        this.operationModesManager.initialize();
        this.tipManager.initialize();
        this.buttonManager.initialize();
        this.documentBackgroundManager.initialize();
        this.invertManager.initialize();
        this.versionManager.initialize();
        this.borderManager.initialize();

        this.state.updateSubscribers();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const popup = new Popup();
    popup.initialize();
});
