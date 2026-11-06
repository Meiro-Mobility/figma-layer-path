/**
 * Checks what `npm pack` would publish against what this package means to ship, so a broken
 * `files` field or a missing build fails before a release rather than after it.
 *
 * Run it through npm (`npm run check:package`) after `npm run build`: it calls the npm that runs
 * it, and it packs without lifecycle scripts, so it checks the build already in `dist/`.
 */
import { execFileSync } from "node:child_process";
import console from "node:console";
import process from "node:process";

/** Paths the package may contain: exact files, or everything under a directory prefix. */
const allowedFiles = new Set(["package.json", "README.md", "LICENSE"]);
const allowedPrefixes = ["dist/", "src/"];

/** Paths the package must contain for its `exports` and declaration maps to resolve. */
const requiredFiles = [
  "dist/index.js",
  "dist/index.d.ts",
  "src/index.ts",
  "package.json",
  "README.md",
  "LICENSE",
];

/**
 * Reads the file paths from `npm pack --json` output, checking the shape it relies on because
 * `JSON.parse` checks nothing.
 *
 * @param {string} output
 * @returns {string[]}
 */
function packedPaths(output) {
  /** @type {unknown} */
  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error("Expected `npm pack --json` to describe exactly one package.");
  }
  /** @type {unknown} */
  const pack = parsed[0];
  if (typeof pack !== "object" || pack === null || !("files" in pack)) {
    throw new Error("Expected the `npm pack --json` entry to list its files.");
  }
  /** @type {unknown} */
  const files = pack.files;
  if (!Array.isArray(files)) {
    throw new Error("Expected `files` in `npm pack --json` output to be an array.");
  }
  return files.map((/** @type {unknown} */ file) => {
    if (typeof file !== "object" || file === null || !("path" in file)) {
      throw new Error("Expected each packed file to have a path.");
    }
    if (typeof file.path !== "string") {
      throw new Error("Expected each packed file's path to be a string.");
    }
    return file.path;
  });
}

const npmCli = process.env.npm_execpath;
if (npmCli === undefined) {
  throw new Error("Run this through npm, as `npm run check:package`.");
}

const paths = packedPaths(
  execFileSync(process.execPath, [npmCli, "pack", "--dry-run", "--json", "--ignore-scripts"], {
    encoding: "utf8",
  }),
);
const packed = new Set(paths);

const unexpected = paths.filter(
  (path) => !allowedFiles.has(path) && !allowedPrefixes.some((prefix) => path.startsWith(prefix)),
);
const missing = requiredFiles.filter((path) => !packed.has(path));

if (unexpected.length > 0) {
  console.error(`Unexpected files in the package:\n  ${unexpected.join("\n  ")}`);
}
if (missing.length > 0) {
  console.error(
    `Missing files in the package (run \`npm run build\` first if dist/ is absent):\n  ${missing.join("\n  ")}`,
  );
}
if (unexpected.length > 0 || missing.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`Package contents as expected: ${String(paths.length)} files.`);
}
