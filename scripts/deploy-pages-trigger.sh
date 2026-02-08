#!/usr/bin/env bash
set -euo pipefail

commit_message="${1:-Trigger GitHub Pages deploy}"
branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ -z "$branch" || "$branch" == "HEAD" ]]; then
  echo "Unable to detect current branch."
  exit 1
fi

git commit --allow-empty -m "$commit_message"
git push origin "$branch"

echo "Triggered GitHub Pages deploy from branch: $branch"
