import pathlib, re

p = pathlib.Path(r"c:\Zinvana\perfect-country.html")
text = p.read_text(encoding="utf-8")

start = text.find("const countries = {")
end = text.find("const scoringRules = {", start)
if start == -1 or end == -1:
    raise SystemExit("Could not locate countries/scoringRules blocks")

countries_block = text[start:end]
country_keys = set(re.findall(r"\n\s*([a-z][a-z0-9]*)\s*:\s*\{", countries_block))

start2 = end
end2 = text.find("function calculateResult", start2)
if end2 == -1:
    end2 = text.find("function displayResult", start2)
if end2 == -1:
    end2 = len(text)
scoring_block = text[start2:end2]

referenced_keys = set(re.findall(r"\b([a-z][a-z0-9]*)\s*:\s*[0-9]\b", scoring_block))
answer_values = set(re.findall(r"data-value=\"([a-z0-9]+)\"", text))
noise = {"stats","highlights","title","text","number","label","flag","name","tagline","image","description"}
referenced_country_like = referenced_keys - answer_values - noise

missing = sorted(referenced_country_like - country_keys)

print("countries:", len(country_keys))
print("referenced_country_like:", len(referenced_country_like))
print("missing:", len(missing))
for k in missing:
    print(k)
