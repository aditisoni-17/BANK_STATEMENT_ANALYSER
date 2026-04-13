const { execFile } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const pythonBin = process.env.PYTHON_BIN || path.join(projectRoot, "venv", "bin", "python");
const pythonScript = path.join(projectRoot, "ocr", "process_bank_statement_cli.py");

function parseBankStatement(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      pythonBin,
      [pythonScript, filePath],
      {
        cwd: projectRoot,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error("Python script returned invalid JSON"));
        }
      }
    );
  });
}

module.exports = { parseBankStatement };
