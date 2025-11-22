"""One-off helper to rewrite legacy -q&a.html references."""

from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PATTERN = re.compile(r"([A-Za-z0-9-]+)-q&a\.html")
EXTS = {".html", ".htm", ".xml", ".css", ".js", ".txt", ".md"}

def rewrite_links() -> None:
    patched = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTS:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        new_text = PATTERN.sub(lambda match: f"leaders-{match.group(1)}.html", text)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            print(f"Updated {path.relative_to(ROOT)}")
            patched += 1
    print(f"Patched {patched} files.")


if __name__ == "__main__":
    rewrite_links()
