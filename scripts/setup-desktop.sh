#!/usr/bin/env bash
set -euo pipefail
# Run inside Ubuntu/Debian (inside WSL Ubuntu on Windows). Chrome is installed
# from its official vendor, into Linux only; no operator desktop is captured.
if [ "$(id -u)" -ne 0 ]; then exec sudo bash "$0"; fi
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  xvfb openbox tint2 x11-utils x11-xserver-utils xdotool python3-pil \
  fonts-liberation ca-certificates wget
if ! command -v google-chrome >/dev/null; then
  package=$(mktemp /tmp/specimen-chrome-XXXXXX.deb)
  trap 'rm -f -- "$package"' EXIT
  wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O "$package"
  apt-get install -y "$package"
fi
printf 'Specimen desktop dependencies are ready.\n'
