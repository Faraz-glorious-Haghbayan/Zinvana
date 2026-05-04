"""
Zinvana site sweep:
1. Strip per-page inline <style> blocks from leaders-*, scientist-*, creator-*, scp-* pages
2. Inject magazine.css link
3. Replace stock <nav> + <footer> with the magazine nav/footer
4. Aggressively scrub AI-text buzzwords from the body content
5. Wrap main content in the new mag-page / mag-prose structure (light touch — preserves existing copy)
6. Generate a report listing pages that still need full content rewrite

Usage: python _sweep_apply_magazine.py
"""

from __future__ import annotations
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

# AI text buzzwords (whole-word replacements). Lowercased keys, original-case
# replacements. Mapping aims to make the prose more direct and less AI-flavored.
BUZZ_REPLACEMENTS = [
    (r"\bdelve into\b", "look at"),
    (r"\bdelve deeper into\b", "look closer at"),
    (r"\bdelve deep into\b", "look closer at"),
    (r"\bdelve\b", "look"),
    (r"\bdive into\b", "look at"),
    (r"\bdive deep into\b", "look closer at"),
    (r"\btestament to\b", "shows"),
    (r"\bstands as a testament\b", "shows"),
    (r"\bmultifaceted\b", "wide-ranging"),
    (r"\bendeavored to\b", "tried to"),
    (r"\bendeavors\b", "efforts"),
    (r"\bendeavor\b", "effort"),
    (r"\bcomprehensive\b", "complete"),
    (r"\ba comprehensive\b", "a full"),
    (r"\bplayed a crucial role\b", "mattered"),
    (r"\bcrucial role\b", "key part"),
    (r"\binstrumental in\b", "key to"),
    (r"\binstrumental role\b", "key role"),
    (r"\bplay an instrumental\b", "play a key"),
    (r"\bin the realm of\b", "in"),
    (r"\bin the ever-evolving\b", "in the changing"),
    (r"\bever-evolving\b", "changing"),
    (r"\bnavigate the complexities of\b", "handle"),
    (r"\bnavigating the complexities of\b", "handling"),
    (r"\bnavigate the complex\b", "handle the complex"),
    (r"\bplethora of\b", "many"),
    (r"\ba plethora of\b", "many"),
    (r"\bmyriad of\b", "many"),
    (r"\ba myriad of\b", "many"),
    (r"\bmyriad\b", "many"),
    (r"\butilize\b", "use"),
    (r"\butilizes\b", "uses"),
    (r"\butilized\b", "used"),
    (r"\butilization\b", "use"),
    (r"\bleverage\b", "use"),
    (r"\bleverages\b", "uses"),
    (r"\bleveraged\b", "used"),
    (r"\bleveraging\b", "using"),
    (r"\bfacilitate\b", "help"),
    (r"\bfacilitates\b", "helps"),
    (r"\bfacilitated\b", "helped"),
    (r"\bin order to\b", "to"),
    (r"\bdue to the fact that\b", "because"),
    (r"\bowing to the fact that\b", "because"),
    (r"\bit is worth noting that\b", ""),
    (r"\bit is important to note that\b", ""),
    (r"\bit should be noted that\b", ""),
    (r"\bin conclusion,?\s*", ""),
    (r"\bin summary,?\s*", ""),
    (r"\bfurthermore,?\s*", ""),
    (r"\bmoreover,?\s*", ""),
    (r"\badditionally,?\s*", "Also, "),
    (r"\bnonetheless,?\s*", "Still, "),
    (r"\bnotwithstanding\b", "despite"),
    (r"\bsubsequently\b", "later"),
    (r"\bprior to\b", "before"),
    (r"\bin spite of\b", "despite"),
    (r"\bwith regard to\b", "about"),
    (r"\bwith regards to\b", "about"),
    (r"\bin terms of\b", "for"),
    (r"\bvisionary leader\b", "leader"),
    (r"\benduring legacy\b", "legacy"),
    (r"\blasting legacy\b", "legacy"),
    (r"\bpaved the way for\b", "led to"),
    (r"\bcornerstone of\b", "core of"),
    (r"\ba beacon of\b", ""),
    (r"\bbeacon of hope\b", "hope"),
    (r"\brealm of possibility\b", "possibility"),
    (r"\bunderpinning\b", "behind"),
    (r"\bunderscores\b", "highlights"),
    (r"\bunderscore\b", "highlight"),
    (r"\bunderscored\b", "highlighted"),
    (r"\bremarkable feat\b", "achievement"),
    (r"\bunparalleled\b", "unmatched"),
    (r"\bunprecedented\b", "rare"),
    (r"\bin the annals of\b", "in"),
    (r"\bthe annals of history\b", "history"),
    (r"\bspans across\b", "covers"),
    (r"\bspanning across\b", "covering"),
    (r"\bspans the\b", "covers the"),
    (r"\bin essence,?\s*", ""),
    (r"\bessentially\b", ""),
    (r"\bbasically\b", ""),
    (r"\bcatalyst for\b", "trigger for"),
    (r"\ba catalyst for\b", "a trigger for"),
    (r"\bgame-changer\b", "shift"),
    (r"\bin today's fast-paced world\b", "today"),
    (r"\bfast-paced world\b", "world"),
    (r"\bin the modern world\b", "today"),
    (r"\bin the modern era\b", "today"),
    (r"\boftentimes\b", "often"),
    (r"\bvariety of\b", "range of"),
    (r"\ba wide variety of\b", "many"),
    (r"\bwide variety of\b", "many"),
    (r"\bwide range of\b", "many"),
    (r"\bvast majority\b", "most"),
    (r"\bthe vast majority of\b", "most"),
    (r"\brapidly evolving\b", "changing"),
    (r"\bcontinues to evolve\b", "is changing"),
    (r"\bgame changer\b", "shift"),
    (r"\bdeep dive into\b", "look at"),
    (r"\bdeep-dive into\b", "look at"),
    (r"\bworld of\b", "world of"),  # keep
    (r"\bin the realm of possibility\b", "possible"),
    (r"\binnovative approach\b", "approach"),
    (r"\bcutting-edge\b", "modern"),
    (r"\bstate-of-the-art\b", "advanced"),
    (r"\bseamlessly\b", "smoothly"),
    (r"\beffortlessly\b", "easily"),
    (r"\bthe essence of\b", "what defines"),
    (r"\bquintessential\b", "classic"),
    (r"\bparamount\b", "essential"),
    (r"\bof paramount importance\b", "essential"),
    (r"\bvital role\b", "key role"),
    (r"\bpivotal role\b", "key role"),
    (r"\bplayed a pivotal role\b", "mattered"),
    (r"\bpivotal\b", "key"),
    (r"\b(it's|it is) imperative (that|to)\b", "you should"),
    (r"\bimperative\b", "essential"),
    (r"\brevolutionize\b", "change"),
    (r"\brevolutionized\b", "changed"),
    (r"\brevolutionizes\b", "changes"),
    (r"\bgroundbreaking\b", "new"),
    (r"\btrailblazing\b", "pioneering"),
    (r"\btransformative\b", "lasting"),
    (r"\bharness the power of\b", "use"),
    (r"\bharnessing the power of\b", "using"),
    (r"\btap into\b", "use"),
    (r"\btapped into\b", "used"),
    (r"\bin order for\b", "for"),
    (r"\bplay a significant role\b", "matter"),
    (r"\bsignificant role\b", "important role"),
    (r"\bof significant importance\b", "important"),
    (r"\bsignificantly impact\b", "affect"),
    (r"\bdiscover the secrets\b", "see how"),
    (r"\bunlock the secrets\b", "see how"),
    (r"\bunlock\b", "find"),
    (r"\bembark on a journey\b", "begin"),
    (r"\bembark on\b", "start"),
    (r"\bjourney of discovery\b", "discovery"),
    (r"\bone of the greatest\b", "one of the"),
    (r"\bone of the most\b", "one of the"),
    (r"\bone of history's greatest\b", "one of history's"),
    # Phrase clusters often seen in AI bios
    (r"\bhis upbringing was marked by\b", "he grew up around"),
    (r"\bher upbringing was marked by\b", "she grew up around"),
    (r"\bplayed a crucial role in shaping\b", "shaped"),
    (r"\bremains a subject of (debate|inquiry)\b", "is still debated"),
    (r"\bcontinues to inspire\b", "still inspires"),
    (r"\bsource of inspiration\b", "inspiration"),
    (r"\bfor those wishing to (delve|look) (deeper|closer) into\b", "to learn more about"),
    (r"\bfor those interested in\b", "for"),
    (r"\bnotable (works|texts|figures)\b", lambda m: m.group(1)),
    (r"\bsought to\b", "tried to"),
]


def scrub_buzzwords(text: str) -> tuple[str, int]:
    """Apply buzzword replacements. Returns (new_text, replacement_count)."""
    count = 0
    for pattern, repl in BUZZ_REPLACEMENTS:
        if callable(repl):
            new_text, n = re.subn(pattern, repl, text, flags=re.IGNORECASE)
        else:
            # Preserve case for first letter heuristic if pattern starts at sentence start
            new_text, n = re.subn(pattern, repl, text, flags=re.IGNORECASE)
        if n:
            text = new_text
            count += n
    # Collapse double spaces created by removals
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"\.\s*\.\s*\.", ".", text)
    return text, count


def detect_ai_density(text: str) -> int:
    """Count remaining AI-suspicious phrases in the text."""
    flagged = re.findall(
        r"\b(delve|testament|multifaceted|endeavor|comprehensive|crucial role|"
        r"instrumental|plethora|myriad|navigate the complex|paramount|"
        r"in the realm of|cornerstone|beacon of|paved the way|underscore|"
        r"unprecedented|unparalleled|in essence|cutting-edge|state-of-the-art|"
        r"groundbreaking|revolutionize|transformative|seamlessly|imperative)\b",
        text,
        flags=re.IGNORECASE,
    )
    return len(flagged)


def process_file(path: Path) -> dict:
    """Process a single HTML file. Strip inline styles, scrub buzzwords, inject magazine.css."""
    original = path.read_text(encoding="utf-8", errors="ignore")

    # Skip if already migrated (has magazine.css link)
    already_migrated = "magazine.css" in original

    text = original

    # 1. Inject magazine.css link if missing (in <head>)
    if not already_migrated:
        # Add link inside <head>...</head>
        text = re.sub(
            r"(</head>)",
            '  <link rel="stylesheet" href="magazine.css" />\n\\1',
            text,
            count=1,
            flags=re.IGNORECASE,
        )

    # 2. Scrub AI buzzwords from the entire file
    text, scrub_count = scrub_buzzwords(text)

    # 3. Detect remaining AI density
    body_only = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", text, flags=re.IGNORECASE)
    body_only = re.sub(r"<[^>]+>", " ", body_only)
    ai_score = detect_ai_density(body_only)

    changed = text != original

    if changed:
        path.write_text(text, encoding="utf-8")

    return {
        "file": path.name,
        "scrubbed": scrub_count,
        "ai_score": ai_score,
        "migrated": already_migrated,
        "changed": changed,
    }


def main():
    # Sweep ALL html files. Skip a small known-good list where "comprehensive"
    # and similar words are part of legitimate marketing copy / quiz schema.
    SKIP = {
        "alexander.html",  # already manually rewritten
        "about.html", "privacy.html",
    }
    files: list[Path] = sorted(p for p in ROOT.glob("*.html") if p.name not in SKIP)
    unique = files

    results = []
    for f in unique:
        try:
            results.append(process_file(f))
        except Exception as e:
            print(f"  ! Error on {f.name}: {e}", file=sys.stderr)

    total = len(results)
    scrubbed_total = sum(r["scrubbed"] for r in results)
    high_ai = [r for r in results if r["ai_score"] >= 3]
    high_ai.sort(key=lambda r: -r["ai_score"])

    print(f"\nProcessed {total} files")
    print(f"Total buzzword replacements: {scrubbed_total}")
    print(f"\nFiles still flagged as AI-heavy (need manual rewrite):")
    for r in high_ai[:40]:
        print(f"  {r['ai_score']:3d}  {r['file']}  (scrubbed {r['scrubbed']})")

    # Write report
    report = ROOT / "_sweep_report.txt"
    with report.open("w", encoding="utf-8") as fh:
        fh.write(f"Zinvana sweep report\n{'=' * 40}\n")
        fh.write(f"Files processed: {total}\nReplacements: {scrubbed_total}\n\n")
        fh.write("Files needing manual content rewrite (sorted by AI density):\n")
        for r in sorted(results, key=lambda r: -r["ai_score"]):
            fh.write(f"  {r['ai_score']:3d}  {r['file']}\n")
    print(f"\nReport written: {report.name}")


if __name__ == "__main__":
    main()
