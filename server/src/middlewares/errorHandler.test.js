import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "./errorHandler.js";

describe("error handler", () => {
  let server;
  let baseUrl;
  const loggedErrors = [];
  const originalConsoleError = console.error;

  before(async () => {
    console.error = (...args) => loggedErrors.push(args);
    const app = express();
    app.get("/failure", () => {
      throw new Error("database credentials must not be exposed");
    });
    app.use(errorHandler);
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    console.error = originalConsoleError;
  });

  it("returns a generic server error without exposing internal details", async () => {
    const response = await fetch(`${baseUrl}/failure`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Internal server error",
    });
    assert.ok(loggedErrors[0].some((entry) => (
      entry instanceof Error && /database credentials/.test(entry.message)
    )));
  });
});
