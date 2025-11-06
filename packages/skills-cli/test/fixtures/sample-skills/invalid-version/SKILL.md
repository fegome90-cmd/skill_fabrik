---
id: invalid-version
version: 1.0
name: Invalid Version Skill
summary: A skill with invalid version format
allowed-tools:
  - fs.read
---

# Invalid Version Skill

This skill has an invalid version format (missing PATCH version)
to test version validation in the snapshot testing system.

## Expected Validation Error

The version "1.0" should be rejected because it doesn't follow
semantic versioning format (MAJOR.MINOR.PATCH).

## Valid Version Examples

- "1.0.0" - Basic semver
- "2.1.3" - Standard semver
- "1.0.0-alpha.1" - Pre-release version
- "1.0.0+build.1" - Build metadata

## Testing Purpose

This skill tests:
- Version format validation
- Semantic versioning compliance
- Version error message accuracy
- Version field validation edge cases