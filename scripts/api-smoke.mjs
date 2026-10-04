import handler from "../api/runtime.js";

if (typeof handler !== "function") {
  throw new Error("api/runtime.js did not export a serverless handler");
}

console.log(JSON.stringify({
  ok: true,
  api: "/api/runtime",
  handler: typeof handler,
}));
