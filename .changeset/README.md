# Changesets

Changesets describe user-facing package changes and drive package versioning.

Run `pnpm changeset` when a pull request changes a publishable package. Select the affected packages, choose the appropriate semantic version bump, and commit the generated Markdown file with the pull request.

Changesets are not required for documentation, infrastructure, application-only, or private-package changes.

Run `pnpm changeset:status` to inspect pending releases. The publish workflow opens a version pull request when changesets are pending and publishes updated packages to GitHub Packages after that pull request is merged.
