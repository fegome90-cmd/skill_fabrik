#!/usr/bin/env python3
"""
Validador de comandos bash/shell para prevenir operaciones destructivas.
Bloquea comandos peligrosos como 'rm -rf /', 'rm -rf /*', etc.
"""

import sys
import re
from typing import List, Tuple

# Patrones destructivos bloqueados
DESTRUCTIVE_PATTERNS: List[Tuple[str, str, str]] = [
    # Comandos rm peligrosos
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]', 'block', 'rm -rf /'),
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]\*', 'block', 'rm -rf /*'),
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]home', 'block', 'rm -rf /home'),
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]etc', 'block', 'rm -rf /etc'),
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]usr', 'block', 'rm -rf /usr'),
    (r'\brm\s+(-rf|-r|-f)\s+[/\\]var', 'block', 'rm -rf /var'),
    
    # Comandos format/disk destructivos
    (r'\bdd\s+if=/dev/zero', 'block', 'dd if=/dev/zero (disk wipe)'),
    (r'\bmkfs\s+(\.|/dev/)', 'block', 'mkfs (format disk)'),
    (r'\bformat\s+[A-Z]:', 'block', 'format drive (Windows)'),
    
    # Modificaciones peligrosas del sistema
    (r'\bchmod\s+\d+\s+[/\\]', 'warn', 'chmod on system root'),
    (r'\bchown\s+\w+\s+[/\\]', 'warn', 'chown on system root'),
    
    # Comandos de red peligrosos
    (r'\biptables\s+-F', 'warn', 'iptables -F (flush all rules)'),
    (r'\broute\s+del\s+default', 'warn', 'route del default'),
    
    # Otros comandos peligrosos
    (r'^\s*\>\s+[/\\]', 'block', 'output redirection to root'),
    (r'^\s*:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;', 'block', 'fork bomb'),
]

def validate_command(command: str) -> Tuple[bool, str, str]:
    """
    Valida un comando contra patrones destructivos.
    
    Returns:
        (is_safe, level, message) - is_safe=True si el comando es seguro
    """
    command = command.strip()
    
    # Ignorar comentarios y líneas vacías
    if not command or command.startswith('#'):
        return (True, 'safe', 'Empty or comment')
    
    for pattern, level, description in DESTRUCTIVE_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return (False, level, f'Dangerous command detected: {description}')
    
    return (True, 'safe', 'Command appears safe')


def main():
    """Función principal: lee desde stdin o archivo."""
    if len(sys.argv) > 1:
        # Validar archivo
        try:
            with open(sys.argv[1], 'r') as f:
                commands = f.readlines()
        except FileNotFoundError:
            print(f"Error: File not found: {sys.argv[1]}", file=sys.stderr)
            sys.exit(2)
    else:
        # Leer desde stdin
        commands = sys.stdin.readlines()
    
    errors = []
    warnings = []
    
    for line_num, command in enumerate(commands, start=1):
        is_safe, level, message = validate_command(command)
        
        if not is_safe:
            if level == 'block':
                errors.append(f"Line {line_num}: {message}\n  Command: {command.strip()}")
            elif level == 'warn':
                warnings.append(f"Line {line_num}: {message}\n  Command: {command.strip()}")
    
    # Mostrar warnings primero
    if warnings:
        print("⚠️  WARNINGS:", file=sys.stderr)
        for warning in warnings:
            print(f"  {warning}", file=sys.stderr)
    
    # Si hay errores (block), fallar
    if errors:
        print("🚫 BLOCKED - Dangerous commands detected:", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        sys.exit(1)
    
    # Si solo hay warnings, permitir pero alertar
    if warnings:
        print("✓ Command allowed with warnings", file=sys.stderr)
        sys.exit(0)
    
    # Todo está bien
    sys.exit(0)


if __name__ == '__main__':
    main()

