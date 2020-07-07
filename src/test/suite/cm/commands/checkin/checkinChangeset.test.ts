import { expect } from "chai";
import * as checkinChangeset from "../../../../../cm/commands/checkin/checkinChangeset";
import { ICheckinChangeset } from "../../../../../models";

describe("checkinChangeset", () => {
  context("#parse()", () => {
    it("should return null for empty specs", () => {
      expect(checkinChangeset.parse("")).to.be.null;
    });

    it("should return null for invalid specs", () => {
      expect(checkinChangeset.parse("invalid")).to.be.null;
    });

    it("should return null if changeset value is empty", () => {
      expect(checkinChangeset.parse("cs:@br:/main@repo@server (mount:'/')")).to.be.null;
    });

    it("should return null if branch is empty", () => {
      expect(checkinChangeset.parse("cs:1@br:@repo@server (mount:'/')")).to.be.null;
    });

    it("should return null if repo is empty", () => {
      expect(checkinChangeset.parse("cs:1@br:/main@@server (mount:'/')")).to.be.null;
    });

    it("should return null if server is empty", () => {
      expect(checkinChangeset.parse("cs:1@br:/main@repo@ (mount:'/')")).to.be.null;
    });

    it("should return null if mount point is empty", () => {
      expect(checkinChangeset.parse("cs:1@br:/main@repo@server (mount:'')")).to.be.null;
    });

    it("should return valid data if input is valid, too", () => {
      const result: ICheckinChangeset | null = checkinChangeset.parse(
        "cs:462@br:/main/scm001@codice/osc@skull.codicefactory.com:9095 (mount:'/01plastic/osc')");

      expect(result).to.be.not.null;
      expect(result!.changesetInfo.branch).to.be.equal("/main/scm001");
      expect(result!.changesetInfo.changesetId).to.be.equal(462);
      expect(result!.changesetInfo.repository).to.be.equal("codice/osc");
      expect(result!.changesetInfo.server).to.be.equal("skull.codicefactory.com:9095");
      expect(result!.mountPath).to.be.equal("/01plastic/osc");
    });

    it("should be compatible with cloud repos", () => {
      const result: ICheckinChangeset | null = checkinChangeset.parse(
        "cs:462@br:/main/scm001@codice/osc@codice@cloud (mount:'/01plastic/osc')");

      expect(result).to.be.not.null;
      expect(result!.changesetInfo.branch).to.be.equal("/main/scm001");
      expect(result!.changesetInfo.changesetId).to.be.equal(462);
      expect(result!.changesetInfo.repository).to.be.equal("codice/osc");
      expect(result!.changesetInfo.server).to.be.equal("codice@cloud");
      expect(result!.mountPath).to.be.equal("/01plastic/osc");
    });
  });
});
