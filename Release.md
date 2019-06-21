# Guidelines to contributors for releasing a new version

Run `npm run prepare-release` command to prepare a release.
This uses the [standard-version](https://github.com/conventional-changelog/standard-version) package to do the following.

1. bumps the version in metadata files (package.json, composer.json, etc),
1. uses conventional-changelog to update CHANGELOG.md,
1. commits package.json (et al.) and CHANGELOG.md, and
1. tags a new release.

In case you want to modify the release in some way, check the documentation of [standard-version](https://github.com/conventional-changelog/standard-version).

It does not by itself deploys the new version to anywhere.
That is done automatically by Travis when the changes are pushed to master branch.
