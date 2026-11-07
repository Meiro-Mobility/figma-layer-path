/**
 * Compile-time checks of the maps `findLayers` accepts and the result types it gives for them.
 * `tsc -p tsconfig.json` checks this file; Vitest does not run it, because its values are
 * declared, not created.
 */
import { expectTypeOf } from "vitest";
import { findLayers } from "../src/index.js";
import type { LayerMap, LayerNode, LayerPath } from "../src/index.js";

interface Node extends LayerNode<Node> {
  readonly id: string;
}

interface StateLayers {
  readonly on: LayerPath;
  readonly off: LayerPath;
}

// A type alias on purpose: its implicit index signature is what the interface above lacks.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type StateAlias = { readonly on: LayerPath; readonly off: LayerPath };

declare const root: Node;
declare const asInterface: StateLayers;
declare const asAlias: StateAlias;
declare const dynamic: LayerMap;

expectTypeOf(findLayers(root, asInterface)).toEqualTypeOf<{
  readonly on: Node | undefined;
  readonly off: Node | undefined;
}>();
expectTypeOf(findLayers(root, { state: asInterface }).state.on).toEqualTypeOf<Node | undefined>();
expectTypeOf(findLayers(root, asAlias).off).toEqualTypeOf<Node | undefined>();
expectTypeOf(
  findLayers(root, { title: ["title"], buttons: { primary: ["primary"] } }).buttons.primary,
).toEqualTypeOf<Node | undefined>();
expectTypeOf(findLayers(root, ["title"])).toEqualTypeOf<Node | undefined>();
findLayers(root, dynamic);

// @ts-expect-error A leaf must be a layer path, not a number.
findLayers(root, { t: 5 });
// @ts-expect-error A layer path holds only strings.
findLayers(root, { t: ["x", 1] });
// @ts-expect-error An array of layer paths would be read as one layer path at runtime.
findLayers(root, [["a"], ["b"]]);
// @ts-expect-error A function is not a map.
findLayers(root, { f: () => 1 });
// @ts-expect-error The leaves of an interface-typed map are checked too.
findLayers(root, { state: asInterface, count: 2 });
