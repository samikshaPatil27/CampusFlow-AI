const test = require("node:test");
const assert = require("node:assert/strict");
const {
  generateCommunicationDraft,
  getCommunicationSubject
} = require("../src/services/communicationService");
const { draftCommunication } = require("../src/controllers/communicationController");

const context = {
  studentName: "Asha",
  jobTitle: "Software Engineer",
  companyName: "Nexa Labs",
  deadline: "2026-12-31T00:00:00.000Z"
};

test("shortlist templates include candidate, role, and organization without Ollama", () => {
  const draft = generateCommunicationDraft({ type: "shortlist", context });

  assert.match(draft, /Hello Asha/);
  assert.match(draft, /Software Engineer/);
  assert.match(draft, /Nexa Labs/);
  assert.match(getCommunicationSubject({ type: "shortlist", context }), /Shortlisted/);
});

test("interview invitation template requests coordinator to fill meeting details", () => {
  const draft = generateCommunicationDraft({ type: "interview-invite", context });

  assert.match(draft, /interview/);
  assert.match(draft, /add the interview date, time, format/i);
});

test("unknown template types return an explicit error", () => {
  assert.throws(
    () => generateCommunicationDraft({ type: "unknown", context }),
    /No communication template is available/
  );
});

test("standalone draft controller returns template subject and body locally", () => {
  let statusCode;
  let responseBody;
  let nextError;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  draftCommunication({
    body: {
      type: "shortlist",
      context
    }
  }, response, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(statusCode, 200);
  assert.match(responseBody.data.subject, /Shortlisted/);
  assert.match(responseBody.data.draft, /Hello Asha/);
});
