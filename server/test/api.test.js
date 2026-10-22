process.env.JWT_SECRET ||= "campusflow-test-secret";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

const tokenFor = (role) =>
  jwt.sign({ userId: "507f1f77bcf86cd799439011", role }, process.env.JWT_SECRET);

test("health endpoint responds without a database connection", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test("job endpoints reject unauthenticated requests", async () => {
  const response = await fetch(`${baseUrl}/jobs`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test("job creation is restricted to coordinator roles", async () => {
  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor("STUDENT")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
});

test("coordinator job creation validates required fields before database access", async () => {
  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor("COORDINATOR")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, "Validation failed");
  assert.ok(body.errors.some((error) => error.field === "companyName"));
  assert.ok(body.errors.some((error) => error.field === "deadline"));
});

test("student CSV import requires a CSV document", async () => {
  const response = await fetch(`${baseUrl}/students/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor("COORDINATOR")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ csv: "" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, "A CSV string is required");
});

test("student CSV import reports missing column headers", async () => {
  const response = await fetch(`${baseUrl}/students/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor("COORDINATOR")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ csv: "name,skills\nExample,Java" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /email, fullname, branch/);
});

test("candidate workflow endpoints are restricted to coordinator roles", async () => {
  const response = await fetch(
    `${baseUrl}/jobs/507f1f77bcf86cd799439011/candidates/507f1f77bcf86cd799439012`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokenFor("STUDENT")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ stage: "INTERVIEW" })
    }
  );
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
});
