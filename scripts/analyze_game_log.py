#!/usr/bin/env python3
"""Analyse structurelle d'un Game.log SC (sans liste de mots-clés métier)."""
import re
from collections import Counter
from pathlib import Path

LOG = Path(__file__).resolve().parents[1] / "Game.log"
lines = LOG.read_text(encoding="utf-8", errors="replace").splitlines()

mission_ids = Counter()
objective_texts = Counter()
end_mission = []
vehicles = Counter()
locations = Counter()

for line in lines:
    if "mission_id" in line:
        for m in re.finditer(r"mission_id ([a-f0-9-]{36})", line):
            mission_ids[m.group(1)] += 1
    if "uiDisplay" in line and "Text=" in line:
        m = re.search(r"Text=([^\]]+)", line)
        if m:
            objective_texts[m.group(1)[:100]] += 1
    if "EndMission" in line or "CompletionType" in line:
        end_mission.append(line[30:250])
    if "ClearDriver" in line and "releasing control" in line:
        m = re.search(r"for '([^']+)'", line)
        if m:
            vehicles[m.group(1)] += 1
    if "RequestLocationInventory" in line:
        m = re.search(r"Location\[([^\]]+)\]", line)
        if m:
            locations[m.group(1)] += 1

print("=== UNIQUE MISSION IDs ===")
for mid, c in mission_ids.most_common(20):
    print(c, mid)
print("unique", len(mission_ids))
print("\n=== OBJECTIVE UI TEXT ===")
for t, c in objective_texts.most_common(20):
    print(c, t)
print("\n=== EndMission (count)", len(end_mission))
for s in end_mission[:6]:
    print(" ", s[:180])
print("\n=== Vehicles ===")
for v, c in vehicles.most_common():
    print(c, v)
print("\n=== Locations ===")
for loc, c in locations.most_common(15):
    print(c, loc)
