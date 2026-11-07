import { describe, expect, it } from "vitest";
import { createLayerFinder, findLayers } from "../src/index.js";
import type { LayerPath } from "../src/index.js";
import { createFixture, primaryLabelPath, secondaryLabelPath, titlePath } from "./fixture.js";
import type { TestNode } from "./fixture.js";

describe("findLayers", () => {
  it("keeps the map's shape, including nested maps", () => {
    const root = createFixture();
    const found = findLayers(root, {
      title: titlePath,
      buttons: {
        primary: primaryLabelPath,
        secondary: secondaryLabelPath,
        deeper: { card: ["card"] },
      },
    });
    expect(Object.keys(found)).toEqual(["title", "buttons"]);
    expect(Object.keys(found.buttons)).toEqual(["primary", "secondary", "deeper"]);
    expect(found.title?.id).toBe("title");
    expect(found.buttons.primary?.id).toBe("primary-label");
    expect(found.buttons.secondary?.id).toBe("secondary-label");
    expect(found.buttons.deeper.card?.id).toBe("card");
  });

  it("gives undefined for a missing layer path while the others still resolve", () => {
    const found = findLayers(createFixture(), {
      title: titlePath,
      tertiary: ["card", "content", "footer", "tertiary-button", "label"],
      secondary: secondaryLabelPath,
    });
    expect(found.title?.id).toBe("title");
    expect(found.tertiary).toBeUndefined();
    expect("tertiary" in found).toBe(true);
    expect(found.secondary?.id).toBe("secondary-label");
  });

  it("accepts maps typed with interfaces, flat and nested", () => {
    interface ButtonLayers {
      readonly primary: LayerPath;
      readonly secondary: LayerPath;
    }
    interface CardLayers {
      readonly title: LayerPath;
      readonly buttons: ButtonLayers;
    }
    const buttons: ButtonLayers = { primary: primaryLabelPath, secondary: secondaryLabelPath };
    const card: CardLayers = { title: titlePath, buttons };

    const flat = findLayers(createFixture(), buttons);
    expect(flat.primary?.id).toBe("primary-label");
    expect(flat.secondary?.id).toBe("secondary-label");

    const nested = findLayers(createFixture(), card);
    expect(nested.title?.id).toBe("title");
    expect(nested.buttons.primary?.id).toBe("primary-label");
    expect(nested.buttons.secondary?.id).toBe("secondary-label");

    const wrapped = findLayers(createFixture(), { card });
    expect(wrapped.card.buttons.secondary?.id).toBe("secondary-label");
  });

  it("finds the same layers, by identity, with a finder passed as without one", () => {
    const root = createFixture();
    const map = {
      title: titlePath,
      buttons: { primary: primaryLabelPath, secondary: secondaryLabelPath },
      missing: ["card", "missing"],
    };
    const finder = createLayerFinder<TestNode>();
    // A lookup first, so the finder joins findLayers with reads already made.
    finder.find(root, titlePath);

    const withFinder = findLayers(root, map, finder);
    const without = findLayers(root, map);
    expect(withFinder.title).toBe(without.title);
    expect(withFinder.buttons.primary).toBe(without.buttons.primary);
    expect(withFinder.buttons.secondary).toBe(without.buttons.secondary);
    expect(withFinder.missing).toBeUndefined();
    expect(without.missing).toBeUndefined();
    expect(withFinder.title?.id).toBe("title");
    expect(withFinder.buttons.primary?.id).toBe("primary-label");
  });

  it("returns an empty object for an empty map", () => {
    expect(findLayers(createFixture(), {})).toEqual({});
  });
});
