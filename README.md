# figma-layer-path

[![CI](https://github.com/Meiro-Mobility/figma-layer-path/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Meiro-Mobility/figma-layer-path/actions/workflows/ci.yml?query=branch%3Amain)
[![npm](https://img.shields.io/npm/v/@yuja-rides/figma-layer-path)](https://www.npmjs.com/package/@yuja-rides/figma-layer-path)

Find the named parts of a Figma component instance or frame by layer path, reading each layer's
children at most once per pass.

## When to use it

Use it when a plugin reads or edits several named parts of an instance or frame, such as a card's
title and button labels, across one or many instances. It replaces:

- chained `findChild` calls from the root for each part, which repeat the reads of every shared
  ancestor, and
- `findOne` or `findAll` by name, which search the whole subtree and can match a repeated name,
  such as `label`, in the wrong place.

It does not depend on Figma: any tree whose nodes have a `name` and optional `children` works,
such as a parsed Figma REST API file or plain objects in tests.

**When not to use it.** Figma's own API is the better fit for search by type or plugin data
(`findAllWithCriteria`), for a match at any depth (`findAll`), and for one node whose id you
already have (`figma.getNodeByIdAsync`).

## What a layer path is

A layer path is the list of layer names from a root down to a target layer, one name per level,
through direct children only. Take this card component instance:

```text
instance (root; its own name is not part of the path)
└── card
    └── content
        ├── header
        │   └── title
        └── footer
            ├── primary-button
            │   └── label
            └── secondary-button
                └── label
```

The path to the title is `["card", "content", "header", "title"]`, and the path to the primary
button's label is `["card", "content", "footer", "primary-button", "label"]`. The name `label`
alone is ambiguous here; a layer path names exactly one place.

## Install

```sh
npm install @yuja-rides/figma-layer-path
```

The package is ESM only, with no runtime dependencies. Bundle it into your plugin's code as you
would any other dependency.

## Usage

Pick the function by how your lookups arrive:

| Lookups                                    | Use                   | Why                                                                     |
| ------------------------------------------ | --------------------- | ----------------------------------------------------------------------- |
| One path                                   | `findLayer`           | Stops at the first match at each level, so it can read the fewest names |
| Several paths, all known up front          | `findLayers`          | One call, with a result in the shape of your map                        |
| Paths spread through code, or across loops | `createLayerFinder()` | Lookups share reads for as long as you keep the finder                  |

### `findLayers(root, map, finder?)`

Finds every layer path in a nested map in one pass. The result has the map's shape, with each
layer path replaced by its layer, or `undefined` where it is missing.

```typescript
import { findLayers } from "@yuja-rides/figma-layer-path";

const [instance] = figma.currentPage.selection;
if (instance?.type === "INSTANCE") {
  const layers = findLayers(instance, {
    title: ["card", "content", "header", "title"],
    buttons: {
      primary: ["card", "content", "footer", "primary-button", "label"],
      secondary: ["card", "content", "footer", "secondary-button", "label"],
    },
  });
  // layers.title, layers.buttons.primary, and layers.buttons.secondary are each
  // SceneNode | undefined.
  if (layers.buttons.primary?.type === "TEXT") {
    console.log(layers.buttons.primary.characters);
  }
}
```

A map can be declared once, as an interface or a type alias, and reused for every instance:

```typescript
import { findLayers, type LayerPath } from "@yuja-rides/figma-layer-path";

interface ButtonLayers {
  readonly primary: LayerPath;
  readonly secondary: LayerPath;
}

const buttonLayers: ButtonLayers = {
  primary: ["card", "content", "footer", "primary-button", "label"],
  secondary: ["card", "content", "footer", "secondary-button", "label"],
};

for (const node of figma.currentPage.selection) {
  if (node.type === "INSTANCE") {
    const { primary, secondary } = findLayers(node, buttonLayers);
    console.log(node.name, primary?.name, secondary?.name);
  }
}
```

To look up layers of the same instance across several calls, pass one finder to each. Layers
the finder has already read are not read again, and the layers `findLayers` reads are shared
with later lookups through the finder. Without a finder, `findLayers` uses one of its own for the
call. Either way, a finder lives for one pass only.

```typescript
import { createLayerFinder, findLayers } from "@yuja-rides/figma-layer-path";

const [instance] = figma.currentPage.selection;
if (instance?.type === "INSTANCE") {
  const finder = createLayerFinder<SceneNode>();
  const title = finder.find(instance, ["card", "content", "header", "title"]);
  console.log(title?.name);
  // card and content are not read again: the finder read them for the title.
  const buttons = findLayers(
    instance,
    {
      primary: ["card", "content", "footer", "primary-button", "label"],
      secondary: ["card", "content", "footer", "secondary-button", "label"],
    },
    finder,
  );
  console.log(buttons.primary?.name, buttons.secondary?.name);
}
```

### `findLayer(root, path)`

Finds the layer at one layer path, in a single walk that stops at the first matching child at
each level. Gives `undefined` where any step is missing, and for an empty path.

```typescript
import { findLayer } from "@yuja-rides/figma-layer-path";

const [instance] = figma.currentPage.selection;
if (instance?.type === "INSTANCE") {
  const title = findLayer(instance, ["card", "content", "header", "title"]);
  if (title?.type === "TEXT") {
    console.log(title.characters);
  }
}
```

### `createLayerFinder()`

Creates a finder for one pass. However many lookups go through it, the finder reads each layer's
children, and their names, at most once. Create one per pass and drop it afterwards, because a
layer's children can change between edits.

```typescript
import { createLayerFinder } from "@yuja-rides/figma-layer-path";

const finder = createLayerFinder<SceneNode>();
for (const node of figma.currentPage.selection) {
  if (node.type !== "INSTANCE") {
    continue;
  }
  // Both lookups share the reads of card, content, and footer.
  const primary = finder.find(node, ["card", "content", "footer", "primary-button", "label"]);
  const secondary = finder.find(node, ["card", "content", "footer", "secondary-button", "label"]);
  if (primary?.type === "TEXT" && secondary?.type === "TEXT") {
    console.log(node.name, primary.characters, secondary.characters);
  }
}
```

## Why it exists

Plugin code runs in a sandbox, and the nodes it holds are handles: reading `node.children` or
`child.name` is a call into Figma, not a field in memory. Each call is cheap, but they add up
across many layers and many instances.

Resolving a layer path is like resolving a file path, where listing each folder is the slow part.
Lookups made one at a time from the root list the same folders again and again. A finder keeps
each listing for one pass, so paths sharing a prefix reuse it:

```typescript
import { findLayer, findLayers } from "@yuja-rides/figma-layer-path";

const [instance] = figma.currentPage.selection;
if (instance?.type === "INSTANCE") {
  // Separately: instance, card, and content are read three times each, 14 reads in all.
  findLayer(instance, ["card", "content", "header", "title"]);
  findLayer(instance, ["card", "content", "footer", "primary-button", "label"]);
  findLayer(instance, ["card", "content", "footer", "secondary-button", "label"]);

  // Together: each of the 7 layers on the way is read once.
  findLayers(instance, {
    title: ["card", "content", "header", "title"],
    primary: ["card", "content", "footer", "primary-button", "label"],
    secondary: ["card", "content", "footer", "secondary-button", "label"],
  });
}
```

Measured on real component instances through the plugin API, about a dozen lookups made one at a
time took 9.5 to 11.4 ms per instance. Sharing the reads of common ancestors took about 2.9 ms.

## Types

- `LayerNode<C>`: any node with a `name` and, optionally, `children` of type `C`. `C` is the type
  of the children, not of the root, and the layers found are of type `C`.
- `LayerPath`: a `readonly string[]` of layer names, one per level.
- `LayerMap`: a layer path, or an object whose values are layer maps. Use it to annotate maps
  built at runtime. An interface does not fit it, because interfaces have no index signature,
  but `findLayers` accepts interface-typed maps directly.
- `CheckedLayerMap<M>`: the shape `findLayers` checks a map `M` against, key by key. It rejects a
  leaf that is not a layer path, an array of layer paths (which would be read as one path), and a
  function. The error names the bad key and reads as not assignable to `never`.
- `FoundLayers<M, C>`: the result of `findLayers`, in the shape of the map `M`.
- `LayerFinder<C>`: the object `createLayerFinder` returns, with one method,
  `find(root, path)`.

### Figma nodes and `C`

Figma's tree has three kinds of node: a `DocumentNode` (`figma.root`), whose children are
`PageNode`s, whose descendants are all `SceneNode`s. Since every layer below a page is a
`SceneNode`, `C` is inferred as `SceneNode` for any root that has children: a page, frame,
instance, component, section, or group. Results are plain `SceneNode`s, so narrow them by `type`
before reading type-specific properties, as the examples do with `type === "TEXT"`.

Two roots need `C` spelled out:

- `figma.root` does not compile without it, because its children are pages, not scene nodes.
  Pass `BaseNode`, which covers all three kinds.
- A root whose type has no `children`, such as `TextNode`, infers `C` as `unknown`, so its result
  cannot be narrowed. Pass `SceneNode`.

```typescript
import { findLayer } from "@yuja-rides/figma-layer-path";

// In "dynamic-page" plugins, call loadAsync() on a page before reading its layers this way.
const card = findLayer<BaseNode>(figma.root, ["Page 1", "card"]);
if (card?.type === "FRAME") {
  console.log(card.width);
}

const [selected] = figma.currentPage.selection;
if (selected?.type === "TEXT") {
  const found = findLayer<SceneNode>(selected, ["label"]); // SceneNode | undefined
  console.log(found?.type);
}
```

## Guarantees

- Names match exactly, through direct children only. Where several siblings share a name, the
  first one wins.
- The layers returned are the tree's own nodes, never copies, and every function is synchronous.
- A finder tells nodes apart by object identity, not by `id`, so pass the same root object to
  every lookup in a pass. A second handle to the same node only costs extra reads, never a wrong
  result.
- A finder reads the name of every child of each parent it steps through, to index them, where
  `findLayer` stops at the first match. For a single lookup, `findLayer` reads the same layers'
  children but can read fewer names.
- Any object with `name` and `children` works, so code using it can be tested on plain object
  trees without Figma.
- No runtime dependencies.

## Non-goals

- Selectors, wildcards, or search by type or property.
- Reading layer contents, such as text or component properties.
- Caching across passes, since a layer's children change between edits.
- Knowledge of any particular component's structure.

## Contributing

See [CONTRIBUTING.md](https://github.com/Meiro-Mobility/figma-layer-path/blob/main/CONTRIBUTING.md)
for setup, the checks a change must pass, and how pull requests and releases work.

## Licence

[MIT](https://github.com/Meiro-Mobility/figma-layer-path/blob/main/LICENSE)
