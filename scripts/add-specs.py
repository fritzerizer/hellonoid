#!/usr/bin/env python3
import json, urllib.request, os

SERVICE_KEY = open(os.path.expanduser("~/.secrets/supabase-service-role")).read().strip()
SUPABASE_URL = "https://oqdasylggugfxvotpusi.supabase.co"

# Specs for new robots (id 30-41)
specs = [
    # Sophia (30)
    {"robot_id":30,"spec_key":"Height","spec_value":"165","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":30,"spec_key":"Weight","spec_value":"20","spec_unit":"kg","spec_category":"dimensions"},

    # NAO (31)
    {"robot_id":31,"spec_key":"Height","spec_value":"58","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":31,"spec_key":"Weight","spec_value":"5.4","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":31,"spec_key":"Battery Life","spec_value":"90","spec_unit":"min","spec_category":"power"},
    {"robot_id":31,"spec_key":"DOF","spec_value":"25","spec_unit":"","spec_category":"mechanical"},

    # Pepper (32)
    {"robot_id":32,"spec_key":"Height","spec_value":"121","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":32,"spec_key":"Weight","spec_value":"28","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":32,"spec_key":"Battery Life","spec_value":"12","spec_unit":"hours","spec_category":"power"},
    {"robot_id":32,"spec_key":"DOF","spec_value":"20","spec_unit":"","spec_category":"mechanical"},

    # Agibot Genie G1 (33)
    {"robot_id":33,"spec_key":"Height","spec_value":"165","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":33,"spec_key":"Weight","spec_value":"60","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":33,"spec_key":"DOF","spec_value":"53","spec_unit":"","spec_category":"mechanical"},

    # Dreame Dr.01 (34)
    {"robot_id":34,"spec_key":"Height","spec_value":"172","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":34,"spec_key":"Weight","spec_value":"56","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":34,"spec_key":"Walking Speed","spec_value":"5","spec_unit":"km/h","spec_category":"performance"},

    # LimX CL-1 (35)
    {"robot_id":35,"spec_key":"Height","spec_value":"170","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":35,"spec_key":"Weight","spec_value":"65","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":35,"spec_key":"Walking Speed","spec_value":"4","spec_unit":"km/h","spec_category":"performance"},

    # Galbot G1 (36)
    {"robot_id":36,"spec_key":"Height","spec_value":"168","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":36,"spec_key":"Weight","spec_value":"55","spec_unit":"kg","spec_category":"dimensions"},

    # Robot Era Star1 (37)
    {"robot_id":37,"spec_key":"Height","spec_value":"171","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":37,"spec_key":"Weight","spec_value":"68","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":37,"spec_key":"DOF","spec_value":"42","spec_unit":"","spec_category":"mechanical"},

    # Robonaut 2 (38)
    {"robot_id":38,"spec_key":"Height","spec_value":"100","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":38,"spec_key":"Weight","spec_value":"150","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":38,"spec_key":"DOF","spec_value":"42","spec_unit":"","spec_category":"mechanical"},
    {"robot_id":38,"spec_key":"Grip Strength","spec_value":"2.3","spec_unit":"kg","spec_category":"performance"},

    # Toyota T-HR3 (39)
    {"robot_id":39,"spec_key":"Height","spec_value":"154","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":39,"spec_key":"Weight","spec_value":"75","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":39,"spec_key":"DOF","spec_value":"32","spec_unit":"","spec_category":"mechanical"},

    # 1X EVE (40)
    {"robot_id":40,"spec_key":"Height","spec_value":"186","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":40,"spec_key":"Weight","spec_value":"86","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":40,"spec_key":"Battery Life","spec_value":"8","spec_unit":"hours","spec_category":"power"},
    {"robot_id":40,"spec_key":"Payload","spec_value":"15","spec_unit":"kg","spec_category":"performance"},

    # Figure 01 (41)
    {"robot_id":41,"spec_key":"Height","spec_value":"170","spec_unit":"cm","spec_category":"dimensions"},
    {"robot_id":41,"spec_key":"Weight","spec_value":"60","spec_unit":"kg","spec_category":"dimensions"},
    {"robot_id":41,"spec_key":"DOF","spec_value":"40","spec_unit":"","spec_category":"mechanical"},
    {"robot_id":41,"spec_key":"Battery Life","spec_value":"5","spec_unit":"hours","spec_category":"power"},
]

payload = json.dumps(specs).encode()
req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/robot_specs",
    data=payload,
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    },
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"Added {len(data)} specs for {len(set(s['robot_id'] for s in data))} robots")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")
