import json
import os

ROOT = os.path.dirname(__file__)
PAGES_JSON = os.path.join(ROOT, "all-pages.json")

with open(PAGES_JSON, "r", encoding="utf-8-sig") as f:
    pages = json.load(f)

eligible = [v for v in pages if isinstance(v, str) and v.lower().endswith(".html")]


def is_draft_like(filename: str) -> bool:
    s = str(filename).lower()
    return (
        s.startswith("_tmp_")
        or "backup" in s
        or "broken" in s
        or "old" in s
        or "fixed" in s
        or s.startswith("test")
        or "test_" in s
    )


forced_quiz = {
    "dream-meaning.html",
    "mental-health.html",
    "perfect-country.html",
    "political-ideology.html",
    "religion.html",
}


def is_quiz_like(filename: str) -> bool:
    s = str(filename).lower()
    return (
        s in forced_quiz
        or "quiz" in s
        or s.startswith("quizzes/")
        or s in {"geo-zini.html", "geo-zini", "geozini.html"}
    )


featured = [
    "leaders.html",
    "mbti-personality-quiz.html",
    "quiz.html",
    "quiz-directory.html",
    "quiz-gallery.html",
    "quiz-builder.html",
    "behold-the-dreamers-quiz.html",
]

forced_footballers = {
    "casemiro.html",
    "ronaldinho.html",
    "neymarjr.html",
    "rodri.html",
    "pedri.html",
    "xavi.html",
    "trent_alexander_arnold.html",
}

excluded_footballers = {
    "history.html",
    "influencial_leaders.html",
    "gorbachev_reforms.html",
    "sun_tzu.html",
}

used: set[str] = set()


def take(pred):
    picked = []
    for f in eligible:
        key = str(f).lower()
        if key in used:
            continue
        if not pred(f):
            continue
        used.add(key)
        picked.append(f)
    return picked


# Same sequence as all-articles.html up to footballers

take(is_draft_like)

featured_quizzes = [
    f for f in featured if any(str(e).lower() == str(f).lower() for e in eligible)
]
for f in featured_quizzes:
    used.add(str(f).lower())

take(lambda f: is_quiz_like(f) and f not in featured_quizzes)

take(lambda f: str(f).lower().startswith("mbti-"))

take(
    lambda f: str(f).lower().startswith("creator-")
    or str(f).lower() == "creator-profile.html"
    or "youtuber" in str(f).lower()
)

take(lambda f: "einstein" in str(f).lower() or "scientist" in str(f).lower())

footballers = take(
    lambda f: (str(f).lower() not in excluded_footballers)
    and (
        (str(f).lower() in forced_footballers)
        or (
            str(f).lower().endswith(".html")
            and ("_" in str(f))
            and not str(f).lower().startswith("_")
        )
    )
)

print("footballers_count", len(footballers))

keywords = [
    "squid",
    "wojak",
    "mbti",
    "leader",
    "brawler",
    "quiz",
    "admin",
    "about",
    "privacy",
    "community",
    "feed",
    "history",
]

suspicious = [f for f in footballers if any(k in f.lower() for k in keywords)]
print("suspicious_count", len(suspicious))
for f in suspicious:
    print(" -", f)

# Print first 60 for easy manual review
print("\nfirst_60_footballers")
for f in footballers[:60]:
    print(" -", f)
