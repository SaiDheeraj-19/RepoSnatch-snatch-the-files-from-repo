# RepoSnatch CLI 🚀

Download specific files or folders from any public GitHub repository without the need to clone the entire repository.

---

## 🏗️ CLI Command Structure

RepoSnatch follows a standard, intuitive command structure:

```bash
reposnatch <command> [options]
```

### Main Commands

| Command | Description |
| :--- | :--- |
| `grab <url>` | Enter interactive mode to download files/folders |
| `search <query>` | Search for public GitHub repositories |
| `folder <url> <path>` | Download a specific folder directly |
| `login` | Authenticate with your GitHub token |
| `config` | Manage persistent settings |
| `help` | Show help menu |
| `version` | Show current version |

---

## 🚀 Quick Start

### Installation

```bash
npm install -g reposnatch
```

### Basic Usage

```bash
# Start interactive exploration
reposnatch grab https://github.com/vercel/next.js

# Download a specific file directly
reposnatch grab https://github.com/facebook/react --file README.md

# Search for repos
reposnatch search "nextjs"
```

---

## 🛠️ CLI Flags

Advanced control via flags:

| Flag | Description |
| :--- | :--- |
| `--branch <name>` | Specify a branch (e.g., `dev`, `v2`) |
| `--output <dir>` | Specify exactly where to save files |
| `--file <path>` | Download one specific file without entering UI |
| `--token <token>` | Use a specific token for this single run |

---

## ⌨️ Interactive Explorer UI

When in `grab` mode, use the following controls:

| Key | Action |
| :--- | :--- |
| **Enter** | Enter folder or select/unselect file |
| **Backspace** | Go back to the previous folder |
| **Space** | Toggle selection (in search results) |
| **a** | Select All items in current view |
| **u** | Unselect All items in current view |
| **/** | (Menu option) Start fuzzy searching |
| **q / Q** | Quit |

---

## ⚙️ Configuration

Manage your settings persistently:

```bash
# Save your token (masked in list view)
reposnatch config set token YOUR_TOKEN

# Set a custom global download path
reposnatch config set path "/your/custom/path"

# View current setup
reposnatch config list
```

---

## 👨‍💻 Developed with Rich UI
RepoSnatch uses vibrant icons and colors for clarity:
*   ✔ `success` - **green**
*   ✖ `error` - **red**
*   ℹ `info` - **cyan**
*   ⚠ `warning` - **yellow**
*   🔍 `search`
*   📦 `repo`
*   📄 `file`
*   📁 `folder`

---

## License
MIT
