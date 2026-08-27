// import { ensurePermissionsSeeded } from "../src/app/lib/startup.js";

import { ensurePermissionsSeeded } from "../app/lib/startup.js";

// import { ensurePermissionsSeeded } from "../app/lib/startup";

ensurePermissionsSeeded(true).then(() => {
  console.log("Done");
  process.exit(0);
});