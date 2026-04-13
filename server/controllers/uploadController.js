const { parseBankStatement } = require("../services/pythonParserService");

async function uploadBankStatement(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "PDF file is required",
    });
  }

  try {
    const data = await parseBankStatement(req.file.path);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process bank statement",
    });
  }
}

module.exports = { uploadBankStatement };
