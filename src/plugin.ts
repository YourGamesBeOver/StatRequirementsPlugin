import { init } from "./init";

registerPlugin({
    name: "Stat Requirements Plugin",
    version: "1.0.0",
    authors: ["Steven Miller"],
    type: "local",
    licence: "MIT",
    targetApiVersion: 114,
    main: init
});