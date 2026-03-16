#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import chalk from "chalk";
import { grabCommand, searchCommand, folderCommand, icons } from "./commands.js";
import { ConfigService } from "../config/config.js";

const conf = new ConfigService();
const program = new Command();

program
  .name("reposnatch")
  .description("Download files from GitHub repos without cloning")
  .version("1.0.0");

// GRAB command
program
  .command("grab")
  .argument("<repo>", "GitHub repository URL")
  .description("download files from a repository")
  .option("-b, --branch <name>", "Specify branch name")
  .option("-o, --output <path>", "Specify output directory")
  .option("-f, --file <path>", "Snatch a specific file directly")
  .option("-t, --token <token>", "Use a specific GitHub token for this run")
  .action(async (repo, options) => {
    await grabCommand(repo, options);
  });

// SEARCH command
program
  .command("search")
  .argument("<query>", "Search query for repositories")
  .description("search GitHub repositories")
  .action(async (query) => {
    await searchCommand(query);
  });

// FOLDER command
program
  .command("folder")
  .argument("<repo>", "GitHub repository URL")
  .argument("<path>", "Path to the folder in the repository")
  .description("download a specific folder")
  .option("-b, --branch <name>", "Specify branch name")
  .option("-o, --output <path>", "Specify output directory")
  .action(async (repo, folderPath, options) => {
    await folderCommand(repo, folderPath, options);
  });

// LOGIN command (shorthand for config set token)
program
  .command("login")
  .description("authenticate GitHub token")
  .action(async () => {
    const inquirer = (await import("inquirer")).default;
    const { token } = await inquirer.prompt([
        {
            type: "password",
            name: "token",
            message: "Enter your GitHub Personal Access Token:",
            mask: "*"
        }
    ]);
    if (token) {
        conf.setToken(token);
        console.log(`${icons.success} Done! Token saved securely.`);
    }
  });

// CONFIG command
const config = program.command("config").description("manage settings");

config
  .command("set <key> <value>")
  .description("set a config key (token or path)")
  .action((key, value) => {
    if (key === "token") {
      conf.setToken(value);
      console.log(`${icons.success} Token updated.`);
    } else if (key === "path") {
      conf.setDownloadPath(value);
      console.log(`${icons.success} Download path set to: ${value}`);
    } else {
        console.log(`${icons.error} Unknown key '${key}'. Use 'token' or 'path'.`);
    }
  });

config
  .command("list")
  .description("list current settings")
  .action(() => {
    const list = conf.list();
    console.log(chalk.bold("\nRepoSnatch Settings:"));
    for (const [key, value] of Object.entries(list)) {
      const displayValue = key === "token" ? (value as string).substring(0, 8) + "..." : value;
      console.log(`${chalk.cyan(key)}: ${chalk.dim(displayValue as string)}`);
    }
    console.log("");
  });

config
  .command("unset <key>")
  .description("remove a config setting")
  .action((key) => {
    if (key === "token") conf.unsetToken();
    else if (key === "path") conf.unsetDownloadPath();
    console.log(`${icons.success} ${key} removed.`);
  });

// Support running 'reposnatch <url>' directly as a shorthand for 'grab'
program
    .arguments("[url]")
    .action(async (url, options) => {
        if (url) {
            await grabCommand(url, options);
        } else {
            console.log(chalk.cyan(`\nRepoSnatch CLI v1.0\n`));
            console.log(`Usage: ${chalk.green("reposnatch <command> [options]")}`);
            console.log(`Try ${chalk.yellow("reposnatch grab <repo-url>")} or ${chalk.yellow("reposnatch help")} for more info.\n`);
        }
    });

program.parse(process.argv);
