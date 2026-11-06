import type { LayerPath } from "../src/index.js";

/** A plain tree node for tests. `id` tells apart layers that share a name. */
export interface TestNode {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly TestNode[];
}

/** Builds a test node, leaving `children` absent on leaves as Figma does on text layers. */
function layer(id: string, name: string, children?: readonly TestNode[]): TestNode {
  return children === undefined ? { id, name } : { id, name, children };
}

/**
 * A card component instance. `label` appears in both buttons, so the name alone is ambiguous,
 * and `header` holds two `title` siblings for the repeated-sibling case:
 *
 *     instance (root)
 *     └── card
 *         └── content
 *             ├── header
 *             │   ├── title              (id "title")
 *             │   └── title              (id "title-duplicate")
 *             └── footer
 *                 ├── primary-button
 *                 │   └── label          (id "primary-label")
 *                 └── secondary-button
 *                     └── label          (id "secondary-label")
 */
export function createFixture(): TestNode {
  return layer("instance", "instance", [
    layer("card", "card", [
      layer("content", "content", [
        layer("header", "header", [layer("title", "title"), layer("title-duplicate", "title")]),
        layer("footer", "footer", [
          layer("primary-button", "primary-button", [layer("primary-label", "label")]),
          layer("secondary-button", "secondary-button", [layer("secondary-label", "label")]),
        ]),
      ]),
    ]),
  ]);
}

export const titlePath: LayerPath = ["card", "content", "header", "title"];
export const primaryLabelPath: LayerPath = ["card", "content", "footer", "primary-button", "label"];
export const secondaryLabelPath: LayerPath = [
  "card",
  "content",
  "footer",
  "secondary-button",
  "label",
];

/** Layer paths with a missing step, each for a different reason. */
export const missingPaths: readonly LayerPath[] = [
  // No such child at the first level.
  ["missing"],
  // Exists deeper, but is not a direct child of the root.
  ["label"],
  // Exists deeper, but is not a direct child of `card`.
  ["card", "title"],
  // Continues past a leaf.
  [...titlePath, "deeper"],
  // Missing at the last step.
  ["card", "content", "footer", "tertiary-button"],
];

/** Every layer path in a tree, in depth-first order, one per layer (repeated names repeat). */
export function allPaths(root: TestNode): LayerPath[] {
  const paths: LayerPath[] = [];
  const visit = (node: TestNode, path: LayerPath): void => {
    for (const child of node.children ?? []) {
      const childPath = [...path, child.name];
      paths.push(childPath);
      visit(child, childPath);
    }
  };
  visit(root, []);
  return paths;
}
