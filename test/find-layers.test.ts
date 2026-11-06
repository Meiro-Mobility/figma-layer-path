import { describe, expect, it } from "vitest";
import { findLayers } from "../src/index.js";
import { createFixture, primaryLabelPath, secondaryLabelPath, titlePath } from "./fixture.js";

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

  it("returns an empty object for an empty map", () => {
    expect(findLayers(createFixture(), {})).toEqual({});
  });
});
