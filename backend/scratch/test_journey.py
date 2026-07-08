import urllib.request
import json
import sys

def post_req(url, data):
    payload = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get_req(url):
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def run_tests():
    print("=== STARTING JOURNEY TRACKING VERIFICATION TESTS ===")

    # 1. Start Journey for seeded Customer ID 1
    print("\n1. Starting new customer journey session (Customer ID: 1)...")
    start_payload = {
        "customer_id": 1,
        "branch_name": "Worli Hub",
        "device_type": "MOBILE",
        "browser": "Chrome Mobile v115",
        "operating_system": "Android 13",
        "ip_address": "192.168.1.5",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India"
    }
    code, res = post_req("http://127.0.0.1:8000/api/journey/start", start_payload)
    assert code == 210 or code == 201, f"Expected 201, got {code}"
    app_id = res["application_id"]
    sess_id = res["session_id"]
    print(f"   Success (Status: {code}). Application ID: {app_id}, Session ID: {sess_id}")

    # Verify initial event: "Application Started" is automatically logged
    code, timeline = get_req(f"http://127.0.0.1:8000/api/journey/{app_id}")
    assert code == 200, f"Expected 200, got {code}"
    assert len(timeline["events"]) == 1, "Expected 1 initial event"
    assert timeline["events"][0]["step_name"] == "Application Started", "Initial event name mismatch"
    assert timeline["events"][0]["status"] == "COMPLETED", "Initial event status mismatch"
    print("   Verification PASSED: Initial 'Application Started' event automatically logged.")

    # 2. Log a valid step transition: "PAN Uploaded"
    print("\n2. Logging valid step event: 'PAN Uploaded'...")
    event_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "step_name": "PAN Uploaded",
        "status": "COMPLETED",
        "time_spent_seconds": 35.5
    }
    code, evt = post_req("http://127.0.0.1:8000/api/journey/event", event_payload)
    assert code == 201, f"Expected 201, got {code}"
    print(f"   Success (Status: {code}). Event logged: {evt['step_name']} ({evt['status']})")

    # 3. Test Invalid Step Transition: Skipping to "Video KYC"
    print("\n3. Testing invalid transition: Skipping to 'Video KYC' directly...")
    invalid_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "step_name": "Video KYC",
        "status": "STARTED"
    }
    code, err_res = post_req("http://127.0.0.1:8000/api/journey/event", invalid_payload)
    assert code == 400, f"Expected 400 for invalid transition, got {code}"
    print(f"   Success (Status: {code}). Blocked with error: {err_res['detail']}")
    assert "predecessor step" in err_res["detail"].lower(), "Error message mismatch"

    # 4. Test Duplicate Consecutive Event Block
    print("\n4. Testing duplicate consecutive event block...")
    duplicate_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "step_name": "PAN Uploaded",
        "status": "COMPLETED"
    }
    code, err_res = post_req("http://127.0.0.1:8000/api/journey/event", duplicate_payload)
    assert code == 400, f"Expected 400 for duplicate event, got {code}"
    print(f"   Success (Status: {code}). Blocked with error: {err_res['detail']}")
    assert "duplicate consecutive event" in err_res["detail"].lower(), "Error message mismatch"

    # 5. Log another valid step transition: "Aadhaar Uploaded"
    print("\n5. Logging valid step event: 'Aadhaar Uploaded'...")
    aadhaar_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "step_name": "Aadhaar Uploaded",
        "status": "COMPLETED"
    }
    code, evt = post_req("http://127.0.0.1:8000/api/journey/event", aadhaar_payload)
    assert code == 201, f"Expected 201, got {code}"
    print(f"   Success (Status: {code}). Event logged: {evt['step_name']} ({evt['status']})")
    # Verify auto duration calculation
    assert evt["time_spent_seconds"] > 0, "Expected duration to be calculated automatically"
    print(f"   Verification PASSED: Step duration automatically calculated as {evt['time_spent_seconds']:.2f}s.")

    # 6. Test invalid completion: Conclude as COMPLETED before submitting
    print("\n6. Testing invalid Conclude: End as COMPLETED before reaching submission...")
    end_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "status": "COMPLETED"
    }
    code, err_res = post_req("http://127.0.0.1:8000/api/journey/end", end_payload)
    assert code == 400, f"Expected 400 for invalid completion, got {code}"
    print(f"   Success (Status: {code}). Blocked with error: {err_res['detail']}")
    assert "onboarding has not been submitted yet" in err_res["detail"].lower(), "Error message mismatch"

    # 7. End session as ABANDONED (valid at any stage)
    print("\n7. Concluding onboarding session as ABANDONED...")
    abandon_payload = {
        "application_id": app_id,
        "session_id": sess_id,
        "status": "ABANDONED",
        "reason": "Customer dropped off due to slow connection"
    }
    code, end_res = post_req("http://127.0.0.1:8000/api/journey/end", abandon_payload)
    assert code == 200, f"Expected 200, got {code}"
    print(f"   Success (Status: {code}). {end_res['message']}")

    # 8. Retrieve and verify complete chronological timeline
    print("\n8. Retrieving complete chronological timeline...")
    code, timeline = get_req(f"http://127.0.0.1:8000/api/journey/{app_id}")
    assert code == 200, f"Expected 200, got {code}"
    print(f"   Total Duration: {timeline['total_duration_seconds']:.2f} seconds")
    print(f"   Timeline Event Path:")
    for idx, e in enumerate(timeline["events"]):
        print(f"     [{idx + 1}] {e['step_name']} - Status: {e['status']} (Duration: {e['time_spent_seconds']}s)")
    
    assert len(timeline["events"]) == 4, "Expected 4 events (Started -> PAN -> Aadhaar -> Abandoned)"
    assert timeline["events"][-1]["step_name"] == "Abandoned", "Timeline ending mismatches"
    print("   Verification PASSED: Chronological timeline verified.")

    print("\n=== ALL JOURNEY TRACKING VERIFICATION TESTS PASSED ===")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\n[TEST ASSERTION FAILURE]: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[TEST UNEXPECTED FAILURE]: {e}")
        sys.exit(1)
