import { openMainWindow } from "./ui/MainWindow";

export function init() {
    if (typeof ui !== "undefined") {
        ui.registerMenuItem("Stat Requirements", () => {
            openMainWindow();
        });
    }
}