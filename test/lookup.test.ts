import { describe, expect, it } from "vitest";
import { createLayerFinder, findLayer, findLayers } from "../src/index.js";
import type { LayerNode, LayerPath } from "../src/index.js";
import {
  allPaths,
  createFixture,
  missingPaths,
  primaryLabelPath,
  secondaryLabelPath,
  titlePath,
} from "./fixture.js";
import type { TestNode } from "./fixture.js";

type Lookup = (root: LayerNode<TestNode>, path: LayerPath) => TestNode | undefined;

/** Each public way of looking up one layer path, so the shared behaviour is tested on all three. */
const lookups: readonly (readonly [string, Lookup])[] = [
  ["findLayer", (root, path) => findLayer(root, path)],
  ["createLayerFinder", (root, path) => createLayerFinder<TestNode>().find(root, path)],
  ["findLayers", (root, path) => findLayers(root, { target: path }).target],
];

describe.each(lookups)("%s", (_name, lookup) => {
  it("finds a layer by an exact layer path", () => {
    const root = createFixture();
    expect(lookup(root, titlePath)?.id).toBe("title");
    expect(lookup(root, primaryLabelPath)?.id).toBe("primary-label");
    expect(lookup(root, secondaryLabelPath)?.id).toBe("secondary-label");
    expect(lookup(root, ["card"])?.id).toBe("card");
  });

  it("returns the tree's own node", () => {
    const root = createFixture();
    const card = root.children?.[0];
    const content = card?.children?.[0];
    const header = content?.children?.[0];
    const title = header?.children?.[0];
    expect(title).toBeDefined();
    expect(lookup(root, titlePath)).toBe(title);
  });

  it("matches names exactly", () => {
    // Near misses come first, so any looser comparison would pick one of them.
    const root: TestNode = {
      id: "root",
      name: "root",
      children: [
        { id: "longer", name: "title-old" },
        { id: "cased", name: "Title" },
        { id: "spaced", name: " title" },
        { id: "exact", name: "title" },
      ],
    };
    expect(lookup(root, ["title"])?.id).toBe("exact");
    expect(lookup(root, ["titl"])).toBeUndefined();
  });

  it("looks through direct children only", () => {
    const root = createFixture();
    expect(lookup(root, ["label"])).toBeUndefined();
    expect(lookup(root, ["content"])).toBeUndefined();
    expect(lookup(root, ["card", "title"])).toBeUndefined();
  });

  it("gives undefined for a missing step", () => {
    const root = createFixture();
    for (const path of missingPaths) {
      expect(lookup(root, path), path.join("/")).toBeUndefined();
    }
  });

  it("gives undefined for an empty layer path", () => {
    expect(lookup(createFixture(), [])).toBeUndefined();
  });

  it("takes the first of several siblings with one name", () => {
    expect(lookup(createFixture(), titlePath)?.id).toBe("title");
  });

  it("starts from any node given as the root", () => {
    const root = createFixture();
    const content = lookup(root, ["card", "content"]);
    expect(content).toBeDefined();
    if (content !== undefined) {
      expect(lookup(content, ["footer", "secondary-button", "label"])?.id).toBe("secondary-label");
    }
  });
});

describe("createLayerFinder and findLayer", () => {
  it("agree on every layer path in the tree and on missing ones", () => {
    const root = createFixture();
    const finder = createLayerFinder<TestNode>();
    const paths = [...allPaths(root), ...missingPaths, []];
    // The fixture has ten layers below the root, including the repeated `title`.
    expect(paths).toHaveLength(10 + missingPaths.length + 1);
    for (const path of paths) {
      expect(finder.find(root, path), path.join("/")).toBe(findLayer(root, path));
    }
  });
});
