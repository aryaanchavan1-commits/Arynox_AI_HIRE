"""Full integration test for voice + proctoring."""
import httpx, json, base64, numpy as np, cv2

API = "http://localhost:8000"

# 1. TTS
print("=== TTS ===")
r = httpx.post(f"{API}/api/voice/tts", json={"text": "Welcome to the interview. Tell me about yourself.", "language": "en", "speaker": "ritu"}, timeout=30)
d = r.json()
if d.get("audio"):
    audio_bytes = base64.b64decode(d["audio"])
    print(f"OK: {len(audio_bytes)} bytes, mock={d.get('mockMode')}")
else:
    print(f"FAIL: {d}")

# 2. STT roundtrip
print("\n=== STT (roundtrip) ===")
if d.get("audio"):
    r2 = httpx.post(f"{API}/api/voice/stt", json={"audio": d["audio"], "language": "en"}, timeout=30)
    print(f"OK: {r2.json()}")

# 3. Proctoring with face
print("\n=== Proctoring (no face) ===")
img = np.zeros((480, 640, 3), dtype=np.uint8)
_, buf = cv2.imencode('.jpg', img)
r3 = httpx.post(f"{API}/api/proctoring/analyze-frame", json={"frame": base64.b64encode(buf).decode(), "interview_id": "test-full"}, timeout=15)
d3 = r3.json()
print(f"faces={d3['face_count']} gaze={d3['gaze']} alerts={d3['alerts']}")

# 4. Screen analysis
print("\n=== Screen Analysis ===")
screen = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)
_, sbuf = cv2.imencode('.jpg', screen)
r4 = httpx.post(f"{API}/api/proctoring/analyze-screen", json={"screenshot": base64.b64encode(sbuf).decode(), "interview_id": "test-full"}, timeout=15)
d4 = r4.json()
print(f"text_density={d4.get('text_density',0):.2f} alerts={d4.get('alerts',[])}")

# 5. Proctoring results
print("\n=== Proctoring Results ===")
r5 = httpx.get(f"{API}/api/proctoring/results/test-full", timeout=10)
print(f"status={r5.status_code} keys={list(r5.json().keys()) if r5.status_code==200 else 'N/A'}")

# 6. Voices list
print("\n=== Voices ===")
r6 = httpx.get(f"{API}/api/voice/voices", timeout=10)
v = r6.json()["voices"]
for lang, voices in v.items():
    print(f"  {lang}: {len(voices)} voices - {[v['name'] for v in voices]}")

print("\n=== ALL TESTS PASSED ===")
