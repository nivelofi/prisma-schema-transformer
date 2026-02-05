# CLAUDE.md

## Project Overview

**prisma-schema-transformer** is a CLI tool and library that transforms Prisma schema files from snake_case naming conventions to camelCase, automatically adding `@map` and `@@map` attributes to preserve database column/table name mappings. It parses schemas using Prisma's DMMF (Data Model Meta Format), transforms the AST, and deserializes it back to Prisma schema syntax.

**Version:** 0.8.1
**License:** MIT
**Prisma version:** Locked to 4.11.0 / 4.12.0

## Architecture

```
src/
├── index.ts          # Main entry: fixPrismaFile() orchestrates parse → transform → deserialize
├── transformer.ts    # DMMF transformation logic (snake_case → camelCase)
└── deserializer.ts   # DMMF-to-Prisma-schema string conversion

bin.js                # CLI entry point (plain JS, loads dist/)
fixtures/             # Test fixture .prisma files
test/                 # Jest test files (*jest.ts naming)
  └── __snapshots__/  # Jest snapshot files
```

### Data Flow

1. `fixPrismaFile()` reads a `.prisma` file and parses it via `getDMMF()` and `getConfig()` from `@prisma/internals`
2. Models and enums are filtered by an optional deny list
3. `dmmfModelTransformer()` / `dmmfEnumTransformer()` transform names to camelCase using `immer` for immutable updates
4. `dmmfModelsdeserializer()` and related functions convert the DMMF back to Prisma schema text
5. The CLI (`bin.js`) optionally formats the output with `formatSchema()` before writing

### Key Source Files

- **`src/index.ts`** — Public API. Exports `fixPrismaFile()` and re-exports everything from transformer and deserializer.
- **`src/transformer.ts`** — Core transformation. Uses `camelcase` and `pluralize` to convert names. Uses `immer.produce()` for immutable state transformations. Handles model names, field names, relations, enums, unique fields, ID fields, and primary keys.
- **`src/deserializer.ts`** — Converts DMMF structures back to Prisma schema text. Defines the `Field`, `Attribute`, and `Model` interfaces used throughout the project. Handles all Prisma attributes (`@default`, `@id`, `@unique`, `@updatedAt`, `@map`, `@relation`, `@@map`, `@@id`, `@@unique`).
- **`bin.js`** — CLI executable. Parses args with `arg`, supports `--print`, `--deny`, `--version`, `--help`.

## Development Commands

```bash
# Build (compiles TypeScript to dist/)
yarn build

# Run tests (sets DATABASE_URL for Prisma DMMF parsing)
yarn test

# Lint
yarn lint
yarn lint:fix

# Run dev script (invoke.ts)
yarn dev

# Transform a fixture schema
yarn schema
```

### Build

- `yarn build` removes `dist/` and runs `tsc -p tsconfig.json`
- `yarn prepare` (npm lifecycle hook) runs `yarn build` automatically before publish
- Output goes to `dist/` as CommonJS (`module: "commonjs"`, `target: "es2018"`)
- Declaration files are generated (`declaration: true`)

### Testing

- Framework: Jest with `ts-jest` preset
- Test environment: Node.js
- Test file pattern: `**/**jest.ts` (not `.test.ts` or `.spec.ts`)
- Tests require `DATABASE_URL` environment variable (set in the test script to `postgresql://localhost:5432/prisma`)
- Tests use **snapshot testing** — update snapshots with `yarn test -- -u`
- Tests validate both the deserialized output (snapshot comparison) and round-trip correctness (transform then re-parse should yield identical DMMF)
- Max workers: 50%

### Linting

- ESLint with TypeScript parser
- Key style rules:
  - **No semicolons** (`semi: ['error', 'never']`)
  - No nested ternaries
  - No else-return
  - Sorted ES6 imports (auto-fixable)
  - No relative parent imports (`../*` restricted)
  - Multiline member delimiters: none; singleline: semi
- Prettier integration via `eslint-config-prettier`
- ESLint ignores: `*.json`, `*.yml`, `*.js`, `*.cjs`

## Code Conventions

- **TypeScript** with strict mode enabled, but `noImplicitAny: false`
- **No semicolons** — enforced by ESLint
- **Tabs for indentation** in deserializer.ts; 2-space indentation is the editorconfig standard for JS/TS (mixed in practice)
- **Immutable transformations** — use `immer`'s `produce()` for all DMMF mutations in transformer.ts
- **camelCase** for variables and functions; **PascalCase** for types/interfaces/model names
- **Imports** must be sorted (ES6 auto-sort plugin); no relative parent imports (`../`)
- **Package manager:** Yarn (v1). Use `yarn` commands, not `npm`.
- Test files use `*.jest.ts` naming convention

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@prisma/internals` (4.12.0) | DMMF parsing via `getDMMF()`, schema formatting |
| `@prisma/generator-helper` (4.11.0) | Prisma types (DMMF, DataSource, GeneratorConfig) |
| `@prisma/engine-core` | `printGeneratorConfig()` for generator serialization |
| `immer` | Immutable state transformations |
| `camelcase` | String conversion to camelCase |
| `pluralize` | Singularize/pluralize model and field names |
| `arg` | CLI argument parsing |
| `dotenv` | Environment variable loading |

## CLI Usage

```bash
# Transform a schema file in-place
prisma-schema-transformer ./schema.prisma

# Print to stdout instead of writing
prisma-schema-transformer ./schema.prisma --print

# Exclude specific models
prisma-schema-transformer ./schema.prisma --deny knex_migrations --deny knex_migration_lock
```

## Common Pitfalls

- Tests require `DATABASE_URL` to be set (even though no actual database connection is made — Prisma's DMMF parser requires it). The test script handles this automatically.
- The `jest` package is in `dependencies` rather than `devDependencies`.
- Prisma is pinned to v4 (4.11.0/4.12.0). Do not upgrade without verifying DMMF API compatibility.
- `bin.js` is plain JavaScript that loads from `dist/` — always run `yarn build` before testing the CLI manually.
- Snapshot tests must be updated (`yarn test -- -u`) when transformer or deserializer output changes.
