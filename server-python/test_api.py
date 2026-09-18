"""Full API test suite — FastAPI TestClient, no server needed."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ["APP_MODE"] = "local"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=True)
H = {"Authorization": "Bearer test"}
passed = 0
total = 0

def t(label, ok, detail=""):
    global passed, total
    total += 1
    s = "PASS" if ok else "FAIL"
    e = f" — {detail}" if detail else ""
    print(f"  [{s}] {label}{e}")
    if ok: passed += 1

print("\n=== HEALTH ===")
r = client.get("/health")
t("/health", r.status_code == 200 and r.json()["status"] == "ok")

print("\n=== JOBS ===")
r = client.get("/api/jobs", headers=H)
t("GET /api/jobs", r.status_code == 200)
jobs = r.json().get("jobs", [])
t("jobs not empty", len(jobs) > 0, f"count={len(jobs)}")
t("job has title", jobs and "title" in jobs[0])
t("job has required_skills (parsed)", jobs and isinstance(jobs[0]["required_skills"], list))

print("\n=== CANDIDATES ===")
r = client.get("/api/candidates", headers=H)
t("GET /api/candidates", r.status_code == 200)
cands = r.json().get("candidates", [])
t("candidates not empty", len(cands) > 0)

r = client.post("/api/candidates", headers=H, json={
    "name": "Test User", "email": "test@example.com", "skills": ["Python", "Go"]
})
t("POST /api/candidates", r.status_code == 200 and "id" in r.json())

print("\n=== INTERVIEWS ===")
r = client.get("/api/interviews", headers=H)
t("GET /api/interviews", r.status_code == 200)

r = client.post("/api/interviews", headers=H, json={
    "candidateId": "a49f80c2-9826-4a5f-8da1-c0e25a84990f",
    "jobId": "75d64f12-c9a7-4b6b-bd14-48a2656ef0a5",
    "language": "en",
})
t("POST /api/interviews (create)", r.status_code == 200 and "invitation_token" in r.json())
interview = r.json()
token = interview.get("invitation_token", "")
iid = interview.get("id", "")

if token:
    r = client.get(f"/api/interviews/validate-token/{token}", headers=H)
    t("validate-token", r.status_code == 200 and r.json().get("valid") == True)

    r = client.post(f"/api/interviews/join/{token}", headers=H)
    t("join interview", r.status_code == 200 and "interviewId" in r.json())

    r = client.get(f"/api/interviews/{iid}", headers=H)
    t("GET /interviews/:id", r.status_code == 200 and r.json().get("id") == iid)

    r = client.post(f"/api/interviews/{iid}/answer", headers=H, json={
        "answer": "I built a full-stack app with React and Node.js",
        "question": "Describe a project you built",
        "skill": "React",
    })
    t("submit answer", r.status_code == 200 and r.json().get("received") == True)

    r = client.get(f"/api/interviews/{iid}/events", headers=H)
    t("get events", r.status_code == 200)
    t("events has answer", len(r.json().get("events", [])) > 0)

    r = client.post(f"/api/interviews/{iid}/complete", headers=H, json={
        "evaluation": {"technical": 8, "communication": 9}
    })
    t("complete interview", r.status_code == 200)

print("\n=== VOICE / AVATAR ===")
t("voice status", client.get("/api/voice/status", headers=H).status_code == 200)
t("avatar status", client.get("/api/avatar/status", headers=H).status_code == 200)

print("\n=== AUTH ===")
t("no auth = 401", client.get("/api/jobs").status_code == 401)

print(f"\n{'='*40}")
print(f"RESULTS: {passed}/{total} passed")
if passed == total:
    print("ALL TESTS PASSED")
else:
    print(f"{total - passed} TESTS FAILED")
