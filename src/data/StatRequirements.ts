import json from "./ride-stat-requirements.json";

/**
 * Raw values from the json.
 */
export type StatRequirementRaw = {
    type: string;
    threshold: number;
    e: number;
    i: number;
    n: number;
    // this stat requirement is ignored if the ride has inversions.
    relaxIfInversions?: boolean;
}

/**
 * Base class for stat requirements.
 * Each specific requirement has a subclass.
 */
export abstract class StatRequirement {
    public type: string;
    public threshold: number;
    public e: number;
    public i: number;
    public n: number;
    public relaxIfInversions: boolean;
    constructor(
        raw: StatRequirementRaw
    ) {
        this.type = raw.type;
        this.threshold = raw.threshold;
        this.e = raw.e;
        this.i = raw.i;
        this.n = raw.n;
        this.relaxIfInversions = raw.relaxIfInversions ?? false;
    }

    public abstract extractValueFromRide(ride: Ride): number | null;

    public abstract getDisplayName(): string;

    public abstract getFormattedValue(value: number | null): string;

    public isMetByRide(ride: Ride): boolean {
        if (this.relaxIfInversions && ride.numInversions > 0) {
            return true;
        }
        const value = this.extractValueFromRide(ride);
        if (value === null) {
            return false; // if we can't get the stat, assume it's not met
        }
        return value >= this.threshold;
    }
}

export class StatRequirementLength extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.stations[0]?.length || 0;
    }

    public override getDisplayName() {
        return "Minimum Length";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{LENGTH}{WHITE}", value);
    }
}

export class StatRequirementDropHeight extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.highestDropHeight;
    }

    public override getDisplayName() {
        return "Minimum Drop Height";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{HEIGHT}{WHITE}", value);
    }
}

export class StatRequirementMaxSpeed extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.maxSpeed;
    }

    public override getDisplayName() {
        return "Minimum Max Speed";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{VELOCITY}{WHITE}", value);
    }
}

export class StatRequirementNumDrops extends StatRequirement {
    constructor(raw: StatRequirementRaw) {
        super(raw);
    }

    public override extractValueFromRide(ride: Ride): number {
        return ride.numDrops;
    }

    public override getDisplayName() {
        return "Minimum Number of Drops";
    }
    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{COMMA32}{WHITE}", value);
    }
}

export class StatRequirementNegativeGs extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.maxNegativeVerticalGs;
    }

    public override getDisplayName() {
        return "Minimum Negative Gs";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString(`{BLACK}${value}{WHITE}`);
    }

    public override isMetByRide(ride: Ride): boolean {
        if (this.relaxIfInversions && ride.numInversions > 0) {
            return true;
        }
        const value = this.extractValueFromRide(ride);
        if (value === null) {
            return false; // if we can't get the stat, assume it's not met
        }
        return value < this.threshold; // negative Gs are less than 0, so we check if it's less than the threshold
    }
}

export class StatRequirementLateralGs extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.maxLateralGs;
    }

    public override getDisplayName() {
        return "Minimum Lateral Gs";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString(`{BLACK}${value}{WHITE}`);
    }
}

export class StatRequirementInversions extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.numInversions;
    }

    public override getDisplayName() {
        return "Minimum Inversions";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{COMMA32}{WHITE}", value);
    }
}

export class StatRequirementUnsheltered extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        const shelteredLength = ride.shelteredLength;
        const totalLength = ride.rideLength;
        return Math.min(7, Math.floor(shelteredLength / Math.floor(totalLength / 8)));
    }

    public override getDisplayName() {
        return "Ride must be mostly unsheltered";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{COMMA32}{WHITE}", value);
    }

    public override isMetByRide(ride: Ride): boolean {
        if (this.relaxIfInversions && ride.numInversions > 0) {
            return true;
        }
        const shelteredEighths = this.extractValueFromRide(ride);
        return shelteredEighths < this.threshold;
    }
}

export class StatRequirementReversals extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        // we have to walk the track to find this
        const station = ride.stations.find(s => s && s.start);
        if (!station) return 0;
        const start = station.start;
        const tile = map.getTile(start.x / 32, start.y / 32);
        const elementIndex = tile.elements.findIndex(e => e.type === "track" && e.baseZ === start.z && (e as TrackElement).ride === ride.id);
        if (elementIndex < 0) return 0;

        const iter = map.getTrackIterator(start, elementIndex);
        if (!iter) return 0;

        const startX = iter.position.x;
        const startY = iter.position.y;
        const startZ = iter.position.z;
        const startD = iter.position.direction;

        let count = 0;
        // cap search distance for safety
        for (let searchDistance = 0; searchDistance < 10000; searchDistance++) {
            const t = iter.segment?.type;
            // left and right reverser
            if (t === 211 || t === 212) {
                count++;
            }
            if (!iter.next()) break; // dead-end track
            const p = iter.position;
            // if we've looped all the way back to the start, stop searching
            if (p.x === startX && p.y === startY && p.z === startZ && p.direction === startD) {
                break;
            }
        }
        return count;
    }

    public override getDisplayName() {
        return "Minimum Reversals";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{COMMA32}{WHITE}", value);
    }
}

export class StatRequirementHoles extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.numHoles;
    }

    public override getDisplayName() {
        return "Minimum Holes";
    }

    public override getFormattedValue(value: number): string {
        return context.formatString("{BLACK}{COMMA32}{WHITE}", value);
    }
}

export class StatRequirementStations extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.stations.filter(x => x && x.start).length;
    }

    public override getDisplayName() {
        return "Minimum Stations";
    }

    public override getFormattedValue(value: number): string {
        return String(value);
    }
}

export class StatRequirementSplashdown extends StatRequirement {
    public override extractValueFromRide(ride: Ride): number {
        return ride.hasWaterSplash ? 1 : 0;
    }

    public override getDisplayName() {
        return "Requires Splashdown";
    }

    public override getFormattedValue(value: number): string {
        return value ? "Yes" : "No";
    }
}

function createStatRequirement(raw: StatRequirementRaw): StatRequirement | null {
    switch (raw.type) {
        case "RequirementLength":
            return new StatRequirementLength(raw);
        case "RequirementDropHeight":
            return new StatRequirementDropHeight(raw);
        case "RequirementMaxSpeed":
            return new StatRequirementMaxSpeed(raw);
        case "RequirementNumDrops":
            return new StatRequirementNumDrops(raw);
        case "RequirementNegativeGs":
            return new StatRequirementNegativeGs(raw);
        case "RequirementLateralGs":
            return new StatRequirementLateralGs(raw);
        case "RequirementInversions":
            return new StatRequirementInversions(raw);
        case "RequirementUnsheltered":
            return new StatRequirementUnsheltered(raw);
        case "RequirementReversals":
            return new StatRequirementReversals(raw);
        case "RequirementHoles":
            return new StatRequirementHoles(raw);
        case "RequirementStations":
            return new StatRequirementStations(raw);
        case "RequirementSplashdown":
            return new StatRequirementSplashdown(raw);
        default:
            console.warn(`Unknown stat requirement type: ${raw.type}`);
            return null;
    }
}

export function getStatRequirementsForRide(rideId: number): StatRequirement[] | undefined {
    return statRequriements[String(rideId)];
}

// parsed from the json file
const statRequriements: Record<string, StatRequirement[]> = {};
for (const rideId in json) {
    const rawRequirements = (json as Record<string, StatRequirementRaw[]>)[rideId];
    if (!rawRequirements) {
        console.warn(`No stat requirements found for ride ID ${rideId}`);
        continue;
    }
    statRequriements[rideId] = rawRequirements
        .map(createStatRequirement)
        .filter((req): req is StatRequirement => req !== null);
}
