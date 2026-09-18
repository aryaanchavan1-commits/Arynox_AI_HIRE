"""Quick debug — hit /api/jobs and print raw response."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ["APP_MODE"] = "local"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=True)

try:
    r = client.get("/api/jobs", headers={"Authorization": "Bearer test"})
    print(f"status={r.status_code}")
    print(f"body={r.text}")
except Exception as e:
    print(f"EXCEPTION: {e}")
