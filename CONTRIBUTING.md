# Contributing

Thank you for helping with `@yuja-rides/figma-layer-path`. This guide describes how the
repository works, so that a change arrives in the shape it will be reviewed in.

## Before you start

Open an issue before changing behaviour. The API and its guarantees are deliberate and small,
and the [non-goals](README.md#non-goals) rule out a number of reasonable-sounding features, so
it is worth agreeing on a change before writing it. Fixes to documentation and tests can go
straight to a pull request.

## Setup

Use Node 24, as pinned in `.nvmrc`. Node 22.13 or later in the 22 line also works with the
development toolchain. Then install the dependencies from the lockfile:

```sh
npm ci
```

## Checks

`npm run check` runs every check a change must pass, in this order:

- `npm run typecheck`: extracts the TypeScript examples from `README.md`, then type-checks the
  library, the tests, and the scripts, and separately checks the README examples and
  `test/figma-typings.test-d.ts` against Figma's plugin typings.
- `npm run lint`: ESLint with typescript-eslint's strict and stylistic type-checked rules.
- `npm run format:check`: Prettier. Run `npm run format` to fix formatting.
- `npm run test`: the Vitest suite.
- `npm run build`: compiles `src` to `dist`.
- `npm run check:package`: checks that `npm pack` would publish exactly the intended files.

CI runs the same checks on every pull request, and `main` accepts only changes that pass them.
Fix the cause of a failing check rather than silencing it: do not disable a lint rule, loosen a
type, or weaken a test to make a change pass.

## Design rules

A change must keep these, because users rely on them:

- No runtime dependencies.
- The types require only `name` and `children`, so the library works on any tree, and Figma's
  nodes fit without casts.
- Names match exactly, through direct children only, and the first of several same-named
  siblings wins.
- A finder reads each layer's children at most once per pass.
- The layers returned are the tree's own nodes, synchronously, never copies.

## Tests

Take an expected value from what the behaviour should be, never from running the code. The
fixture in `test/fixture.ts` is small enough to count by hand. Read-count tests name, in a
comment, the layers that make up each expected count.

A test for a defect should fail before the fix. Check that it does.

## Branches and commits

Name a branch `<type>/<description>`, with a Conventional Commit type and a kebab-case
description, such as `feat/layer-path-lookup` or `ci/check-pull-requests`.

Write commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) form,
with an imperative, lower-case description and no trailing period:

```text
test: count children reads per lookup
build: check the published package contents
```

Use the body, wrapped at 72 columns, to explain why the change was made. The diff already
shows how.

## Pull requests

Fill in the template's sections: Summary, Changes, Testing, and Notes (deleted when empty).
Write for a reviewer who has not seen the work, and report testing as it happened, including
anything not tested.

A change to behaviour updates `README.md` and `CHANGELOG.md` in the same pull request. The
README's TypeScript examples are type-checked, so an example that no longer compiles fails CI.

A maintainer merges a pull request once its checks pass and the review is resolved.

## Releases

Maintainers release by creating a GitHub release named `v<version>` from `main`, where
`<version>` is the `version` in `package.json`. The release workflow runs every check again,
confirms the tag matches the version, and publishes to npm with provenance.

## Licence

Contributions are licensed under the [MIT licence](LICENSE) that covers this project.
