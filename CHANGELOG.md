# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-11-06

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
