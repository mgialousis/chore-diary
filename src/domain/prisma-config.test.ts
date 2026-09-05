import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const configUrl = pathToFileURL(resolve("prisma.config.ts")).href;

function loadConfig(extraEnv: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "chore-prisma-env-test-"));
  try {
    writeFileSync(join(directory, ".env"), "DIRECT_URL=postgresql://example.invalid/base\n");
    writeFileSync(join(directory, ".env.local"), "DIRECT_URL=postgresql://example.invalid/local\n");
    // Use the real Prisma config loader, isolated from the developer's environment.
    const script = `
      const { loadConfigFromFile } = await import(${JSON.stringify(pathToFileURL(resolve("node_modules/@prisma/config/dist/index.js")).href)});
      const result = await loadConfigFromFile({ configFile: ${JSON.stringify(resolve("prisma.config.ts"))}, configRoot: process.cwd() });
      if (result.error) throw new Error(JSON.stringify(result.error));
      console.log(JSON.stringify({url: result.config.datasource.url, seed: result.config.migrations.seed}));
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: directory,
      env: { PATH: process.env.PATH, NODE_ENV: "development", ...extraEnv },
      encoding: "utf8",
    });
    expect(result.status, result.stderr + result.stdout + configUrl).toBe(0);
    return JSON.parse(result.stdout.trim().split("\n").at(-1)!);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("Prisma CLI setup", () => {
  it("loads .env.local ahead of .env and registers the seed command", () => {
    expect(loadConfig()).toEqual({ url: "postgresql://example.invalid/local", seed: "node prisma/seed.ts" });
  });
  it("preserves shell/CI values", () => {
    expect(loadConfig({ DIRECT_URL: "postgresql://example.invalid/shell" }).url)
      .toBe("postgresql://example.invalid/shell");
  });
  it("does not read .env.local in test mode", () => {
    expect(loadConfig({ NODE_ENV: "test" }).url).toBe("postgresql://example.invalid/base");
  });
});
