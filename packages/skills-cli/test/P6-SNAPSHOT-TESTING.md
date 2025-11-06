# P6 - Snapshot Testing for manifest.json

## Overview

P6 implements a comprehensive snapshot testing system for `manifest.json` files in the Skills Fabric packaging system. This ensures package consistency, validates manifest structure, and guarantees deterministic packaging behavior across different environments.

## Features

### ✅ Core Functionality
- **Manifest Structure Validation**: Comprehensive validation against expected schema
- **Hash Computation Validation**: SHA-256 hash integrity verification
- **Cross-Platform Consistency**: Platform-agnostic testing with compatibility checks
- **Deterministic Packaging**: Ensures consistent package generation
- **Snapshot Management**: Create, compare, and update snapshots automatically
- **Error Handling**: Graceful handling of malformed manifests and edge cases

### ✅ Advanced Features
- **Version Compatibility**: Semantic versioning validation and compatibility checks
- **Skill Metadata Validation**: Comprehensive metadata field validation
- **Integration Testing**: Complete pack/verify workflow testing
- **Test Fixtures**: Comprehensive sample skills for testing scenarios
- **CI/CD Integration**: Environment-aware testing for local and CI environments

## Architecture

### Core Components

```
src/test/
├── manifest-validator.ts      # Manifest validation utilities
├── snapshot-utils.ts          # Snapshot testing infrastructure
├── snapshot-testing.ts        # Main testing suite
└── run-snapshot-tests.ts      # Test runner script

test/
├── snapshot.spec.ts           # Jest test specifications
├── fixtures/
│   └── sample-skills/         # Test skill fixtures
└── __snapshots__/             # Generated snapshots (git-ignored)
```

### Key Classes and Functions

#### `ManifestValidator`
- `validateManifest()`: Comprehensive manifest validation
- `validatePackageHash()`: Package hash integrity verification
- `validateVersionCompatibility()`: Semantic versioning checks
- `createManifestSnapshot()`: Snapshot creation utilities

#### `SnapshotManager`
- `createSnapshot()`: Create new snapshots
- `loadSnapshot()`: Load existing snapshots
- `compareSnapshot()`: Compare manifests against snapshots
- `cleanup()`: Snapshot management and cleanup

#### `SnapshotTestSuite`
- `runTestSuite()`: Execute complete test suite
- `addTestCase()`: Add custom test cases
- `generateReport()`: Detailed test reporting

## Usage

### Basic Usage

```typescript
import { runSnapshotTests } from '../src/test/snapshot-testing.js';

// Run all snapshot tests
const result = await runSnapshotTests({
  updateSnapshots: false,
  strictMode: true,
  verbose: true
});

console.log(`Tests passed: ${result.passedTests}/${result.totalTests}`);
```

### Advanced Usage

```typescript
import { SnapshotTestSuite } from '../src/test/snapshot-testing.js';

const testSuite = new SnapshotTestSuite({
  testDir: './test/snapshot',
  snapshotsDir: './test/__snapshots__',
  strictMode: true,
  updateSnapshots: false
});

await testSuite.initialize();

// Add custom test case
testSuite.addTestCase({
  name: 'my-custom-skill',
  description: 'Test my custom skill',
  skillDir: './skills/my-skill',
  expectedManifest: {
    id: 'my-skill',
    version: '1.0.0',
    name: 'My Custom Skill'
  }
});

const result = await testSuite.runTestSuite();
console.log(testSuite.generateReport());
```

### Enhanced Packaging with Validation

```typescript
import { packSkillWithSnapshotValidation } from '../src/utils/skill-packager.js';

const result = await packSkillWithSnapshotValidation('./skills/my-skill', {
  outDir: './.registry',
  strictMode: true,
  validateDeterminism: true,
  compareWithSnapshot: './snapshots/my-skill.snapshot.json'
});

if (result.validationResult.isValid) {
  console.log('Package validation passed!');
} else {
  console.log('Validation errors:', result.validationResult.errors);
}
```

## Test Fixtures

The system includes comprehensive test fixtures in `test/fixtures/sample-skills/`:

### Valid Skills
- `basic-skill`: Minimal valid manifest
- `skill-with-scripts`: Script configuration testing
- `skill-with-tools`: Tool permissions testing
- `minimal-skill`: Edge case minimal configuration
- `complex-skill`: Full feature testing

### Invalid Skills (Error Testing)
- `malformed-skill`: Multiple validation errors
- `invalid-version`: Version format testing
- `invalid-hash`: Hash validation testing

## Configuration

### Environment Variables

- `UPDATE_SNAPSHOTS=true`: Update snapshots instead of failing tests
- `NODE_ENV=ci`: Enable strict mode for CI environments
- `VERBOSE=true`: Enable verbose output for debugging

### Test Configuration

```typescript
const config = {
  testDir: './test/snapshot',
  snapshotsDir: './test/__snapshots__',
  fixturesDir: './test/fixtures/sample-skills',
  tempDir: './.tmp/snapshot-testing',
  updateSnapshots: false,
  strictMode: true,
  verbose: false
};
```

## Validation Rules

### Manifest Structure
- ✅ Required fields: `id`, `version`, `name`, `allowed-tools`, `hash`, `createdAt`
- ✅ Optional fields: `scripts`
- ✅ Field type validation
- ✅ Field format validation

### Version Validation
- ✅ Semantic versioning format (MAJOR.MINOR.PATCH)
- ✅ Pre-release version support
- ✅ Build metadata support
- ✅ Version compatibility warnings

### Hash Validation
- ✅ SHA-256 format (64-character hex string)
- ✅ Case sensitivity (lowercase only)
- ✅ Package content integrity verification

### Timestamp Validation
- ✅ ISO 8601 format
- ✅ Reasonable timestamp ranges
- ✅ Platform-specific handling

### Script Validation
- ✅ Valid script keys: `run`, `dry-run`
- ✅ Script type validation (string)
- ✅ Script format validation

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Snapshot Tests
on: [push, pull_request]

jobs:
  snapshot-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Run snapshot tests
        run: pnpm test:snapshot
        env:
          NODE_ENV: ci
          VERBOSE: true
```

### Local Development

```bash
# Run snapshot tests
pnpm test:snapshot

# Update snapshots (when changes are expected)
UPDATE_SNAPSHOTS=true pnpm test:snapshot

# Verbose output for debugging
VERBOSE=true pnpm test:snapshot

# Run specific test file
pnpm test test/snapshot.spec.ts
```

## Error Handling

### Common Validation Errors

1. **Missing Required Fields**
   ```
   Manifest validation failed: Missing required field: id, Missing required field: version
   ```

2. **Invalid Version Format**
   ```
   Version must follow semver format (MAJOR.MINOR.PATCH)
   ```

3. **Hash Mismatch**
   ```
   Package hash mismatch. Expected abc123..., got def456...
   ```

4. **Invalid Timestamp**
   ```
   createdAt must be a valid ISO 8601 timestamp
   ```

### Debugging Tips

1. **Enable Verbose Output**: Set `VERBOSE=true` for detailed test information
2. **Update Snapshots**: Use `UPDATE_SNAPSHOTS=true` when changes are expected
3. **Check Fixtures**: Verify test fixtures are correctly structured
4. **Platform Differences**: Be aware of platform-specific behavior differences

## Performance Considerations

- **Snapshot Size**: Snapshots are stored as JSON and should be kept reasonable
- **Determinism Testing**: Can be disabled for faster test runs
- **Parallel Testing**: Tests can be run in parallel for improved performance
- **Cleanup**: Automatic cleanup of temporary files and directories

## Best Practices

### Snapshot Management
- ✅ Commit snapshots to version control
- ✅ Review snapshot changes carefully
- ✅ Update snapshots only when necessary
- ✅ Use descriptive snapshot names

### Test Development
- ✅ Create comprehensive test fixtures
- ✅ Test both valid and invalid scenarios
- ✅ Include edge cases in test coverage
- ✅ Document test purposes clearly

### CI/CD Integration
- ✅ Run tests in strict mode in CI
- ✅ Fail builds on snapshot test failures
- ✅ Provide clear error messages
- ✅ Monitor test performance

## Troubleshooting

### Common Issues

1. **Snapshot Not Found**
   - Ensure snapshot files are committed to version control
   - Check snapshot file paths and names
   - Verify snapshot directory structure

2. **Hash Mismatches**
   - Check for platform-specific differences
   - Verify package content is identical
   - Ensure deterministic packaging process

3. **Test Failures in CI**
   - Check environment differences between local and CI
   - Verify dependencies and versions match
   - Ensure proper CI configuration

### Getting Help

- Check the test output for detailed error messages
- Review the test fixtures for expected format
- Consult the Skills Fabric documentation
- Report issues to the development team

## Future Enhancements

- **Performance Optimization**: Parallel test execution
- **Enhanced Reporting**: HTML test reports
- **Custom Validators**: Pluggable validation system
- **Cross-Environment Testing**: Multi-platform matrix testing
- **Integration Monitoring**: Real-time snapshot consistency monitoring