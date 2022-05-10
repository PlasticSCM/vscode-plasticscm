import * as path from "path";

import { runTests } from "@vscode/test-electron";

function main() {
  // The folder containing the Extension Manifest package.json
  // Passed to `--extensionDevelopmentPath`
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");

  // The path to test runner
  // Passed to --extensionTestsPath
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");

  // Download VS Code, unzip it and run the integration test
  runTests({ extensionDevelopmentPath, extensionTestsPath }).then(null, err => {
    // eslint-disable-next-line no-console
    console.error("Failed to run tests", err);
    process.exit(1);
  });
}

main();
