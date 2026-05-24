import { getStatRequirementsForRide } from "../data/StatRequirements";

const WINDOW_CLASSIFICATION = "stat-requirements-plugin-main-window";

let selectedRide: Ride | null = null;

export function openMainWindow() {
    let hooks: IDisposable[] = [];
    let window = ui.getWindow(WINDOW_CLASSIFICATION);
    if (window) {
        window.bringToFront();
    }
    if (window === null) {
        selectedRide = null;
        window = ui.openWindow({
            classification: WINDOW_CLASSIFICATION,
            title: "Stat Requirements",
            width: 300,
            height: 300,
            onClose: () => {
                hooks.forEach(hook => hook.dispose());
            },
            widgets: buildWidgets()
        });
        bindHooks(window, hooks);
        refreshStatsForSelectedRide(window);
    }
}

function buildWidgets(): WidgetDesc[] {
    return [
        {
            type: "label",
            text: "Select a ride:",
            x: 5,
            y: 15,
            width: 200,
            height: 15
        },
        {
            type: "dropdown",
            x: 5,
            y: 30,
            width: 280,
            height: 15,
            name: "ride-dropdown",
            items: map.rides.filter(x => x.classification == "ride").map(ride => ride.name),
            selectedIndex: selectedRide ? map.rides.filter(x => x.classification == "ride").findIndex(ride => ride.id === selectedRide?.id) : -1,
            onChange: (index) => {
                const window = ui.getWindow(WINDOW_CLASSIFICATION);
                if (!window) return;
                const ride = map.rides.filter(x => x.classification == "ride")[index];
                selectedRide = ride || null;
                if (selectedRide) {
                    refreshStatsForSelectedRide(window);
                }
            }
        },
        {
            type: "label",
            text: "",
            name: "output-label",
            x: 5,
            y: 50,
            width: 380,
            height: 250
        }
    ];
}

function refreshStatsForSelectedRide(window: Window) {
    if (selectedRide) {
        const statRequirements = getStatRequirementsForRide(selectedRide.type);
        if (!statRequirements || statRequirements.length === 0) {
            window.findWidget<LabelWidget>("output-label").text =
                "No stat requirements for this ride.";
        } else {
            const isTested = (selectedRide.flags & (1 << 1)) !== 0;
            let statText = "";
            if (!isTested) {
                statText += "(Ride not yet tested!)\n";
            }
            for (const req of statRequirements) {
                if (isTested) {
                    if (req.isMetByRide(selectedRide)) {
                        statText += context.formatString("{GREEN}\u2713{WHITE} "); // checkmark
                    } else {
                        statText += context.formatString("{RED}X{WHITE} "); // x mark
                    }
                } else {
                    statText += context.formatString("{GRAY}?{WHITE} "); // question mark
                }
                statText += `${req.getDisplayName()}`;
                if (req.relaxIfInversions) {
                    statText += " (ignored if inversions)\n";
                } else {
                    statText += "\n";
                }
                statText += `Required: ${req.getFormattedValue(req.threshold)}`;
                if (isTested) {
                    statText += `, Actual: ${req.getFormattedValue(req.extractValueFromRide(selectedRide)) ?? "N/A"}`;
                }
                statText += "\n\n";
            }
            window.findWidget<LabelWidget>("output-label").text = statText;
        }
    } else {
        window.findWidget<LabelWidget>("output-label").text = "No ride selected";
    }
}

function bindHooks(window: Window, hooks: IDisposable[]) {
    const dropdown = window.findWidget<DropdownWidget>("ride-dropdown");
    // no idea if this is the right hook to use...
    hooks.push(context.subscribe("interval.tick", () => {
        dropdown.items = map.rides.filter(x => x.classification == "ride").map(ride => ride.name);
        refreshStatsForSelectedRide(window);
    }));
}