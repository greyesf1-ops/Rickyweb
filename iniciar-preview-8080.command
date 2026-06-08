#!/bin/bash

cd "$(dirname "$0")/frontend/preview" || exit 1

echo "RickySafe Maintenance"
echo "Vista previa: http://127.0.0.1:8080/"
echo "Deja esta ventana abierta mientras haces pruebas."
echo ""

python3 -m http.server 8080 --bind 127.0.0.1
