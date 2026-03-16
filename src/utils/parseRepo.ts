export interface RepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

/**
 * Parses a GitHub repository URL to extract owner, repo name, and branch.
 * @param url The GitHub repository URL.
 * @returns An object containing owner, repo, and optionally branch.
 * @throws Error if the URL format is invalid.
 */
export function parseRepoUrl(url: string): RepoInfo {
  try {
    const cleanUrl = url.trim().replace(/\/$/, "");
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;
    const match = cleanUrl.match(regex);

    if (!match) {
      throw new Error("Invalid GitHub URL format. Use: https://github.com/owner/repo");
    }

    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] || undefined,
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to parse GitHub URL");
  }
}
