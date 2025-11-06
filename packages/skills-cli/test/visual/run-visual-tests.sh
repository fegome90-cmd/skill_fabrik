#!/bin/bash
# Visual Regression Tests Runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
TEST_DIR="$PROJECT_ROOT/packages/skills-cli/test/visual"

echo "🎨 Running Visual Regression Tests..."

# Test type argument
TEST_TYPE=${1:-"all"}

# Configuration
UPDATE_SNAPSHOTS=${2:-false}
GENERATE_REPORT=${3:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup test environment
setup_environment() {
    print_status "Setting up test environment..."

    cd "$PROJECT_ROOT"

    # Ensure test directories exist
    mkdir -p "$TEST_DIR/snapshots"
    mkdir -p "$TEST_DIR/diffs"
    mkdir -p "$TEST_DIR/reports"

    # Set environment variables for consistent testing
    export NODE_ENV=test
    export FORCE_COLOR=1
    export NO_COLOR=
    export CI=${CI:-false}
}

# Run specific visual test suite
run_test_suite() {
    local suite=$1
    print_status "Running $suite visual tests..."

    cd "$TEST_DIR"

    case "$suite" in
        "skills")
            npx jest commands/skills-output.test.ts \
                --config=jest.config.js \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        "plan")
            npx jest commands/plan-output.test.ts \
                --config=jest.config.js \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        "kpi")
            npx jest commands/kpi-output.test.ts \
                --config=jest.config.js \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        "snapshot")
            print_status "Running snapshot management tests..."
            npx jest utils/snapshot-manager.test.ts \
                --config=jest.config.js \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        "validator")
            print_status "Running visual validator tests..."
            npx jest utils/visual-validators.test.ts \
                --config=jest.config.js \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        "all")
            print_status "Running all visual regression tests..."
            npx jest \
                --config=jest.config.js \
                --testPathPattern=visual \
                --verbose \
                --detectOpenHandles \
                --forceExit
            ;;
        *)
            print_error "Unknown test suite: $suite"
            print_status "Available suites: skills, plan, kpi, snapshot, validator, all"
            exit 1
            ;;
    esac
}

# Generate visual test report
generate_report() {
    if [ "$GENERATE_REPORT" = "true" ]; then
        print_status "Generating visual regression report..."

        local report_file="$TEST_DIR/reports/visual-report-$(date +%Y%m%d-%H%M%S).md"
        local coverage_file="$TEST_DIR/reports/coverage-$(date +%Y%m%d-%H%M%S).json"

        cat > "$report_file" << EOF
# Visual Regression Test Report

**Date**: $(date)
**Environment**: $(uname -s)
**Node Version**: $(node --version)
**Test Type**: $TEST_TYPE

## Test Results

EOF

        # Add Jest results to report if available
        if [ -f "$TEST_DIR/jest-results.json" ]; then
            echo "### Test Summary" >> "$report_file"
            echo "\`\`\`json" >> "$report_file"
            cat "$TEST_DIR/jest-results.json" >> "$report_file"
            echo "\`\`\`" >> "$report_file"
            echo "" >> "$report_file"
        fi

        # Add snapshot information
        echo "### Snapshots" >> "$report_file"
        echo "- Total snapshots: $(find "$TEST_DIR/snapshots" -name "*.json" | wc -l | tr -d ' ')"
        echo "- Generated diffs: $(find "$TEST_DIR/diffs" -name "*.json" | wc -l | tr -d ' ')"
        echo "" >> "$report_file"

        # Add coverage information
        if [ -f "$coverage_file" ]; then
            echo "### Coverage Information" >> "$report_file"
            echo "See detailed coverage in: $coverage_file" >> "$report_file"
        fi

        print_success "Report generated: $report_file"
    fi
}

# Update snapshots if requested
update_snapshots() {
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        print_warning "Updating snapshots..."

        cd "$TEST_DIR"
        npx jest \
            --config=jest.config.js \
            --testPathPattern=visual \
            --updateSnapshot \
            --detectOpenHandles \
            --forceExit

        print_success "Snapshots updated successfully"
    fi
}

# Validate visual test environment
validate_environment() {
    print_status "Validating test environment..."

    # Check required dependencies
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi

    # Check if Jest is available
    if ! npm list jest &> /dev/null; then
        print_error "Jest is required but not installed"
        exit 1
    fi

    # Check test directories
    if [ ! -d "$TEST_DIR" ]; then
        print_error "Test directory not found: $TEST_DIR"
        exit 1
    fi

    print_success "Environment validation passed"
}

# Main execution
main() {
    echo "🎨 Visual Regression Test Runner"
    echo "================================="

    # Validate environment first
    validate_environment

    # Setup environment
    setup_environment

    # Update snapshots if requested
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        update_snapshots
    fi

    # Run tests
    local start_time=$(date +%s)

    if run_test_suite "$TEST_TYPE"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        print_success "All visual tests passed! (Duration: ${duration}s)"

        # Generate report
        generate_report

        exit 0
    else
        print_error "Visual tests failed!"

        # Generate report even on failure
        generate_report

        # Show diff information if available
        local diff_count=$(find "$TEST_DIR/diffs" -name "*.json" -type f | wc -l | tr -d ' ')
        if [ "$diff_count" -gt 0 ]; then
            print_warning "Found $diff_count visual differences"
            print_status "Check diffs in: $TEST_DIR/diffs"
            print_status "Run with UPDATE_SNAPSHOTS=true to update snapshots"
        fi

        exit 1
    fi
}

# Help information
show_help() {
    echo "Visual Regression Test Runner"
    echo ""
    echo "Usage: $0 [TEST_TYPE] [UPDATE_SNAPSHOTS] [GENERATE_REPORT]"
    echo ""
    echo "TEST_TYPE options:"
    echo "  skills     - Run skills command visual tests"
    echo "  plan       - Run plan command visual tests"
    echo "  kpi        - Run KPI command visual tests"
    echo "  snapshot   - Run snapshot management tests"
    echo "  validator  - Run visual validator tests"
    echo "  all        - Run all visual tests (default)"
    echo ""
    echo "UPDATE_SNAPSHOTS options:"
    echo "  true       - Update snapshots during test run"
    echo "  false      - Don't update snapshots (default)"
    echo ""
    echo "GENERATE_REPORT options:"
    echo "  true       - Generate HTML/JSON reports (default)"
    echo "  false      - Skip report generation"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all visual tests"
    echo "  $0 skills             # Run only skills tests"
    echo "  $0 all true false      # Run all tests and update snapshots"
    echo ""
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac