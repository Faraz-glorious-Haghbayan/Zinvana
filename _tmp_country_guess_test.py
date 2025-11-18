countries = [
    {"name": "Canada", "continent": "americas", "subregion": "north", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": True, "monarchy": True, "landlocked": False, "populationOver100M": False, "southernHemisphere": False, "commonwealth": True},
    {"name": "United States", "continent": "americas", "subregion": "north", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": False},
    {"name": "Mexico", "continent": "americas", "subregion": "north", "isIsland": False, "speaksSpanish": True, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": False},
    {"name": "Brazil", "continent": "americas", "subregion": "south", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": True, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": True, "commonwealth": False},
    {"name": "Argentina", "continent": "americas", "subregion": "south", "isIsland": False, "speaksSpanish": True, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": False, "southernHemisphere": True, "commonwealth": False},
    {"name": "United Kingdom", "continent": "europe", "subregion": "western", "isIsland": True, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": False, "monarchy": True, "landlocked": False, "populationOver100M": False, "southernHemisphere": False, "commonwealth": True},
    {"name": "France", "continent": "europe", "subregion": "western", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": True, "monarchy": False, "landlocked": False, "populationOver100M": False, "southernHemisphere": False, "commonwealth": False},
    {"name": "Germany", "continent": "europe", "subregion": "central", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": False, "southernHemisphere": False, "commonwealth": False},
    {"name": "Egypt", "continent": "africa", "subregion": "north", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": False},
    {"name": "South Africa", "continent": "africa", "subregion": "south", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": False, "southernHemisphere": True, "commonwealth": True},
    {"name": "India", "continent": "asia", "subregion": "south", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": True, "isPeninsula": True},
    {"name": "China", "continent": "asia", "subregion": "east", "isIsland": False, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": False, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": False},
    {"name": "Japan", "continent": "asia", "subregion": "east", "isIsland": True, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": False, "speaksFrench": False, "monarchy": True, "landlocked": False, "populationOver100M": True, "southernHemisphere": False, "commonwealth": False},
    {"name": "Australia", "continent": "oceania", "subregion": "australasia", "isIsland": True, "speaksSpanish": False, "speaksPortuguese": False, "speaksEnglish": True, "speaksFrench": False, "monarchy": True, "landlocked": False, "populationOver100M": False, "southernHemisphere": True, "commonwealth": True}
]

questions = [
    {"id": "americas", "fn": lambda c: c["continent"] == "americas"},
    {"id": "europe", "fn": lambda c: c["continent"] == "europe"},
    {"id": "asia", "fn": lambda c: c["continent"] == "asia"},
    {"id": "africa", "fn": lambda c: c["continent"] == "africa"},
    {"id": "oceania", "fn": lambda c: c["continent"] == "oceania"},
    {"id": "southern", "fn": lambda c: bool(c.get("southernHemisphere"))},
    {"id": "island", "fn": lambda c: bool(c.get("isIsland"))},
    {"id": "monarchy", "fn": lambda c: bool(c.get("monarchy"))},
    {"id": "spanish", "fn": lambda c: bool(c.get("speaksSpanish"))},
    {"id": "english", "fn": lambda c: bool(c.get("speaksEnglish"))},
    {"id": "portuguese", "fn": lambda c: bool(c.get("speaksPortuguese"))},
    {"id": "french", "fn": lambda c: bool(c.get("speaksFrench"))},
    {"id": "pop100", "fn": lambda c: bool(c.get("populationOver100M"))},
    {"id": "commonwealth", "fn": lambda c: bool(c.get("commonwealth"))},
    {"id": "subregion-south", "fn": lambda c: c["subregion"] == "south"},
    {"id": "subregion-north", "fn": lambda c: c["subregion"] == "north"},
    {"id": "subregion-west", "fn": lambda c: c["subregion"] == "western"},
    {"id": "peninsula", "fn": lambda c: bool(c.get("isPeninsula"))}
]


def pick_next_question(remaining, asked):
    candidates = []
    for q in questions:
        if q["id"] in asked:
            continue
        yes_count = sum(1 for c in remaining if q["fn"](c))
        no_count = len(remaining) - yes_count
        if yes_count > 0 and no_count > 0:
            candidates.append((abs(yes_count - no_count), q))
    if candidates:
        candidates.sort(key=lambda item: item[0])
        return candidates[0][1]
    if remaining:
        fallback = remaining[0]["name"]
        return {"id": f"guess-{fallback}", "fn": lambda c, target=fallback: c["name"] == target}
    return None


def simulate(target_name):
    target = next((c for c in countries if c["name"] == target_name), None)
    if not target:
        return False
    remaining = countries[:]
    asked = set()
    guard = 0
    while True:
        if not remaining:
            return False
        if len(remaining) == 1:
            return remaining[0]["name"] == target_name
        question = pick_next_question(remaining, asked)
        if not question:
            return False
        answer = bool(question["fn"](target))
        remaining = [c for c in remaining if bool(question["fn"](c)) == answer]
        asked.add(question["id"])
        guard += 1
        if guard > 50:
            return False


def main():
    failures = [c["name"] for c in countries if not simulate(c["name"])]
    if failures:
        raise SystemExit(f"Simulation failed for: {', '.join(failures)}")
    print(f"Simulation passed for {len(countries)} countries.")


if __name__ == "__main__":
    main()
