#!/bin/bash
# Notificación para macOS usando osascript (AppleScript)

TYPE="${1:-info}"  # info, success, warning, error
MESSAGE="${2:-Notification}"

# Determinar sonido y título según tipo
case "$TYPE" in
  success)
    TITLE="✓ Success"
    SOUND="Glass"
    ;;
  warning)
    TITLE="⚠ Warning"
    SOUND="Basso"
    ;;
  error)
    TITLE="✗ Error"
    SOUND="Funk"
    ;;
  *)
    TITLE="ℹ Info"
    SOUND="Ping"
    ;;
esac

# Notificación visual + sonido
osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"$SOUND\""

# Log para debugging
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $TYPE: $MESSAGE" >> /tmp/skills-fabrik-notifications.log

