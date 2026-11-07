# figma-layer-path

[![CI](https://github.com/Meiro-Mobility/figma-layer-path/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Meiro-Mobility/figma-layer-path/actions/workflows/ci.yml?query=branch%3Amain)
[![npm](https://img.shields.io/npm/v/@yuja-rides/figma-layer-path)](https://www.npmjs.com/package/@yuja-rides/figma-layer-path)

Find layers in a Figma node tree by layer path, reading each layer's children at most once per
pass.

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
button's label is `["card", "content", "footer", "primary-button", "label"]`.

A layer name alone is ambiguous: `label` appears twice here, and
`instance.findOne((node) => node.name === "label")` returns whichever it meets first. A layer path
names exactly one place.

## Why it exists

In a Figma plugin, every read of a node's `children`, and of each child's `name`, crosses the
plugin API. A plugin that reads several named parts of a component instance usually looks each one
up from the instance root, repeating the reads of every shared ancestor, or uses `findOne` or
`findAll`, which search the whole subtree and can match a repeated name in the wrong place.

Measured on real component instances through the plugin API, about a dozen lookups made one at a
time took 9.5 to 11.4 ms per instance. Sharing the reads of common ancestors took about 2.9 ms.

Figma's plugin API has no lookup by layer path: `findChild`, `findOne`, and `findAll` take
callbacks and read every child's name, and `findAllWithCriteria` filters by type and plugin data.

## Install

```sh
npm install @yuja-rides/figma-layer-path
```

The package is ESM only, with no runtime dependencies. Bundle it into your plugin's code as you
would any other dependency.

## Usage

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

### `findLayers(root, map)`

Finds every layer path in a nested map with one finder, so layer paths sharing a prefix read it
once. The result has the map's shape, with each layer path replaced by its layer, or `undefined`
where it is missing.

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

### Types

- `LayerNode<C>`: any node with a `name` and, optionally, `children` of type `C`. Figma's scene
  nodes fit it as they are, and the layers found keep their own type, such as `SceneNode`.
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

## Guarantees

- Names match exactly, through direct children only. Where several siblings share a name, the
  first one wins.
- The layers returned are the tree's own nodes, never copies, and every function is synchronous.
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
