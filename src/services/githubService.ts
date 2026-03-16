import axios from "axios";

export interface GitHubFile {
  path: string;
  type: "blob" | "tree";
  size?: number;
  url: string;
}

export class GitHubService {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private get headers() {
    return this.token
      ? { Authorization: `token ${this.token}`, Accept: "application/vnd.github.v3+json" }
      : { Accept: "application/vnd.github.v3+json" };
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: this.headers,
      });
      return response.data.default_branch;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found.`);
      }
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch repository info: ${errorMessage}`);
    }
  }

  async getFileTree(owner: string, repo: string, branch: string): Promise<GitHubFile[]> {
    try {
      // GitHub Trees API with recursive=1 to get the full tree
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: this.headers }
      );

      if (response.data.truncated) {
        console.warn("Warning: Result is truncated by GitHub API. Some files might be missing.");
      }

      return response.data.tree.map((item: any) => ({
        path: item.path,
        type: item.type === "tree" ? "tree" : "blob",
        size: item.size,
        url: item.url,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch file tree: ${errorMessage}`);
    }
  }
}
