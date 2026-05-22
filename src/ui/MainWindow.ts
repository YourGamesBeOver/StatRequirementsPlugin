const WINDOW_CLASSIFICATION = "stat-requirements-plugin-main-window";

export function openMainWindow() {
    let window = ui.getWindow(WINDOW_CLASSIFICATION);
    if (window) {
        window.bringToFront();
    }
    if (window === null) {
        window = ui.openWindow({
            classification: WINDOW_CLASSIFICATION,
            title: "Stat Requirements",
            width: 400,
            height: 300,
            onClose: () => { },
            widgets: buildWidgets()
        });
    }
}

function buildWidgets(): WidgetDesc[] {
    return [
        {
            type: "label",
            text: "Stat Requirements Plugin",
            x: 10,
            y: 10,
            width: 200,
            height: 20
        }
    ];
}