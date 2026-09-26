# Changesets

Changesets describe user-facing package changes and drive package versioning.

Run `pnpm changeset` when a pull request changes a publishable package. Select the affected packages, choose the appropriate semantic version bump, and commit the generated Markdown file with the pull request.

Changesets are not required for documentation, infrastructure, application-only, or private-package changes.

Run `pnpm changeset:status` to inspect pending releases. The publish workflow opens a version pull request when changesets are pending and publishes updated packages publicly to npm after that pull request is merged. The publish job uses npm trusted publishing through GitHub Actions OIDC. Configure a trusted publisher for each public package with GitHub owner `adamaho`, repository `nopeus`, workflow `publish.yml`, and direct `npm publish` allowed. Automatic releases remain paused until the repository variable `NPM_RELEASES_ENABLED` is set to `true`.
