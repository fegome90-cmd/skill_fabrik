#!/bin/bash
# Wrapper cross-platform para notificaciones

TYPE="${1:-info}"
MESSAGE="${2:-Notification}"

# Detectar sistema operativo
case "$(uname -s)" in
  Darwin*)
    # macOS
    "$(dirname "$0")/notify-macos.sh" "$TYPE" "$MESSAGE"
    ;;
  Linux*)
    # Linux
    "$(dirname "$0")/notify-linux.sh" "$TYPE" "$MESSAGE"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # Windows (Git Bash / MSYS)
    powershell.exe -File "$(dirname "$0")/notify-windows.ps1" -Type "$TYPE" -Message "$MESSAGE"
    ;;
  *)
    # Fallback: solo echo
    echo "[$TYPE] $MESSAGE"
    ;;
esac

