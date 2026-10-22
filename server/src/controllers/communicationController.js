const {
  generateCommunicationDraft,
  getCommunicationSubject
} = require("../services/communicationService");

const draftCommunication = (req, res, next) => {
  try {
    const { type, context } = req.body;
    const draft = generateCommunicationDraft({ type, context });
    const subject = getCommunicationSubject({ type, context });

    return res.status(200).json({
      success: true,
      data: { subject, draft }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { draftCommunication };
