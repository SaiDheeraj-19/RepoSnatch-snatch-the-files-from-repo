import chalk from "chalk";
import ora from "ora";
import path from "path";
import axios from "axios";
import Table from "cli-table3";
import { parseRepoUrl } from "../utils/parseRepo.js";
import { GitHubService } from "../services/githubService.js";
import { DownloadService } from "../services/downloadService.js";
import { ConfigService } from "../config/config.js";
import { CLIExplorer } from "./explorer.js";

const conf = new ConfigService();

export const icons = {
  success: chalk.green("✔"),
  error: chalk.red("✖"),
  warning: chalk.yellow("⚠"),
  info: chalk.cyan("ℹ"),
  search: "🔍",
  repo: "📦",
  file: "📄",
  folder: "📁",
};

export async function grabCommand(repoUrl: string, options: any) {
  const token = options.token || conf.token;
  const githubService = new GitHubService(token);

  console.log(chalk.bold(`\nRepoSnatch v1.0\n`));
  const spinner = ora(`${icons.search} Connecting to repository...`).start();

  try {
    const repoInfo = parseRepoUrl(repoUrl);
    
    // Override branch if provided in flags
    const branch = options.branch || repoInfo.branch || await githubService.getDefaultBranch(repoInfo.owner, repoInfo.repo);
    
    spinner.succeed(`${icons.success} Repository detected: ${chalk.cyan(`${repoInfo.owner}/${repoInfo.repo}`)}`);
    console.log(`${icons.success} Default branch: ${chalk.dim(branch)}`);

    const treeSpinner = ora(`${icons.repo} Fetching repository structure...`).start();
    const files = await githubService.getFileTree(repoInfo.owner, repoInfo.repo, branch);
    treeSpinner.succeed(`${icons.success} ${chalk.bold(files.length.toLocaleString())} files loaded`);

    // Handle specific file flag
    if (options.file) {
      const targetFile = files.find(f => f.path === options.file);
      if (!targetFile) {
        console.error(`${icons.error} File '${options.file}' not found in the repository.`);
        process.exit(1);
      }
      await downloadSelected(repoInfo, branch, [options.file], options.output, token, files);
      return;
    }

    // Interactive Explorer
    const explorer = new CLIExplorer(files);
    console.log("");
    const selectedPaths = await explorer.run();

    if (selectedPaths.length > 0) {
      await downloadSelected(repoInfo, branch, selectedPaths, options.output, token, files);
    } else {
      console.log(chalk.yellow("\nNo files selected. Exiting."));
    }

  } catch (error: any) {
    spinner.fail(`${icons.error} Error: ${error.message}`);
    process.exit(1);
  }
}

async function downloadSelected(repoInfo: any, branch: string, paths: string[], output: string, token: string | undefined, allFiles: any[]) {
  console.log(chalk.cyan(`\n${icons.info} Preparing to download ${paths.length} files...`));
  const downloadSpinner = ora("Downloading files...").start();

  const downloadService = new DownloadService(repoInfo.owner, repoInfo.repo, branch, token);
  
  let targetDir = output || conf.downloadPath || process.cwd();
  
  // If not downloading to current dir specifically, create a repo-named folder
  if (!output && !conf.downloadPath) {
      targetDir = path.join(targetDir, `snatched-${repoInfo.repo}`);
  }

  const blobs = paths.filter(p => {
      const f = allFiles.find(file => file.path === p);
      return f && f.type === "blob";
  });

  let completed = 0;
  await downloadService.downloadFiles(
    blobs,
    targetDir,
    (current, total, file) => {
      downloadSpinner.text = `Downloading [${current}/${total}]: ${chalk.dim(file)}`;
    }
  );

  downloadSpinner.succeed(`${icons.success} Download complete! Files saved to: ${chalk.bold(targetDir)}`);
}

export async function searchCommand(query: string) {
  const spinner = ora(`${icons.search} Searching GitHub for '${query}'...`).start();
  const token = conf.token;
  const headers = token ? { Authorization: `token ${token}` } : {};

  try {
    const response = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars`, { headers });
    spinner.stop();

    const repos = response.data.items.slice(0, 10);
    if (repos.length === 0) {
      console.log(chalk.yellow(`No repositories found matching '${query}'`));
      return;
    }

    const table = new Table({
      head: [chalk.cyan("Repository"), chalk.cyan("Stars"), chalk.cyan("Description")],
      colWidths: [30, 10, 50]
    });

    repos.forEach((repo: any) => {
      table.push([
        chalk.bold(repo.full_name),
        repo.stargazers_count.toLocaleString(),
        repo.description ? (repo.description.length > 47 ? repo.description.substring(0, 47) + "..." : repo.description) : ""
      ]);
    });

    console.log(chalk.bold(`\nTop Results for '${query}':`));
    console.log(table.toString());
    console.log(`\nRun ${chalk.green(`reposnatch grab [repo-url]`)} to download files.\n`);

  } catch (error: any) {
    spinner.fail(`${icons.error} Search failed: ${error.message}`);
  }
}

export async function folderCommand(repoUrl: string, folderPath: string, options: any) {
    const token = options.token || conf.token;
    const githubService = new GitHubService(token);
    
    console.log(chalk.bold(`\nRepoSnatch Folder Download\n`));
    const spinner = ora(`${icons.folder} Fetching folder content...`).start();

    try {
        const repoInfo = parseRepoUrl(repoUrl);
        const branch = options.branch || repoInfo.branch || await githubService.getDefaultBranch(repoInfo.owner, repoInfo.repo);
        
        const files = await githubService.getFileTree(repoInfo.owner, repoInfo.repo, branch);
        const folderFiles = files.filter(f => f.path === folderPath || f.path.startsWith(folderPath + "/"));
        
        if (folderFiles.length === 0) {
            spinner.fail(`${icons.error} Folder '${folderPath}' not found.`);
            return;
        }

        spinner.succeed(`${icons.success} Found ${folderFiles.length} files in ${chalk.cyan(folderPath)}`);
        
        await downloadSelected(repoInfo, branch, folderFiles.map(f => f.path), options.output, token, files);
    } catch (error: any) {
        spinner.fail(`${icons.error} Error: ${error.message}`);
    }
}
