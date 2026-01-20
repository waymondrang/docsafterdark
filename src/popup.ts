import { Logger } from "./logger";
import {
    DarkModeOperation,
    DocumentBackground,
    ExtensionMode,
    type MessagePayload,
    type ExtensionData,
} from "./types";
import {
    addClassToParent,
    getBrowserNamespace,
    getExtensionData,
    messageTabs,
    removeClassFromParent,
    setStorage,
    setStyleProperty,
} from "./util";
import { defaultExtensionData } from "./values";

const browser = getBrowserNamespace();
const VERSION = browser.runtime.getManifest().version;

// NOTE: Components that will update based on changes that happen to the global
//       state (coupled logic between managers) should implement the
//       StateSubscriber abstract class.

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
            // key is safe to cast to keyof ExtensionData
            await setStorage(key as keyof ExtensionData, value);
        }

        this.updateSubscribers();
    }

    cautiouslySetLocalData(updates: Partial<ExtensionData>) {
        Logger.debug("Cautiously updating data locally: ", updates);

        this.extensionData = { ...this.extensionData, ...updates };

        // NOTE: This will skip saving the fields into storage, meaning changes
        //       will NOT persist! You must handle any changes that must be
        //       persisted using setData().

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

class ModeComponent extends StateSubscriber {
    private modeButtons = document.querySelectorAll(
        "#modeDark, #modeLight, #modeOff"
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
                        this.state.setData({ mode: ExtensionMode.Off });
                        break;
                    case "dark":
                        this.state.setData({
                            mode: ExtensionMode.Dark,
                            doc_bg: DocumentBackground.Blend,
                            invert: {
                                ...this.state.getData().invert,
                                invert: true,
                            },
                        });
                        break;
                    case "light":
                        this.state.setData({
                            mode: ExtensionMode.Light,
                            doc_bg: DocumentBackground.Default,
                            invert: {
                                ...this.state.getData().invert,
                                invert: false,
                            },
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
                (button.value == "off" && newData.mode == ExtensionMode.Off) ||
                (button.value == "dark" &&
                    newData.mode == ExtensionMode.Dark) ||
                (button.value == "light" && newData.mode == ExtensionMode.Light)
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

class DarkModeComponent extends StateSubscriber {
    private normalButton = document.querySelector(
        "#darkModeNormal"
    ) as HTMLButtonElement;
    private midnightButton = document.querySelector(
        "#darkModeMidnight"
    ) as HTMLButtonElement;

    initialize() {
        this.normalButton.addEventListener("click", this.buttonHandler);
        this.midnightButton.addEventListener("click", this.buttonHandler);
    }

    update(newData: ExtensionData): void {
        this.resetButtons();

        if (newData.dark_mode.variant == DarkModeOperation.Normal) {
            this.normalButton.classList.add("selected");
        } else if (newData.dark_mode.variant == DarkModeOperation.Midnight) {
            this.midnightButton.classList.add("selected");
        } else {
            Logger.error("Unknown dark_mode variant option");
        }
    }

    private buttonHandler = (event: PointerEvent) => {
        const target = event.target as HTMLButtonElement;
        switch (target.value) {
            case "normal":
                this.state.setData({
                    dark_mode: { variant: DarkModeOperation.Normal },
                });
                break;
            case "midnight":
                this.state.setData({
                    dark_mode: { variant: DarkModeOperation.Midnight },
                });
                break;
        }
    };

    private resetButtons() {
        this.normalButton.classList.remove("selected");
        this.midnightButton.classList.remove("selected");
    }
}

class SpectrumComponent extends StateSubscriber {
    private input = document.querySelector(
        "#spectrumInput"
    ) as HTMLInputElement;
    private bar = document.querySelector("#spectrumBar") as HTMLDivElement;
    private knob = document.querySelector("#spectrumKnob") as HTMLDivElement;

    private isInputFocused: boolean = false;

    private knobOffset = 0;
    private isKnobDragging = false;

    // NOTE: We use the existence of the temp_accent_color storage item to
    //       determine if the user is exploring accent colors. temp_accent_color
    //       is only used for resuming the color exploration when the popup
    //       is closed and reopened.

    initialize(): void {
        this.input.addEventListener("input", () => {
            if (!this.input.value) {
                return;
            }

            // Clamp input value
            const hue = Math.min(
                Math.max(Number.parseInt(this.input.value), 0),
                360
            );
            this.input.value = hue.toString();

            this.state.setData({ accent_color: { hue: hue } });
        });

        this.input.addEventListener("focus", () => {
            this.isInputFocused = true;
        });

        this.input.addEventListener("blur", () => {
            this.isInputFocused = false;
        });

        this.bar.addEventListener("mousedown", (ev) => {
            if (this.isKnobDragging) return;

            this.isKnobDragging = true;

            // Position knob to mouse position
            this.handleKnobDrag(ev);

            const handleMouseUp = () => {
                document.removeEventListener("mousemove", this.handleKnobDrag);
                document.removeEventListener("mouseup", handleMouseUp);

                this.knobOffset = parseFloat(this.knob.style.left);
                this.isKnobDragging = false;

                this.state.setData({
                    accent_color: this.state.getData().accent_color,
                });
            };

            document.addEventListener("mousemove", this.handleKnobDrag);
            document.addEventListener("mouseup", handleMouseUp);
        });
    }

    update(newData: ExtensionData): void {
        if (!this.isInputFocused) {
            this.input.value = newData.accent_color.hue.toString();
        }

        if (!this.isKnobDragging) {
            this.updateKnob(newData.accent_color.hue);
        }
    }

    private handleKnobDrag = (ev: MouseEvent) => {
        this.knobOffset = Math.max(
            Math.min(
                ev.clientX -
                    this.bar.getBoundingClientRect().left -
                    this.knob.offsetWidth / 2,
                this.bar.offsetWidth - this.knob.offsetWidth
            ),
            0
        );

        const ratio =
            this.knobOffset / (this.bar.offsetWidth - this.knob.offsetWidth);
        const hue = Math.min(Math.max(Math.round(ratio * 360), 0), 360);

        // Set knob position (using left offset style)
        this.knob.style.left = this.knobOffset + "px";

        // Set background color (CSS hue range is [0, 360])
        this.knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

        this.state.cautiouslySetLocalData({ accent_color: { hue: hue } });
        messageTabs<MessagePayload>({
            type: "setAccentColor",
            color: { hue: hue },
        });
    };

    private updateKnob(hue: number) {
        const hueFraction = hue / 360;
        this.knobOffset =
            hueFraction * (this.bar.offsetWidth - this.knob.offsetWidth);

        this.knob.style.left = this.knobOffset + "px";
        // Set background color (CSS hue range is [0, 360])
        this.knob.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    }
}

class DocumentBackgroundComponent extends StateSubscriber {
    private buttons = document.querySelectorAll(
        "#documentBGDefault, #documentBGShade, #documentBGDark, #documentBGBlack, #documentBGCustom"
    ) as NodeListOf<HTMLButtonElement>;

    private customInput = document.querySelector(
        "#documentBGCustomInput"
    ) as HTMLInputElement;
    private customSave = document.querySelector(
        "#documentBGCustomSave"
    ) as HTMLButtonElement;
    private customContainer = document.querySelector(
        "#documentBGCustomContainer"
    ) as HTMLDivElement;

    initialize(): void {
        this.buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const data = this.state.getData();
                const value = button.value as DocumentBackground;
                const update: Partial<ExtensionData> = {
                    doc_bg: value,
                };

                // If background is default (white), always turn invert off
                // If background is black, always turn invert on
                // If background is anything else, invert based on theme

                if (value == DocumentBackground.Default) {
                    update.invert = {
                        ...data.invert,
                        invert: false,
                    };
                } else if (value == DocumentBackground.Black) {
                    update.invert = {
                        ...data.invert,
                        invert: true,
                    };
                } else if (value != DocumentBackground.Custom) {
                    update.invert = {
                        ...data.invert,
                        invert: data.mode == ExtensionMode.Dark,
                    };
                }

                this.state.setData(update);
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

class BorderComponent extends StateSubscriber {
    private showBorderCheckbox = document.querySelector(
        "#documentBorder"
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

class ButtonComponent extends StateSubscriber {
    private showButtonCheckbox = document.querySelector(
        "#showButton"
    ) as HTMLInputElement;
    private raiseButtonCheckbox = document.querySelector(
        "#raiseButton"
    ) as HTMLInputElement;

    initialize() {
        this.showButtonCheckbox.addEventListener("click", () => {
            this.state.setData({
                button_options: {
                    ...this.state.getData().button_options,
                    show: this.showButtonCheckbox.checked,
                },
            });
        });

        this.raiseButtonCheckbox.addEventListener("click", () => {
            this.state.setData({
                button_options: {
                    ...this.state.getData().button_options,
                    raised: this.raiseButtonCheckbox.checked,
                },
            });
        });
    }

    update(newData: ExtensionData): void {
        this.showButtonCheckbox.checked = newData.button_options.show;

        this.raiseButtonCheckbox.disabled = !newData.button_options.show;

        if (newData.button_options.show) {
            removeClassFromParent(this.raiseButtonCheckbox, "disabled");
        } else {
            addClassToParent(this.raiseButtonCheckbox, "disabled");
        }

        this.raiseButtonCheckbox.checked = newData.button_options.raised;
    }
}

class TipComponent {
    private tipButton = document.querySelector("#tipButton") as HTMLDivElement;
    private tipContainer = document.querySelector(
        "#tipContainer"
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

class DonateComponent {
    private donateButton = document.querySelector(
        "#donate"
    ) as HTMLButtonElement;

    initialize() {
        this.donateButton.addEventListener("click", function () {
            browser.tabs.create({
                url: "https://www.buymeacoffee.com/waymondrang",
            });
        });
    }
}

class InvertComponent extends StateSubscriber {
    private invertedCheckbox = document.querySelector(
        "#documentInverted"
    ) as HTMLInputElement;
    private grayscaleCheckbox = document.querySelector(
        "#documentGrayscale"
    ) as HTMLInputElement;
    private blackCheckbox = document.querySelector(
        "#documentBlack"
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
        this.invertedCheckbox.checked = newData.invert.invert;
        this.grayscaleCheckbox.checked = newData.invert.grayscale;
        this.blackCheckbox.checked = newData.invert.black;

        this.grayscaleCheckbox.disabled = !newData.invert.invert;
        this.blackCheckbox.disabled =
            !newData.invert.invert || !newData.invert.grayscale;

        if (newData.invert.invert) {
            removeClassFromParent(this.grayscaleCheckbox, "disabled");
        } else {
            addClassToParent(this.grayscaleCheckbox, "disabled");
        }

        if (!newData.invert.invert || !newData.invert.grayscale) {
            addClassToParent(this.blackCheckbox, "disabled");
        } else {
            removeClassFromParent(this.blackCheckbox, "disabled");
        }
    }
}

class VersionComponent {
    private versionElement = document.querySelector(
        "#version"
    ) as HTMLParagraphElement;

    initialize() {
        this.versionElement.textContent = `v${VERSION}`;
    }
}

class StyleManager extends StateSubscriber {
    initialize(): void {}

    update(newData: ExtensionData): void {
        setStyleProperty("accentHue", newData.accent_color.hue.toString());
    }
}

class Popup extends PopupState {
    private modeComponent: ModeComponent = new ModeComponent(this);
    private darkModeComponent: DarkModeComponent = new DarkModeComponent(this);
    private spectrumComponent: SpectrumComponent = new SpectrumComponent(this);
    private documentBackgroundComponent: DocumentBackgroundComponent =
        new DocumentBackgroundComponent(this);
    private borderComponent: BorderComponent = new BorderComponent(this);
    private buttonComponent: ButtonComponent = new ButtonComponent(this);
    private tipComponent: TipComponent = new TipComponent();
    private donateComponent: DonateComponent = new DonateComponent();
    private invertComponent: InvertComponent = new InvertComponent(this);
    private versionComponent: VersionComponent = new VersionComponent();

    private styleManager: StyleManager = new StyleManager(this);

    async initialize() {
        Logger.debug("Hello from DocsAfterDark Popup!");

        // Set the state's data in case any initialize functions need to
        // access it (ideally state is consumed during update function).
        const extensionData = await getExtensionData();
        this.setData(extensionData);

        this.modeComponent.initialize();
        this.darkModeComponent.initialize();
        this.spectrumComponent.initialize();
        this.documentBackgroundComponent.initialize();
        this.borderComponent.initialize();
        this.buttonComponent.initialize();
        this.tipComponent.initialize();
        this.donateComponent.initialize();
        this.invertComponent.initialize();
        this.versionComponent.initialize();
        this.styleManager.initialize();

        this.updateSubscribers();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const popup = new Popup();
    popup.initialize();
});
