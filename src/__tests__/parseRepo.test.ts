import { describe, it, expect } from "vitest";
import { parseRepoUrl } from "../utils/parseRepo.js";

describe("parseRepoUrl", () => {
  it("should parse a standard GitHub URL", () => {
    const url = "https://github.com/facebook/react";
    const result = parseRepoUrl(url);
    expect(result).toEqual({
      owner: "facebook",
      repo: "react",
      branch: undefined,
    });
  });

  it("should parse a GitHub URL with a branch", () => {
    const url = "https://github.com/facebook/react/tree/main";
    const result = parseRepoUrl(url);
    expect(result).toEqual({
      owner: "facebook",
      repo: "react",
      branch: "main",
    });
  });

  it("should handle URLs with trailing slashes", () => {
    const url = "https://github.com/facebook/react/";
    const result = parseRepoUrl(url);
    expect(result.repo).toBe("react");
  });

  it("should throw an error for invalid URLs", () => {
    const url = "https://google.com/not-github";
    expect(() => parseRepoUrl(url)).toThrow(/Invalid GitHub URL format/);
  });
});
