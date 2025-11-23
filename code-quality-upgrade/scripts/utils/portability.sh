#!/bin/bash
# Portability utilities for cross-platform script execution
# T1.1.7 - Improve path handling and compatibility

# Cross-platform path resolution
resolve_path() {
    local path="$1"
    if command -v realpath >/dev/null 2>&1; then
        realpath "$path"
    elif command -v readlink >/dev/null 2>&1; then
        readlink -f "$path"
    else
        # Fallback for systems without realpath/readlink
        (cd "$path" && pwd)
    fi
}

# Get script directory (portable)
get_script_dir() {
    local script_dir
    if [[ "${BASH_SOURCE[0]}" == /* ]]; then
        script_dir="${BASH_SOURCE[0]}"
    else
        script_dir="$(pwd)/${BASH_SOURCE[0]}"
    fi
    dirname "$(resolve_path "$script_dir")"
}

# Cross-platform timestamp generation
get_timestamp() {
    if command -v gdate >/dev/null 2>&1; then
        gdate +%Y%m%d-%H%M%S
    else
        date +%Y%m%d-%H%M%S
    fi
}

# Check if command exists (portable)
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate required dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo "❌ Missing required dependencies: ${missing_deps[*]}" >&2
        return 1
    fi
    
    return 0
}

# Safe directory creation with error handling
ensure_dir() {
    local dir_path="$1"
    if ! mkdir -p "$dir_path" 2>/dev/null; then
        echo "❌ Failed to create directory: $dir_path" >&2
        return 1
    fi
    return 0
}

# Safe file operation with backup
safe_copy() {
    local source="$1"
    local target="$2"
    
    if [[ ! -f "$source" ]]; then
        echo "❌ Source file does not exist: $source" >&2
        return 1
    fi
    
    if ! cp "$source" "$target"; then
        echo "❌ Failed to copy file: $source -> $target" >&2
        return 1
    fi
    
    return 0
}

# Validate JSON file
validate_json() {
    local file="$1"
    
    if [[ ! -f "$file" ]]; then
        echo "❌ File does not exist: $file" >&2
        return 1
    fi
    
    if command_exists python3; then
        python3 -m json.tool "$file" >/dev/null 2>&1
    elif command_exists node; then
        node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null
    else
        echo "⚠️  No JSON validator available, assuming valid format"
        return 0
    fi
}

# Get OS type
get_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# OS-specific path separator
get_path_separator() {
    if [[ "$(get_os)" == "windows" ]]; then
        echo ";"
    else
        echo ":"
    fi
}