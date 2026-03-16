import { describe, it, expect } from "vitest";
import { buildTree } from "../utils/treeBuilder.js";
import { GitHubFile } from "../services/githubService.js";

describe("buildTree", () => {
  it("should create a nested tree from a flat list of files", () => {
    const files: GitHubFile[] = [
      { path: "src/index.ts", type: "blob", url: "" },
      { path: "src/utils/math.ts", type: "blob", url: "" },
      { path: "package.json", type: "blob", url: "" },
    ];

    const root = buildTree(files);

    expect(root.children.has("src")).toBe(true);
    expect(root.children.has("package.json")).toBe(true);

    const src = root.children.get("src")!;
    expect(src.children.has("index.ts")).toBe(true);
    expect(src.children.has("utils")).toBe(true);

    const utils = src.children.get("utils")!;
    expect(utils.children.has("math.ts")).toBe(true);
  });

  it("should correctly identify types", () => {
    const files: GitHubFile[] = [
      { path: "lib", type: "tree", url: "" },
      { path: "lib/file.js", type: "blob", url: "" },
    ];

    const root = buildTree(files);
    const lib = root.children.get("lib")!;
    expect(lib.type).toBe("tree");
    expect(lib.children.get("file.js")!.type).toBe("blob");
  });
});
