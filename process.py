INPUT_FILE = "input.csv"
CACHE_FILE = "cache.json"  # This file will be created if it doesn't exist
OUTPUT_JS = "site/data.js"

"""
Input CSV format:

    start,end,location,notes

Output JSON format:

    {
        "metadata": {
            nomatid_id: {nomatim_data},
        },
        "places": {
            name: nomatim_id,
        }
        "dates": [
            {start, end, nomatim_id, notes},
        ]
    }

"""

import json, csv, time, requests

with open(INPUT_FILE) as f:
    reader = csv.DictReader(f)
    inp = list(reader)

data = {}
try:
    with open(CACHE_FILE) as f:
        data = json.load(f)

except Exception as e:
    data = {
        "metadata": {},
        "places": {},
        "dates": [],
    }

def get_geocode_id(name):
    if name in data["places"]:
        print(f"-> Using cached result for {name}")
        return data["places"][name]

    # Rate limit to 1 request per second
    print(f"-> Geocoding {name}, waiting for 1 sec...")
    time.sleep(1)

    # Add a chrome user agent to prevent 403 errors
    req = requests.get(f"https://nominatim.openstreetmap.org/search?q={name}&format=json&accept-language=en", headers={"User-Agent": "Mozilla/5.0"})
    if req.status_code != 200:
        print(f"Error: {req.status_code}: {req}")
        return None

    req = req.json()
    if len(req) == 0:
        print(f"No results for {name}")
        return None

    best = min(req, key=lambda x: (-x["importance"], len(x["display_name"])))
    place_id = best["place_id"]

    data["places"][name] = place_id
    data["metadata"][place_id] = best
    print(f"    -> Found {name} at {place_id}")
    return place_id

# We only overwrite the `dates` field of the output file, so that we can
# cache the geocoding results indefinitely.

new_dates = []
for row in inp:
    location = row["location"]
    if not location:
        continue

    place_id = get_geocode_id(location)
    if not place_id:
        continue

    new_dates.append({
        "start": row["start"],
        "end": row["end"],
        "name": location,
        "notes": row["notes"],
    })

data["dates"] = new_dates

with open(CACHE_FILE, "w") as f:
    json.dump(data, f)

js_code = f"""
const data = {json.dumps(data)};
"""
with open(OUTPUT_JS, "w") as f:
    f.write(js_code)

print("[+] Done")