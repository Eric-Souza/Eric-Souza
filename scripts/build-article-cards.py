"""Builds assets/article-NN.svg cards from the portfolio's article list, in the project cards' style.

Usage: python scripts/build-article-cards.py [path/to/portfolio/src/data/articles.ts]
"""

import re
import sys
from html import escape
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "portfolio" / "src" / "data" / "articles.ts"

SANS_CH = 0.53  # conservative average sans advance, in em (same as build-assets.mjs)
BOLD_CH = 0.58
WIDTH = 808  # text area: 880 card minus 36 px padding on each side

HEAD = """<svg xmlns="http://www.w3.org/2000/svg" width="880" height="{h}" viewBox="0 0 880 {h}">
<style>
  .sans {{ font-family: -apple-system, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif; }}
  .mono {{ font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace; }}
</style>
<defs>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#58A6FF"/>
    <stop offset="1" stop-color="#BC8CFF"/>
  </linearGradient>
</defs>
"""


def field(block: str, name: str) -> str:
    # Values are single- or double-quoted strings, sometimes on the line after the key
    match = re.search(rf"""{name}:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")""", block)
    return (match.group(1) or match.group(2) or "").replace("\\'", "'") if match else ""


def load_articles() -> list[dict]:
    text = SOURCE.read_text(encoding="utf-8")
    blocks = re.findall(r"\{\s*id:.*?\n\s*\}", text, re.S)
    return [{k: field(b, k) for k in ("title", "publication", "date", "url", "teaser")} for b in blocks]


def wrap(text: str, size: float, ch: float) -> list[str]:
    limit = int(WIDTH / (size * ch))
    lines, line = [], ""
    for word in text.split():
        if line and len(line) + 1 + len(word) > limit:
            lines.append(line)
            line = word
        else:
            line = f"{line} {word}".strip()
    return lines + [line]


def card(n: int, a: dict) -> str:
    title = wrap(a["title"], 19, BOLD_CH)
    teaser = wrap(a["teaser"], 15, SANS_CH)
    y = 78
    parts = []
    for line in title:
        parts.append(f'<text x="36" y="{y}" class="sans" font-size="19" font-weight="700" fill="#E6EDF3">{escape(line)}</text>')
        y += 26
    y += 4
    for line in teaser:
        parts.append(f'<text x="36" y="{y}" class="sans" font-size="15" fill="#C9D1D9">{escape(line)}</text>')
        y += 23
    h = y + 8
    host = urlparse(a["url"]).netloc
    return (
        HEAD.format(h=h)
        + f'<rect x="0.5" y="0.5" width="879" height="{h - 1}" rx="14" fill="#161B22" stroke="#30363D"/>'
        + f'<rect x="1" y="24" width="3" height="{h - 48}" rx="1.5" fill="url(#accent)"/>'
        + f'<text x="36" y="42" class="mono" font-size="12" fill="#7EE787">{n:02d}'
        + f'<tspan fill="#8B949E" dx="10">// {escape(a["publication"])} · {escape(a["date"])}</tspan></text>'
        + f'<text x="844" y="42" class="mono" font-size="12" fill="#8B949E" text-anchor="end">{escape(host)} <tspan fill="#58A6FF">↗</tspan></text>'
        + "".join(parts)
        + "\n</svg>\n"
    )


def main() -> None:
    articles = load_articles()
    assert articles and all(a["title"] and a["url"] for a in articles), "couldn't parse articles.ts"
    for old in (ROOT / "assets").glob("article-*.svg"):
        old.unlink()
    for n, a in enumerate(articles, 1):
        (ROOT / "assets" / f"article-{n:02d}.svg").write_text(card(n, a), encoding="utf-8", newline="\n")
    print(f"{len(articles)} cards")


if __name__ == "__main__":
    main()
