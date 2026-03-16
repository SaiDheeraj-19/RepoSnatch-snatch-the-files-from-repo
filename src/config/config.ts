import Conf from "conf";

export interface AppConfig {
  token?: string;
  downloadPath?: string;
}

const schema = {
  token: {
    type: "string",
  },
  downloadPath: {
    type: "string",
  },
} as const;

export class ConfigService {
  private conf: Conf<AppConfig>;

  constructor() {
    this.conf = new Conf<AppConfig>({
      projectName: "reposnatch",
      schema,
    });
  }

  get token(): string | undefined {
    return this.conf.get("token") || process.env.GITHUB_TOKEN;
  }

  setToken(token: string) {
    this.conf.set("token", token);
  }

  unsetToken() {
    this.conf.delete("token");
  }

  get downloadPath(): string | undefined {
    return this.conf.get("downloadPath");
  }

  setDownloadPath(path: string) {
    this.conf.set("downloadPath", path);
  }

  unsetDownloadPath() {
    this.conf.delete("downloadPath");
  }

  list(): Record<string, any> {
    return this.conf.store;
  }
}
