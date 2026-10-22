const templates = {
  "interview-invite": {
    subject: ({ jobTitle, companyName }) => `Interview invitation: ${jobTitle} at ${companyName}`,
    body: ({ studentName, jobTitle, companyName }) => `Hello ${studentName},

We are pleased to invite you to interview for the ${jobTitle} opportunity at ${companyName}.

Please add the interview date, time, format, and any preparation instructions before sending this message.

Please reply to confirm your availability.

Best regards,
Placement Team`
  },
  rejection: {
    subject: ({ jobTitle, companyName }) => `Update on your ${jobTitle} application at ${companyName}`,
    body: ({ studentName, jobTitle, companyName }) => `Hello ${studentName},

Thank you for your interest in the ${jobTitle} opportunity at ${companyName} and for taking the time to participate in the placement process.

After careful consideration, we will not be moving forward with your application for this opportunity. We appreciate your effort and encourage you to apply for future openings that match your interests.

Best regards,
Placement Team`
  },
  shortlist: {
    subject: ({ jobTitle, companyName }) => `Shortlisted: ${jobTitle} at ${companyName}`,
    body: ({ studentName, jobTitle, companyName, deadline }) => `Hello ${studentName},

We are pleased to let you know that you have been shortlisted for the ${jobTitle} opportunity at ${companyName}.

${deadline ? `The application deadline is ${new Date(deadline).toLocaleDateString()}.` : "We will share the next steps with you shortly."}

Please reply if you have any questions.

Best regards,
Placement Team`
  },
  general: {
    subject: ({ jobTitle, companyName }) => `Placement update: ${jobTitle} at ${companyName}`,
    body: ({ studentName, jobTitle, companyName }) => `Hello ${studentName},

We are contacting you with an update regarding the ${jobTitle} opportunity at ${companyName}.

Please add the relevant update and any required next steps before sending this message.

Best regards,
Placement Team`
  }
};

const generateCommunicationDraft = ({ type, context }) => {
  const template = templates[type];
  if (!template) {
    throw new Error(`No communication template is available for type: ${type}`);
  }
  return template.body(context);
};

const getCommunicationSubject = ({ type, context }) => {
  const template = templates[type];
  if (!template) {
    throw new Error(`No communication template is available for type: ${type}`);
  }
  return template.subject(context);
};

module.exports = {
  generateCommunicationDraft,
  getCommunicationSubject
};
