/**
 * Any node with a name and, optionally, children. Figma's scene nodes fit it structurally. `C` is the
 * caller's own node type, so the layers found keep every property they have.
 */
export interface LayerNode<C> {
  readonly name: string;
  readonly children?: readonly C[];
}

/** The names of the layers from a root down to a target, one per level, through direct children only. */
export type LayerPath = readonly string[];

/** A nested map whose leaves are layer paths. */
export type LayerMap = LayerPath | { readonly [key: string]: LayerMap };

/**
 * The shape `findLayers` accepts for a map `M`, checked key by key. It is `M`'s own shape where
 * every leaf is a layer path and `never` at any leaf that is not, so `M & CheckedLayerMap<M>`
 * accepts maps typed with interfaces, which have no index signature and so do not fit `LayerMap`.
 * Arrays other than layer paths, and functions, are rejected because at runtime an array is read
 * as a single layer path and a function is not a map.
 */
export type CheckedLayerMap<M> = M extends LayerPath
  ? M
  : M extends readonly unknown[] | ((...args: never[]) => unknown)
    ? never
    : M extends object
      ? { readonly [K in keyof M]: CheckedLayerMap<M[K]> }
      : never;

/** A map with each layer path replaced by the layer found there, or undefined where it is missing. */
export type FoundLayers<M, C> = M extends LayerPath
  ? C | undefined
  : { readonly [K in keyof M]: FoundLayers<M[K], C> };

/** Finds layers by layer path, sharing reads across lookups for the duration of one pass. */
export interface LayerFinder<C> {
  find(root: LayerNode<C>, path: LayerPath): C | undefined;
}

/**
 * Finds the layer at a layer path below a root, in one walk that stops at the first matching child
 * at each level. Gives undefined where any step is missing, and for an empty path.
 */
export function findLayer<C extends LayerNode<C>>(
  root: LayerNode<C>,
  path: LayerPath,
): C | undefined {
  let current: LayerNode<C> = root;
  let found: C | undefined;
  for (const name of path) {
    found = current.children?.find((child) => child.name === name);
    if (found === undefined) {
      return undefined;
    }
    current = found;
  }
  return found;
}

/**
 * Creates a finder for one pass. Each layer's children, and their names, are read at most once by
 * the finder, however many lookups pass through it. Create one per pass and drop it, because a
 * layer's children can change between edits.
 */
export function createLayerFinder<C extends LayerNode<C>>(): LayerFinder<C> {
  const childrenByName = new Map<LayerNode<C>, ReadonlyMap<string, C>>();
  const childrenOf = (parent: LayerNode<C>): ReadonlyMap<string, C> => {
    let index = childrenByName.get(parent);
    if (index === undefined) {
      const byName = new Map<string, C>();
      for (const child of parent.children ?? []) {
        // The first of several siblings with one name wins, as it does in `findLayer`.
        if (!byName.has(child.name)) {
          byName.set(child.name, child);
        }
      }
      index = byName;
      childrenByName.set(parent, index);
    }
    return index;
  };
  return {
    find(root, path) {
      let current: LayerNode<C> = root;
      let found: C | undefined;
      for (const name of path) {
        found = childrenOf(current).get(name);
        if (found === undefined) {
          return undefined;
        }
        current = found;
      }
      return found;
    },
  };
}

/** Tells a layer path, the leaf of a layer map, apart from a nested map. */
function isLayerPath(map: LayerMap): map is LayerPath {
  return Array.isArray(map);
}

/** Resolves every layer path in a map with one finder, keeping the map's shape. */
function resolveMap<C extends LayerNode<C>>(
  finder: LayerFinder<C>,
  root: LayerNode<C>,
  map: LayerMap,
): unknown {
  if (isLayerPath(map)) {
    return finder.find(root, map);
  }
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [key, resolveMap(finder, root, value)]),
  );
}

/**
 * Finds every layer path in a nested map with one finder, so layer paths sharing a prefix read it
 * once. The result has the map's shape, with each layer path replaced by its layer or undefined.
 */
export function findLayers<C extends LayerNode<C>, M>(
  root: LayerNode<C>,
  map: M & CheckedLayerMap<M>,
): FoundLayers<M, C> {
  // `CheckedLayerMap` has already checked every leaf, but the checker cannot relate it to
  // `LayerMap`, nor the recursion that follows the map's shape to the mapped return type; the
  // tests cover each shape.
  return resolveMap(createLayerFinder<C>(), root, map as LayerMap) as FoundLayers<M, C>;
}
