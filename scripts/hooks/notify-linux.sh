#!/bin/bash
# Notificación para Linux usando notify-send (requiere libnotify)

TYPE="${1:-info}"  # info, success, warning, error
MESSAGE="${2:-Notification}"

# Verificar si notify-send está disponible
if ! command -v notify-send &> /dev/null; then
  echo "⚠ notify-send not found. Install: sudo apt-get install libnotify-bin"
  exit 0
fi

# Determinar ícono y urgencia según tipo
case "$TYPE" in
  success)
    ICON="dialog-information"
    URGENCY="normal"
    SUMMARY="✓ Success"
    ;;
  warning)
    ICON="dialog-warning"
    URGENCY="normal"
    SUMMARY="⚠ Warning"
    ;;
  error)
    ICON="dialog-error"
    URGENCY="critical"
    SUMMARY="✗ Error"
    ;;
  *)
    ICON="dialog-information"
    URGENCY="low"
    SUMMARY="ℹ Info"
    ;;
esac

# Reproducir sonido del sistema (si está disponible)
if command -v paplay &> /dev/null; then
  case "$TYPE" in
    error)
      paplay /usr/share/sounds/freedesktop/stereo/dialog-error.oga 2>/dev/null &
      ;;
    warning)
      paplay /usr/share/sounds/freedesktop/stereo/dialog-warning.oga 2>/dev/null &
      ;;
    *)
      paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null &
      ;;
  esac
fi

# Notificación visual
notify-send --urgency="$URGENCY" --icon="$ICON" "$SUMMARY" "$MESSAGE"

# Log para debugging
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $TYPE: $MESSAGE" >> /tmp/skills-fabrik-notifications.log

