import { initialize, embedded } from "./db.js";
import { seed } from "./seed.js";
import { app } from "./app.js";
await initialize();
if (embedded) await seed();
app.listen(Number(process.env.PORT) || 4000, "0.0.0.0", () =>
  console.log("商城 API: http://localhost:4000"),
);
