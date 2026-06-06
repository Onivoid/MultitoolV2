#!/usr/bin/env node
/**
 * Exit 0 if version bump hooks apply on this branch.
 * Usage: node scripts/versioning/should-bump-branch.mjs [branch-name]
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));

const branch =
  process.argv[2] || execSync("git branch --show-current", { encoding: "utf8" }).trim();

const allowed = config.bumpBranches ?? ["master"];
const match = allowed.some((b) => b === branch);

process.exit(match ? 0 : 1);
