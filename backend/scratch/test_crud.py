import urllib.request
import json
import sys

def post_req(url, data, token=None):
    payload = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    with urllib.request.urlopen(req) as res:
        return res.getcode(), json.loads(res.read().decode())

def get_req(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(req) as res:
        return res.getcode(), json.loads(res.read().decode())

def put_req(url, data, token=None):
    payload = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=payload, headers=headers, method='PUT')
    with urllib.request.urlopen(req) as res:
        return res.getcode(), json.loads(res.read().decode())

def run_tests():
    print("=== STARTING CRUD API VALIDATION TESTS ===")
    
    # 1. Login as Super Admin
    print("\n1. Logging in as Super Admin...")
    code, res = post_req("http://127.0.0.1:8000/api/auth/login", {"email": "admin@navadhan.com", "password": "adminpassword"})
    admin_token = res["access_token"]
    print(f"   Success (Status: {code}). Welcome {res['user']['full_name']}")
    
    # 2. Login as Operations Officer
    print("\n2. Logging in as Operations Officer...")
    code, res = post_req("http://127.0.0.1:8000/api/auth/login", {"email": "officer@navadhan.com", "password": "officerpassword"})
    officer_token = res["access_token"]
    officer_id = res["user"]["id"]
    print(f"   Success (Status: {code}). Welcome {res['user']['full_name']}")

    # 3. List applications as Operations Officer (should only get assigned ones)
    print("\n3. Listing applications as Operations Officer...")
    code, apps = get_req("http://127.0.0.1:8000/api/applications", token=officer_token)
    print(f"   Success (Status: {code}). Found {len(apps)} assigned applications.")
    for app in apps:
        assert app["assigned_officer_id"] == officer_id, "Security leak: Officer retrieved application assigned to someone else!"
    print("   Verification PASSED: Officer retrieved ONLY their assigned applications.")

    # 4. Super Admin creates a new application
    print("\n4. Super Admin creating a new onboarding application...")
    new_app_data = {
        "customer_name": "Rohan Deshmukh",
        "phone_number": "+91 9820098200",
        "email": "rohan.deshmukh@test.com",
        "branch_name": "Mumbai West",
        "assigned_officer_id": officer_id
    }
    code, app = post_req("http://127.0.0.1:8000/api/applications", new_app_data, token=admin_token)
    app_id = app["id"]
    print(f"   Success (Status: {code}). Created Application ID: {app_id}")
    print(f"   Current Step: {app['current_step']}, Status: {app['status']}")
    assert app["current_step"] == "REGISTER" and app["status"] == "IN_PROGRESS", "Default initial application state incorrect"

    # 5. Append step logs to simulate customer KYC failure
    print("\n5. Posting a FAILED step log event for KYC_UPLOAD...")
    log_data = {
        "step_name": "KYC_UPLOAD",
        "status": "FAILED",
        "duration_seconds": 182.5,
        "error_message": "Liveness check: face match mismatch with ID card"
    }
    code, log = post_req(f"http://127.0.0.1:8000/api/applications/{app_id}/logs", log_data, token=officer_token)
    print(f"   Success (Status: {code}). Timeline event recorded.")

    # 6. Retrieve application details to confirm side-effects occurred
    print("\n6. Checking application details for side-effects...")
    code, app_detail = get_req(f"http://127.0.0.1:8000/api/applications/{app_id}", token=admin_token)
    print(f"   Application Current Step: {app_detail['current_step']}")
    print(f"   Application Funnel Status: {app_detail['status']}")
    print(f"   Application Abandoned Reason: {app_detail['abandoned_reason']}")
    assert app_detail["current_step"] == "KYC_UPLOAD", "Application current step failed to update"
    assert app_detail["status"] == "ABANDONED", "Application status failed to transition to ABANDONED"
    assert "face match mismatch" in app_detail["abandoned_reason"], "Application failed to capture error message"
    print("   Verification PASSED: Application transitioned automatically reflecting timeline changes.")

    # 7. Record call feedback as follow-up
    print("\n7. Recording call feedback from follow-up check...")
    feedback_data = {
        "abandoned_reason_category": "KYC_ISSUE",
        "notes": "Spoke to Rohan. He took photo in low lighting. Advised to retry in direct light."
    }
    code, fb = post_req(f"http://127.0.0.1:8000/api/applications/{app_id}/feedbacks", feedback_data, token=officer_token)
    print(f"   Success (Status: {code}). Recorded feedback note ID: {fb['id']}")

    # 8. Re-evaluate details to verify feedbacks are nested correctly
    print("\n8. Checking final application detail payload...")
    code, final_app = get_req(f"http://127.0.0.1:8000/api/applications/{app_id}", token=admin_token)
    print(f"   Timeline Log count: {len(final_app['step_logs'])}")
    print(f"   Follow-up Feedback count: {len(final_app['feedbacks'])}")
    assert len(final_app["step_logs"]) >= 2, "Step logs not returning nested"
    assert len(final_app["feedbacks"]) >= 1, "Feedbacks not returning nested"
    print("   Verification PASSED: Nested relationships returned correctly.")

    print("\n=== ALL CRUD API TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[TEST FAILURE]: {e}")
        sys.exit(1)
