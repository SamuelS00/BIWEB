# BIWEB — task runner unificado (ADR-0026). `just --list` mostra tudo.

default:
    @just --list

# Instala dependências TS e baixa crates Rust
setup:
    pnpm install
    cargo fetch

# Shell da aplicação em modo desenvolvimento (gera tokens antes)
dev:
    pnpm dev

# Gera os tokens (DTCG → CSS vars, TS, temas ECharts)
tokens:
    pnpm tokens

# Lint, fronteiras, typecheck e testes (TS + Rust)
check:
    pnpm lint
    pnpm typecheck
    pnpm test
    cargo clippy --workspace --all-targets -- -D warnings
    cargo test --workspace

build:
    pnpm build
    cargo build --workspace
