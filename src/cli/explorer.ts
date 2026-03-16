import inquirer from "inquirer";
import chalk from "chalk";
import Fuse from "fuse.js";
import { GitHubFile } from "../services/githubService.js";
import { buildTree, TreeNode } from "../utils/treeBuilder.js";

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

export class CLIExplorer {
  private root: TreeNode;
  private currentNode: TreeNode;
  private flatFiles: GitHubFile[];
  private selectedPaths: Set<string> = new Set();

  constructor(files: GitHubFile[]) {
    this.flatFiles = files;
    this.root = buildTree(files);
    this.currentNode = this.root;
  }

  async run(): Promise<string[]> {
    while (true) {
      const choices = this.getChoices();
      
      const { action } = await inquirer.prompt([
        {
          type: "select",
          name: "action",
          message: `Select files/folders (${chalk.cyan(this.selectedPaths.size)} selected):`,
          choices: choices,
          pageSize: 15,
          loop: false,
        },
      ]);

      if (action === "__DONE__") {
        if (this.selectedPaths.size === 0) {
          console.log(chalk.yellow(`${icons.warning} No files selected. Select something before downloading.`));
          continue;
        }
        return Array.from(this.selectedPaths);
      }

      if (action === "__SEARCH__") {
        await this.handleSearch();
        continue;
      }

      if (action === "__BACK__") {
        this.navigateBack();
        continue;
      }

      if (action === "__SELECT_ALL__") {
          this.selectAllInCurrentDir();
          continue;
      }

      if (action === "__UNSELECT_ALL__") {
          this.unselectAllInCurrentDir();
          continue;
      }

      const node = this.currentNode.children.get(action.name);
      if (node) {
        if (node.type === "tree") {
          this.currentNode = node;
        } else {
          // Toggle file selection
          this.toggleSelection(node.path);
        }
      } else if (action.type === "toggle_dir") {
        this.toggleDirectorySelection(action.path);
      }
    }
  }

  private getChoices() {
    const choices: any[] = [];

    // Header / Status
    choices.push(new inquirer.Separator(`${chalk.bold.cyan("Location:")} ${chalk.dim(this.currentNode.path || "/")}`));
    
    // Control actions
    choices.push({ name: `${chalk.green("✔ Download Selected")}`, value: "__DONE__" });
    choices.push({ name: `${chalk.yellow(icons.search + " Search Files [/]")}`, value: "__SEARCH__" });
    choices.push({ name: `${chalk.magenta("Select All [a]")}`, value: "__SELECT_ALL__" });
    choices.push({ name: `${chalk.magenta("Unselect All [u]")}`, value: "__UNSELECT_ALL__" });

    if (this.currentNode !== this.root) {
      choices.push({ name: `${chalk.dim(".. (Back) [Backspace]")}`, value: "__BACK__" });
    }

    choices.push(new inquirer.Separator());

    // Directory selection option if we are in a directory
    if (this.currentNode.path) {
        const isDirSelected = this.isSelected(this.currentNode.path);
        choices.push({
            name: `${isDirSelected ? chalk.green("✓") : chalk.dim("○")} ${chalk.bold("[Select current directory]")}`,
            value: { type: "toggle_dir", path: this.currentNode.path }
        });
    }

    // List contents
    const sortedEntries = Array.from(this.currentNode.children.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sortedEntries) {
      const isSelected = this.isSelected(entry.path);
      const prefix = isSelected ? chalk.green("✓") : chalk.dim("○");
      const icon = entry.type === "tree" ? chalk.blue(icons.folder + " ") : chalk.white(icons.file + " ");
      
      choices.push({
        name: `${prefix} ${icon}${entry.name}${entry.type === "tree" ? "/" : ""}`,
        value: { name: entry.name, path: entry.path, type: entry.type }
      });
    }

    return choices;
  }

  private isSelected(path: string): boolean {
    return this.selectedPaths.has(path);
  }

  private toggleSelection(path: string) {
    if (this.selectedPaths.has(path)) {
      this.selectedPaths.delete(path);
    } else {
      this.selectedPaths.add(path);
    }
  }

  private selectAllInCurrentDir() {
      for (const [name, node] of this.currentNode.children) {
          if (node.type === "blob") {
              this.selectedPaths.add(node.path);
          } else {
              this.toggleDirectorySelection(node.path, true);
          }
      }
  }

  private unselectAllInCurrentDir() {
      for (const [name, node] of this.currentNode.children) {
          if (node.type === "blob") {
              this.selectedPaths.delete(node.path);
          } else {
              this.toggleDirectorySelection(node.path, false);
          }
      }
  }

  private toggleDirectorySelection(dirPath: string, force?: boolean) {
    const filesInDir = this.flatFiles.filter(f => f.path === dirPath || f.path.startsWith(dirPath + "/"));
    const allFilesPaths = filesInDir.filter(f => f.type === "blob").map(f => f.path);
    
    const shouldSelect = force !== undefined ? force : !allFilesPaths.every(p => this.selectedPaths.has(p));
    
    if (!shouldSelect) {
        allFilesPaths.forEach(p => this.selectedPaths.delete(p));
        this.selectedPaths.delete(dirPath);
    } else {
        allFilesPaths.forEach(p => this.selectedPaths.add(p));
        this.selectedPaths.add(dirPath);
    }
  }

  private navigateBack() {
    if (this.currentNode === this.root) return;
    const parts = this.currentNode.path.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    
    let node = this.root;
    if (parentPath !== "") {
        for (const part of parts) {
            node = node.children.get(part)!;
        }
    }
    this.currentNode = node;
  }

  private async handleSearch() {
    const fuse = new Fuse(this.flatFiles, {
      keys: ["path"],
      threshold: 0.4,
    });

    const { query } = await inquirer.prompt([
      {
        type: "input",
        name: "query",
        message: `${icons.search} Search file:`,
      },
    ]);

    if (!query) return;

    const results = fuse.search(query).slice(0, 15);
    if (results.length === 0) {
      console.log(chalk.red(`${icons.error} No matches found.`));
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message: "Results (Space to select):",
        choices: results.map(r => ({
          name: r.item.path,
          value: r.item.path,
          checked: this.selectedPaths.has(r.item.path)
        })),
        pageSize: 10,
      }
    ]);

    const searchResultPaths = results.map(r => r.item.path);
    searchResultPaths.forEach(path => this.selectedPaths.delete(path));
    selected.forEach((path: string) => this.selectedPaths.add(path));
  }
}
