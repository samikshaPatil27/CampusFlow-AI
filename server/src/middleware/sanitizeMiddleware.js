// Strips MongoDB operators ($, .) from body, query, and params to prevent NoSQL injection
const sanitize = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitize(obj[key]);
    }
  }
  return obj;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

module.exports = sanitizeRequest;