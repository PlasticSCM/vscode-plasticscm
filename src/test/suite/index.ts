import * as Mocha from "mocha";

import { glob } from "glob";
import * as path from "path";

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
  const failures = await new Promise<number>((resolve) => {
    mocha.run(failures => {
      resolve(failures);
    });
  });

  if (failures > 0) {
    throw new Error(`${failures} tests failed.`);
  }
}
