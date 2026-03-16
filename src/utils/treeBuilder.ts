import { GitHubFile } from "../services/githubService.js";

export interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  children: Map<string, TreeNode>;
}

/**
 * Builds a nested tree structure from a flat list of GitHub files.
 */
export function buildTree(files: GitHubFile[]): TreeNode {
  const root: TreeNode = {
    name: "root",
    path: "",
    type: "tree",
    children: new Map(),
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        
        if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
                name: part,
                path: parts.slice(0, i + 1).join("/"),
                type: isLast ? file.type : "tree",
                children: new Map()
            });
        }
        
        currentNode = currentNode.children.get(part)!;
    }
  }

  return root;
}
