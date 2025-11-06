# Sample Skills for Snapshot Testing

This directory contains sample skill fixtures used by the P6 snapshot testing system.
Each skill is designed to test specific aspects of manifest validation and
snapshot functionality.

## Skills Overview

### Valid Skills

#### `basic-skill`
- **Purpose**: Test basic manifest structure validation
- **Features**: Minimal valid configuration with essential fields only
- **Used for**: Basic validation, structure testing

#### `skill-with-scripts`
- **Purpose**: Test scripts configuration handling
- **Features**: Includes both `run` and `dry-run` script definitions
- **Used for**: Script validation, execution testing

#### `skill-with-tools`
- **Purpose**: Test allowed-tools configuration
- **Features**: Multiple tool permissions (fs.read, fs.write, bash, git, npm)
- **Used for**: Tool permission validation, security testing

#### `minimal-skill`
- **Purpose**: Test minimal valid manifest
- **Features**: Only essential required fields
- **Used for**: Minimum requirements testing, edge cases

#### `complex-skill`
- **Purpose**: Test comprehensive manifest features
- **Features**: All supported manifest fields and configurations
- **Used for**: Full feature testing, complex validation scenarios

### Invalid Skills (Error Testing)

#### `malformed-skill`
- **Purpose**: Test error handling for malformed manifests
- **Errors**: Invalid version, non-array allowed-tools, invalid hash, invalid timestamp, unexpected fields
- **Used for**: Error detection, validation error testing

#### `invalid-version`
- **Purpose**: Test version format validation
- **Error**: Version "1.0" doesn't follow semver format (missing PATCH)
- **Used for**: Version validation, semver compliance testing

#### `invalid-hash`
- **Purpose**: Test hash validation (note: invalid hash injected during testing)
- **Error**: Hash format validation
- **Used for**: Hash integrity testing, package validation

## Usage in Tests

These skills are used by the snapshot testing system to validate:

1. **Manifest Structure Validation**
   - Required fields presence
   - Field type validation
   - Field format validation

2. **Content Validation**
   - Version format compliance
   - Hash format and integrity
   - Timestamp format validation
   - Script configuration validation

3. **Error Handling**
   - Malformed manifest detection
   - Clear error messages
   - Graceful failure handling

4. **Snapshot Consistency**
   - Deterministic packaging
   - Cross-platform compatibility
   - Hash computation consistency

## Adding New Skills

When adding new test skills:

1. Create a new directory with a descriptive name
2. Create a `SKILL.md` file with appropriate frontmatter
3. Document the skill's purpose in this README
4. Update the snapshot test cases if needed

## Skill Frontmatter Reference

```yaml
---
id: skill-identifier           # Required: Unique skill identifier
version: 1.0.0               # Required: Semantic version
name: Skill Name              # Required: Display name
summary: Brief description    # Optional: Skill summary
audience: target-users        # Optional: Target audience
when_to_use: Usage guidance   # Optional: Usage guidance
severity: low|medium|high     # Optional: Severity level
tags: [tag1, tag2]           # Optional: Search tags
allowed-tools:               # Required: Array of tool permissions
  - fs.read
  - fs.write
scripts:                     # Optional: Script definitions
  run: command-to-run
  dry-run: command-for-dry-run
---
```

## Test Coverage

These skills ensure comprehensive test coverage for:
- ✅ Basic manifest validation
- ✅ Script configuration testing
- ✅ Tool permission validation
- ✅ Version format validation
- ✅ Hash integrity testing
- ✅ Error handling and edge cases
- ✅ Complex manifest scenarios
- ✅ Cross-platform compatibility
- ✅ Deterministic packaging
- ✅ Snapshot consistency