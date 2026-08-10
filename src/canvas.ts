import { Logger } from "./logger";

Logger.debug("Hello from ephemeral canvas script!");

const originalFillText = CanvasRenderingContext2D.prototype.fillText;

CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
    Logger.debug("fillText:", text, "at", x, y, {
        fillStyle: this.fillStyle,
        font: this.font,
    });

    // "this" sample:
    // {
    //    "fillStyle": "#000000",
    //    "font": "14.6667px Arial"
    // }

    // This is a crude conversion. Because the fillStyle could be any CSS color,
    // a more robust solution should be used.

    if (this.fillStyle == "#000000") {
        this.fillStyle = "#ffffff";
    }

    return originalFillText.call(this, text, x, y, maxWidth);
};
