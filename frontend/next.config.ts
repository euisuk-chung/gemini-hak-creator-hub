import type { NextConfig } from "next";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// 프로젝트 루트 .env 로드 (frontend/../.env)
const rootEnvPath = resolve(process.cwd(), "../.env");
if (existsSync(rootEnvPath)) {
  const content = readFileSync(rootEnvPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
