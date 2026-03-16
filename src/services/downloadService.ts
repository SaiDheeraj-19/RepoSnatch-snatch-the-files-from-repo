import axios from "axios";
import path from "path";
import pLimit from "p-limit";

// Note: fs-extra is not installed, but usually helpful. I'll stick to standard fs for minimal dependencies or install it.
// Actually, standard fs.promises is fine.
import { promises as fsPromises } from "fs";

export class DownloadService {
  private owner: string;
  private repo: string;
  private branch: string;
  private concurrency: number;

  private token?: string;

  constructor(owner: string, repo: string, branch: string, token?: string, concurrency: number = 5) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
    this.concurrency = concurrency;
  }

  private get headers() {
    return this.token
      ? { Authorization: `token ${this.token}` }
      : {};
  }

  private getRawUrl(filePath: string): string {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${filePath}`;
  }

  async downloadFile(filePath: string, targetDir: string): Promise<void> {
    const url = this.getRawUrl(filePath);
    const dest = path.join(targetDir, filePath);

    try {
      await fsPromises.mkdir(path.dirname(dest), { recursive: true });
      const response = await axios.get(url, { 
        responseType: "arraybuffer",
        headers: this.headers
      });
      await fsPromises.writeFile(dest, Buffer.from(response.data));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to download ${filePath}: ${errorMessage}`);
    }
  }

  async downloadFiles(
    filePaths: string[],
    targetDir: string,
    onProgress?: (completed: number, total: number, currentFile: string) => void
  ): Promise<void> {
    const limit = (await import("p-limit")).default(this.concurrency);
    let completed = 0;

    const tasks = filePaths.map((filePath) =>
      limit(async () => {
        await this.downloadFile(filePath, targetDir);
        completed++;
        if (onProgress) {
          onProgress(completed, filePaths.length, filePath);
        }
      })
    );

    await Promise.all(tasks);
  }
}
