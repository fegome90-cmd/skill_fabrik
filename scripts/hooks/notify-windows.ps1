# Notificación para Windows usando PowerShell

param(
    [Parameter(Position=0)]
    [ValidateSet("info", "success", "warning", "error")]
    [string]$Type = "info",
    
    [Parameter(Position=1)]
    [string]$Message = "Notification"
)

# Determinar título y sonido según tipo
switch ($Type) {
    "success" {
        $Title = "✓ Success"
        $Sound = "SystemDefault"
    }
    "warning" {
        $Title = "⚠ Warning"
        $Sound = "SystemExclamation"
    }
    "error" {
        $Title = "✗ Error"
        $Sound = "SystemHand"
    }
    default {
        $Title = "ℹ Info"
        $Sound = "SystemAsterisk"
    }
}

# Crear notificación usando .NET Windows Forms
Add-Type -AssemblyName System.Windows.Forms
$global:balloon = New-Object System.Windows.Forms.NotifyIcon
$balloon.Icon = [System.Drawing.SystemIcons]::Information
$balloon.BalloonTipIcon = "Info"
$balloon.BalloonTipText = $Message
$balloon.BalloonTipTitle = $Title
$balloon.Visible = $True
$balloon.ShowBalloonTip(5000)

# Reproducir sonido del sistema
[console]::beep(800, 200)

# Log para debugging
$logPath = "$env:TEMP\skills-fabrik-notifications.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] $Type: $Message"

# Limpiar después de 5 segundos
Start-Sleep -Seconds 5
$balloon.Dispose()

