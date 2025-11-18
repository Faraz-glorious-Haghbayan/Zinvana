import json
import pathlib
import urllib.request

URL = "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json"
OUTPUT = pathlib.Path("data/world-countries.json")

print("Downloading country dataset...")
with urllib.request.urlopen(URL) as response:
    raw = json.load(response)

print(f"Fetched {len(raw)} records.")

countries = []
for entry in raw:
    name = entry.get("name", {}).get("common")
    cca3 = entry.get("cca3")
    region = entry.get("region")
    subregion = entry.get("subregion")
    population = entry.get("population")
    landlocked = entry.get("landlocked")
    borders = entry.get("borders") or []
    languages_obj = entry.get("languages") or {}
    languages = sorted({value for value in languages_obj.values() if value})
    latlng = entry.get("latlng") or []
    capital_list = entry.get("capital") or []
    capital = capital_list[0] if capital_list else None
    continents = entry.get("continents") or []
    area = entry.get("area")
    independent = entry.get("independent")
    un_member = entry.get("unMember")

    if not name or not cca3:
        continue

    countries.append(
        {
            "name": name,
            "cca3": cca3,
            "region": region or None,
            "subregion": subregion or None,
            "population": population or None,
            "landlocked": landlocked,
            "borders": borders,
            "languages": languages,
            "latlng": latlng,
            "capital": capital,
            "continents": continents,
            "area": area,
            "independent": independent,
            "unMember": un_member,
        }
    )

countries.sort(key=lambda c: c["name"])

OUTPUT.write_text(json.dumps(countries, ensure_ascii=True), encoding="utf-8")
print(f"Saved {len(countries)} simplified records to {OUTPUT}")
