/**
 * Copies each fenced TypeScript block in README.md into its own file under
 * `.cache/readme-examples/`, so `tsc -p tsconfig.figma.json` type-checks the README's examples
 * against the library and Figma's typings. The README stays the only copy of each example, and
 * one that stops compiling fails the typecheck.
 *
 * Each block must therefore be a complete module, with its own imports.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import console from "node:console";

const readmePath = "README.md";
const outputDirectory = join(".cache", "readme-examples");

/**
 * A fenced block opened by exactly "```typescript" or "```ts" and closed by "```", each on its
 * own line. Both spellings match, so a block written either way is checked, never skipped.
 */
const tsBlock = /^```(?:typescript|ts)\n([\s\S]*?)^```$/gm;

const readme = readFileSync(readmePath, "utf8");

// Cleared first, so an example removed from the README does not linger and keep passing.
rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });

let count = 0;
for (const match of readme.matchAll(tsBlock)) {
  const code = match[1] ?? "";
  // Lines before the block's first code line, so padding with that many empty lines makes a
  // type error's line number in the extracted file the same as in README.md.
  const linesBefore = readme.slice(0, match.index).split("\n").length;
  count += 1;
  const fileName = `example-${String(count).padStart(2, "0")}.ts`;
  writeFileSync(join(outputDirectory, fileName), "\n".repeat(linesBefore) + code);
}

if (count === 0) {
  throw new Error(
    `Found no TypeScript blocks in ${readmePath}; the extraction pattern may be wrong.`,
  );
}
console.log(`Extracted ${String(count)} examples from ${readmePath}.`);
