#!/usr/bin/env bash
set -euo pipefail

# Forward scope and agent options to both sources. The override supports local previews.
SOURCE="${NOPEUS_SKILLS_SOURCE:-https://github.com/adamaho/nopeus/tree/dev/packages/nopeus-skills}"
npx skills add "$SOURCE" --skill '*' "$@"
npx skills add kitlangton/skills --skill effect "$@"
