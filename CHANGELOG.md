# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Type `CheckedLayerMap<M>`, the shape `findLayers` checks a map against, key by key.

### Changed

- The README starts with when to use the library and when Figma's own API fits better, explains
  why it reads fewer layers, says which function to pick, and covers the roots that need `C`
  given explicitly, such as `figma.root`.

### Fixed

- `findLayers` accepts maps typed with interfaces, alone and nested, which have no index
  signature and so did not fit `LayerMap`. Every map accepted before is still accepted, with the
  same result type, and arrays of layer paths and functions are still rejected.

## [0.1.1] - 2026-11-07

### Changed

- The README shows the published npm version.

## [0.1.0] - 2026-11-06

### Added

- `findLayer(root, path)`: finds the layer at one layer path in a single walk.
- `createLayerFinder()`: a finder whose lookups share reads of each layer's children for the
  duration of one pass.
- `findLayers(root, map)`: resolves a nested map of layer paths with one finder, returning a
  result in the map's shape.
- Types `LayerNode`, `LayerPath`, `LayerMap`, `FoundLayers`, and `LayerFinder`.

[Unreleased]: https://github.com/Meiro-Mobility/figma-layer-path/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Meiro-Mobility/figma-layer-path/releases/tag/v0.1.1
[0.1.0]: https://github.com/Meiro-Mobility/figma-layer-path/releases/tag/v0.1.0
