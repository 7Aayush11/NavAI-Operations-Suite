import sys
import os

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force import of all models to populate registries
import app.models.user
import app.journey.models

from app.database.session import SessionLocal
from app.loan_recovery.service import LoanRecoveryService
from app.models.user import User
from app.loan_recovery.schemas import (
    PredictionInput,
    RecoveryRecordUpdate,
    PredictionResponse,
    DashboardResponse,
    AnalyticsResponse
)
from app.loan_recovery.router import (
    get_queue, get_stats, update_record,
    get_loan_recovery_dashboard,
    predict_loan_recovery_strategy,
    get_loan_recovery_analytics
)

def test_endpoints():
    print("=== STARTING PRODUCTION REST APIS TELEMETRY CHECKS ===")
    
    db = SessionLocal()
    service = LoanRecoveryService(db)
    user = User(id=1, full_name="System Administrator", email="admin@navadhan.com", role_id=1)
    
    # 1. Test POST /loan-recovery/predict
    print("\n[TEST] POST /loan-recovery/predict (Detailed ML predictions)...")
    predict_payload = PredictionInput(
        outstanding_amount=15000.0,
        days_overdue=45,
        previous_defaults=0,
        bankruptcy_history=0,
        credit_score=600,
        distance_from_branch=12.5,
        call_response=1
    )
    
    raw_response = predict_loan_recovery_strategy(payload=predict_payload, current_user=user, service=service)
    # Parse and validate with Pydantic schema
    response = PredictionResponse(**raw_response)
    print(f"Recommended Strategy: {response.recommended_strategy}")
    print(f"Confidence: {response.prediction_confidence}")
    print(f"Class Probabilities: {response.class_probabilities}")
    print(f"Priority Score: {response.priority_score}")
    print(f"Risk Level: {response.risk_level}")
    print(f"Recommended Action: {response.recommended_action}")
    print(f"Estimated Recovery Cost: {response.estimated_recovery_cost}")
    
    assert response.recommended_strategy in ["SMS Reminder", "Regular Call", "Priority Call", "Field Visit"]
    assert response.prediction_confidence >= 0.0 and response.prediction_confidence <= 1.0
    assert abs(sum(response.class_probabilities.values()) - 1.0) < 1e-4
    assert response.priority_score > 0
    assert response.risk_level in ["High", "Medium", "Low"]
    assert len(response.recommended_action) > 0
    assert response.estimated_recovery_cost > 0
    print("-> Prediction endpoint checks passed!")

    # 2. Test GET /loan-recovery/dashboard
    print("\n[TEST] GET /loan-recovery/dashboard (Overview metrics)...")
    raw_dashboard = get_loan_recovery_dashboard(current_user=user, service=service)
    # Parse and validate with Pydantic schema
    dashboard = DashboardResponse(**raw_dashboard)
    print(f"Total Customers: {dashboard.total_customers}")
    print(f"Average Priority Score: {dashboard.average_priority_score}")
    print(f"Average Outstanding: {dashboard.average_outstanding}")
    print(f"Average Days Overdue: {dashboard.average_days_overdue}")
    print(f"High Risk Customers Count: {dashboard.high_risk_customers_count}")
    print(f"Strategy Distribution: {[{'strategy': s.strategy, 'count': s.count, 'total': s.total_amount} for s in dashboard.strategy_distribution]}")
    print(f"Top High Priority Count: {len(dashboard.top_priority_customers)}")
    if len(dashboard.top_priority_customers) > 0:
        top_cust = dashboard.top_priority_customers[0]
        print(f"  Top Customer: {top_cust.customer_name} (Priority Score: {top_cust.priority_score})")
        
    assert dashboard.total_customers == 2000
    assert dashboard.average_priority_score > 0
    assert dashboard.average_days_overdue > 0
    assert dashboard.high_risk_customers_count > 0
    assert len(dashboard.top_priority_customers) <= 5
    print("-> Dashboard endpoint checks passed!")

    # 3. Test GET /loan-recovery/analytics
    print("\n[TEST] GET /loan-recovery/analytics (Detailed distributions)...")
    raw_analytics = get_loan_recovery_analytics(current_user=user, service=service)
    # Parse and validate with Pydantic schema
    analytics = AnalyticsResponse(**raw_analytics)
    print(f"Strategy Counts: {analytics.strategy_counts}")
    print(f"Outstanding Distribution: {analytics.outstanding_distribution}")
    print(f"Priority Distribution: {analytics.priority_distribution}")
    print(f"Credit Score Distribution: {analytics.credit_score_distribution}")
    print(f"Days Overdue Distribution: {analytics.days_overdue_distribution}")
    print(f"Risk Distribution: {analytics.risk_distribution}")
    print(f"Grouped Averages: {[{'strategy': a.strategy, 'avg_outstanding': a.average_outstanding, 'avg_days': a.average_days_overdue, 'avg_priority': a.average_priority_score, 'avg_credit': a.average_credit_score} for a in analytics.averages_by_strategy]}")
    print(f"Top 10 High Priority Customers: {len(analytics.top_10_priority_customers)}")
    print(f"Business Insights (dynamic):")
    for insight in analytics.business_insights:
        print(f"  - {insight}")
    
    assert len(analytics.strategy_counts) > 0
    assert sum(analytics.outstanding_distribution.values()) == dashboard.total_customers
    assert len(analytics.averages_by_strategy) > 0
    assert len(analytics.top_10_priority_customers) == 10
    assert len(analytics.business_insights) == 4
    print("-> Analytics endpoint checks passed!")

    db.close()
    print("\n=== ALL REST APIS INTEGRATION CHECKS COMPLETED ===")

if __name__ == "__main__":
    test_endpoints()
