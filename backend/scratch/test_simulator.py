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

def run_tests():
    print("=== STARTING SIMULATOR BULK SEED VERIFICATION ===")

    # Trigger seeding of 10 applications
    payload = {"count": 10}
    print("Sending POST request to /api/simulator/seed...")
    code, res = post_req("http://127.0.0.1:8000/api/simulator/seed", payload)
    
    assert code == 201, f"Expected 201 Created, got {code}"
    print(f"Success! Server returned status {code}.")
    print("Response payload:")
    print(json.dumps(res, indent=2))
    
    # Assert counts in summary
    assert "summary" in res, "Expected 'summary' field in response"
    summary = res["summary"]
    for outcome in ["COMPLETED", "FAILED_OTP", "FAILED_KYC", "ABANDONED_MIDWAY"]:
        assert outcome in summary, f"Expected key '{outcome}' in summary"
        print(f"  {outcome}: {summary[outcome]} applications simulated")
        
    total_seeded = sum(summary.values())
    assert total_seeded == 10, f"Expected total 10 seeded, got {total_seeded}"
    print(f"Total simulated and verified: {total_seeded} customer journeys.")
    print("=== SIMULATOR SEEDING TEST PASSED ===")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\n[TEST ASSERTION FAILURE]: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[TEST UNEXPECTED FAILURE]: {e}")
        sys.exit(1)
