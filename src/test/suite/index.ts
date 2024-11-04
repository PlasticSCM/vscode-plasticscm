import * as Mocha from "mocha";
import * as path from "path";

import { glob } from "glob";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    color: true,
    timeout: process.env.DEBUG === "TRUE" ? 0 : 2000,
    ui: "bdd",
  });

  const testsRoot = path.resolve(__dirname, "..");

  const testFiles = await glob("**/**.test.js", { cwd: testsRoot });

  // Add files to the test suite
  testFiles.forEach(testFile => mocha.addFile(path.resolve(testsRoot, testFile)));

  // Run the mocha test
  const failureCount = await new Promise<number>(resolve => {
    mocha.run(failures => {
      resolve(failures);
    });
  });

  if (failureCount > 0) {
    throw new Error(`${failureCount} tests failed.`);
  }
}
