/**
 * Compile-time checks that Figma's own node types fit the library's generic types, so plugin code
 * can pass nodes in and get Figma nodes back without casts. `tsc -p tsconfig.figma.json` checks
 * this file; nothing runs it, because its values are declared, not created.
 *
 * It has its own tsconfig because Figma's typings and Node's both declare globals such as `fetch`
 * and `console`, and so cannot share a program. For the same reason it cannot import Vitest,
 * whose declarations need Node's, and spells out its two type assertions itself.
 */
import { createLayerFinder, findLayer, findLayers } from "../src/index.js";
import type { LayerNode, LayerPath } from "../src/index.js";

/** Compiles only when `T` is `true`. */
type Expect<T extends true> = T;

/** `true` when `A` is assignable to `B`; the tuples stop unions from distributing. */
type Fits<A, B> = [A] extends [B] ? true : false;

/** `true` only for `any`, which is otherwise assignable both ways to every type. */
type IsAny<T> = 0 extends 1 & T ? true : false;

/** `true` when `A` and `B` are assignable to each other and neither is `any` unless both are. */
type Equals<A, B> =
  IsAny<A> extends true
    ? IsAny<B>
    : IsAny<B> extends true
      ? false
      : Fits<A, B> extends true
        ? Fits<B, A>
        : false;

declare const instance: InstanceNode;
declare const path: LayerPath;

// Exported only so they count as used; their types are what the checks read.
export const viaFindLayer = findLayer(instance, path);
export const viaFinder = createLayerFinder<SceneNode>().find(instance, path);
export const viaMap = findLayers(instance, {
  title: ["card", "content", "header", "title"],
  buttons: { primary: ["card", "content", "footer", "primary-button", "label"] },
});

export type Checks = [
  Expect<Fits<SceneNode, LayerNode<SceneNode>>>,
  Expect<Fits<InstanceNode, LayerNode<SceneNode>>>,
  Expect<Fits<FrameNode, LayerNode<SceneNode>>>,
  Expect<Equals<typeof viaFindLayer, SceneNode | undefined>>,
  Expect<Equals<typeof viaFinder, SceneNode | undefined>>,
  Expect<Equals<typeof viaMap.title, SceneNode | undefined>>,
  Expect<Equals<typeof viaMap.buttons.primary, SceneNode | undefined>>,
];
