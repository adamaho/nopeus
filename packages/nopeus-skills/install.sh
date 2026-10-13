#!/usr/bin/env bash
set -euo pipefail

# Forward scope and agent options to both sources.
npx skills add https://github.com/adamaho/nopeus/tree/dev/packages/nopeus-skills --skill '*' "$@"
npx skills add kitlangton/skills --skill effect "$@"
