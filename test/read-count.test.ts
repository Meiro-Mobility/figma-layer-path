import { describe, expect, it } from "vitest";
import { createLayerFinder, findLayer, findLayers } from "../src/index.js";
import {
  allPaths,
  createFixture,
  missingPaths,
  primaryLabelPath,
  secondaryLabelPath,
  titlePath,
  withReadCounting,
} from "./fixture.js";
import type { TestNode } from "./fixture.js";

/** Three layer paths sharing the prefix `card` / `content`, and `footer` for the two labels. */
const sharedPrefixPaths = [titlePath, primaryLabelPath, secondaryLabelPath];

describe("reads of children", () => {
  it("are at most one per layer with one finder, however many lookups pass through it", () => {
    const tree = withReadCounting(createFixture());
    const finder = createLayerFinder<TestNode>();
    const paths = [...allPaths(createFixture()), ...missingPaths];
    // Twice over, so repeated lookups are covered too.
    for (const path of [...paths, ...paths]) {
      finder.find(tree.root, path);
    }
    expect(tree.reads.size).toBeGreaterThan(0);
    for (const [id, count] of tree.reads) {
      expect(count, id).toBe(1);
    }
  });

  it("are one per distinct ancestor when layer paths sharing a prefix resolve together", () => {
    // The ancestors whose children the three paths step through: instance, card, content,
    // header (for title), footer (for both labels), primary-button, and secondary-button.
    // Seven layers, each read once.
    const expected = new Map([
      ["instance", 1],
      ["card", 1],
      ["content", 1],
      ["header", 1],
      ["footer", 1],
      ["primary-button", 1],
      ["secondary-button", 1],
    ]);

    const withFinder = withReadCounting(createFixture());
    const finder = createLayerFinder<TestNode>();
    for (const path of sharedPrefixPaths) {
      finder.find(withFinder.root, path);
    }
    expect(withFinder.reads).toEqual(expected);
    expect(withFinder.totalReads()).toBe(7);

    const withMap = withReadCounting(createFixture());
    findLayers(withMap.root, {
      title: titlePath,
      primary: primaryLabelPath,
      secondary: secondaryLabelPath,
    });
    expect(withMap.reads).toEqual(expected);
    expect(withMap.totalReads()).toBe(7);
  });

  it("are one per ancestor per layer path when each resolves separately with findLayer", () => {
    // title:     instance, card, content, header                    = 4
    // primary:   instance, card, content, footer, primary-button    = 5
    // secondary: instance, card, content, footer, secondary-button  = 5
    // Fourteen reads in all: the shared instance, card, and content three times each, and
    // footer twice.
    const tree = withReadCounting(createFixture());
    for (const path of sharedPrefixPaths) {
      findLayer(tree.root, path);
    }
    expect(tree.reads).toEqual(
      new Map([
        ["instance", 3],
        ["card", 3],
        ["content", 3],
        ["header", 1],
        ["footer", 2],
        ["primary-button", 1],
        ["secondary-button", 1],
      ]),
    );
    expect(tree.totalReads()).toBe(14);
  });

  it("are shared between a finder's lookups and findLayers given that finder", () => {
    // finder.find for title reads instance, card, content, and header. findLayers for the two
    // labels then reads only footer, primary-button, and secondary-button, because the finder
    // has already read instance, card, and content. Seven layers, each read once.
    const tree = withReadCounting(createFixture());
    const finder = createLayerFinder<TestNode>();
    finder.find(tree.root, titlePath);
    expect(tree.totalReads()).toBe(4);
    findLayers(tree.root, { primary: primaryLabelPath, secondary: secondaryLabelPath }, finder);
    expect(tree.reads).toEqual(
      new Map([
        ["instance", 1],
        ["card", 1],
        ["content", 1],
        ["header", 1],
        ["footer", 1],
        ["primary-button", 1],
        ["secondary-button", 1],
      ]),
    );
    expect(tree.totalReads()).toBe(7);

    // Layers read by findLayers are shared with later lookups through the finder: the path to
    // the secondary label reads nothing new.
    finder.find(tree.root, secondaryLabelPath);
    expect(tree.totalReads()).toBe(7);
  });

  it("repeat the shared ancestors when findLayers is not given the finder", () => {
    // finder.find for title reads instance, card, content, and header: 4. findLayers then uses
    // a finder of its own and reads instance, card, content, footer, primary-button, and
    // secondary-button: 6. Ten reads in all, with instance, card, and content read twice.
    const tree = withReadCounting(createFixture());
    const finder = createLayerFinder<TestNode>();
    finder.find(tree.root, titlePath);
    findLayers(tree.root, { primary: primaryLabelPath, secondary: secondaryLabelPath });
    expect(tree.reads).toEqual(
      new Map([
        ["instance", 2],
        ["card", 2],
        ["content", 2],
        ["header", 1],
        ["footer", 1],
        ["primary-button", 1],
        ["secondary-button", 1],
      ]),
    );
    expect(tree.totalReads()).toBe(10);
  });

  it("are none for an empty map", () => {
    const tree = withReadCounting(createFixture());
    expect(findLayers(tree.root, {})).toEqual({});
    expect(tree.totalReads()).toBe(0);
  });
});
