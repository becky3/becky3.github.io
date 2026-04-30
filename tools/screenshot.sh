#!/usr/bin/env bash
# 汎用 headless Chrome スクリーンショット撮影スクリプト。
# 既知のハマりポイント（絶対パス・URL hash・virtual-time-budget・実行ファイル解決）を
# デフォルトで解消する。
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: tools/screenshot.sh [options] URL [URL ...]

Options:
  -o, --output-dir DIR           Output directory (default: .tmp/screenshots)
  -n, --name NAME                Filename for single URL mode (without extension)
                                 Allowed characters: [A-Za-z0-9._-]
      --names NAME1,NAME2,...    Per-URL filename suffixes for batch mode
                                 (count must match URL count, must be unique,
                                  same character set as --name)
  -w, --viewport WIDTHxHEIGHT    Viewport size (default: 1280x800)
  -t, --virtual-time-budget MS   virtual-time-budget in ms (default: 4000)
      --no-sandbox               Pass --no-sandbox to Chrome (Linux/CI only)
      --chrome PATH              Override Chrome executable path
                                 (env: CHROME also honored)
  -h, --help                     Show this help

Behavior:
  Batch mode is fail-fast: aborts on the first screenshot failure.
  Already-captured files in the same run are kept on disk.

Filename rules:
  Single URL, no --name:        <timestamp>.png
  Single URL, --name NAME:      NAME.png
  Multiple URLs, no --names:    <timestamp>_<index>.png   (1-origin index)
  Multiple URLs, --names X,Y:   <timestamp>_X.png / <timestamp>_Y.png

  timestamp format: yyyyMMdd_HHmmss

Examples:
  # Single shot to .tmp/screenshots/<timestamp>.png
  tools/screenshot.sh https://example.com

  # Single shot with custom name
  tools/screenshot.sh --name homepage https://example.com

  # Batch shot (6 time bands)
  tools/screenshot.sh \
    --names early-morning,forenoon,afternoon,evening,night,late-night \
    "https://becky3.github.io/?band=early-morning" \
    "https://becky3.github.io/?band=forenoon" \
    "https://becky3.github.io/?band=afternoon" \
    "https://becky3.github.io/?band=evening" \
    "https://becky3.github.io/?band=night" \
    "https://becky3.github.io/?band=late-night"
EOF
}

detect_chrome() {
  if [ -n "${CHROME:-}" ] && [ -x "$CHROME" ]; then
    echo "$CHROME"
    return
  fi
  for cmd in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$cmd" >/dev/null 2>&1; then
      command -v "$cmd"
      return
    fi
  done
  for path in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if [ -x "$path" ]; then
      echo "$path"
      return
    fi
  done
  echo ""
}

to_native_path() {
  local p="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$p"
  else
    echo "$p"
  fi
}

OUTPUT_DIR=".tmp/screenshots"
NAME=""
NAMES=""
VIEWPORT="1280x800"
VTB="4000"
CHROME_PATH=""
NO_SANDBOX=0
URLS=()

NAME_PATTERN='^[A-Za-z0-9._-]+$'

while [ $# -gt 0 ]; do
  case "$1" in
    -o|--output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    -n|--name) NAME="$2"; shift 2 ;;
    --names) NAMES="$2"; shift 2 ;;
    -w|--viewport) VIEWPORT="$2"; shift 2 ;;
    -t|--virtual-time-budget) VTB="$2"; shift 2 ;;
    --no-sandbox) NO_SANDBOX=1; shift ;;
    --chrome) CHROME_PATH="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; while [ $# -gt 0 ]; do URLS+=("$1"); shift; done ;;
    -*) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) URLS+=("$1"); shift ;;
  esac
done

if [ ${#URLS[@]} -eq 0 ]; then
  echo "ERROR: at least one URL is required" >&2
  usage >&2
  exit 2
fi

if ! [[ "$VIEWPORT" =~ ^[0-9]+x[0-9]+$ ]]; then
  echo "ERROR: --viewport must be WIDTHxHEIGHT (e.g. 1280x800)" >&2
  exit 2
fi
WIDTH="${VIEWPORT%x*}"
HEIGHT="${VIEWPORT#*x}"

if ! [[ "$VTB" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --virtual-time-budget must be a non-negative integer" >&2
  exit 2
fi

if [ ${#URLS[@]} -gt 1 ] && [ -n "$NAME" ]; then
  echo "ERROR: --name is for single URL mode. Use --names for multiple URLs." >&2
  exit 2
fi

if [ -n "$NAME" ] && ! [[ "$NAME" =~ $NAME_PATTERN ]]; then
  echo "ERROR: --name contains invalid characters: '$NAME' (allowed: [A-Za-z0-9._-])" >&2
  exit 2
fi

NAMES_ARR=()
if [ -n "$NAMES" ]; then
  IFS=',' read -ra NAMES_ARR <<< "$NAMES"
  if [ ${#URLS[@]} -ne ${#NAMES_ARR[@]} ]; then
    echo "ERROR: --names count (${#NAMES_ARR[@]}) does not match URL count (${#URLS[@]})" >&2
    exit 2
  fi
  for n in "${NAMES_ARR[@]}"; do
    if ! [[ "$n" =~ $NAME_PATTERN ]]; then
      echo "ERROR: --names entry contains invalid characters: '$n' (allowed: [A-Za-z0-9._-])" >&2
      exit 2
    fi
  done
  if [ "$(printf '%s\n' "${NAMES_ARR[@]}" | sort -u | wc -l)" -ne "${#NAMES_ARR[@]}" ]; then
    echo "ERROR: --names entries must be unique (would overwrite output files)" >&2
    exit 2
  fi
fi

if [ -z "$CHROME_PATH" ]; then
  CHROME_PATH="$(detect_chrome)"
fi
if [ -z "$CHROME_PATH" ]; then
  echo "ERROR: Chrome not found. Set CHROME env var or pass --chrome PATH." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR_ABS="$(cd "$OUTPUT_DIR" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

shoot() {
  local url="$1" filename="$2"
  local out_path="$OUTPUT_DIR_ABS/$filename"
  local out_native
  out_native="$(to_native_path "$out_path")"
  echo "[shoot] $url -> $out_path"
  local -a chrome_args=(
    --headless=new
    --disable-gpu
    --hide-scrollbars
    --virtual-time-budget="$VTB"
    --window-size="$WIDTH,$HEIGHT"
    --screenshot="$out_native"
  )
  if [ "$NO_SANDBOX" = "1" ]; then
    chrome_args+=(--no-sandbox)
  fi
  "$CHROME_PATH" "${chrome_args[@]}" "$url" >/dev/null
  if [ ! -f "$out_path" ]; then
    echo "ERROR: screenshot file was not created: $out_path" >&2
    return 1
  fi
}

if [ ${#URLS[@]} -eq 1 ]; then
  filename="${NAME:-$TIMESTAMP}.png"
  shoot "${URLS[0]}" "$filename"
else
  for i in "${!URLS[@]}"; do
    if [ -n "$NAMES" ]; then
      suffix="${NAMES_ARR[$i]}"
    else
      suffix="$((i + 1))"
    fi
    filename="${TIMESTAMP}_${suffix}.png"
    shoot "${URLS[$i]}" "$filename"
  done
fi

echo "Done. Output: $OUTPUT_DIR_ABS"
