import os
import joblib
import pandas as pd
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

import warnings
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    warnings.filterwarnings("ignore", message="Trying to unpickle estimator")

from app.models.recovery import RecoveryRecord

logger = logging.getLogger(__name__)

# Load the model only once during application startup
MODEL_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(MODEL_DIR, "models", "loan_recovery_model.pkl")

try:
    logger.info(f"Loading loan recovery model from {MODEL_PATH}...")
    model = joblib.load(MODEL_PATH)
    logger.info("Loan recovery model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load loan recovery model: {e}")
    model = None

class LoanRecoveryService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_priority_score(
        self,
        outstanding_amount: float,
        days_overdue: int,
        previous_defaults: int,
        bankruptcy_history: int,
        credit_score: int,
        distance_from_branch: float,
        call_response: int
    ) -> float:
        """
        Calculates the Priority Score using the verified Min-Max normalization formula.
        """
        # Min-Max Normalizations
        outstanding_norm = (outstanding_amount - 1110) / 81980
        days_norm = (days_overdue - 1) / 179
        credit_norm = (credit_score - 386) / 311
        distance_norm = (distance_from_branch - 1) / 49

        # Formula calculation
        score = (
            30 * outstanding_norm +
            25 * days_norm +
            15 * previous_defaults +
            10 * bankruptcy_history -
            10 * credit_norm +
            5 * distance_norm +
            5 * call_response +
            10.0
        )
        return float(score)

    def determine_risk_level(self, priority_score: float, days_overdue: int) -> str:
        """
        Determines the Risk Level category.
        """
        if priority_score >= 30.0 or days_overdue >= 90:
            return "High"
        elif priority_score >= 15.0 or days_overdue >= 45:
            return "Medium"
        else:
            return "Low"

    def determine_recommended_action(self, strategy: str) -> str:
        """
        Returns the descriptive actionable recommended action for the strategy.
        """
        mapping = {
            "SMS Reminder": "Send automated SMS reminder with secure payment link.",
            "Regular Call": "Schedule a routine telephonic follow-up call.",
            "Priority Call": "Assign senior recovery officer for immediate telephonic collection.",
            "Field Visit": "Dispatch local field recovery officer for direct in-person contact."
        }
        return mapping.get(strategy, "Follow up with standard communication protocols.")

    def get_estimated_cost(self, strategy: str) -> float:
        """
        Returns the estimated operational recovery cost in INR.
        """
        costs = {
            "SMS Reminder": 50.0,
            "Regular Call": 150.0,
            "Priority Call": 400.0,
            "Field Visit": 1800.0
        }
        return costs.get(strategy, 100.0)

    def predict_strategy(
        self,
        outstanding_amount: float,
        days_overdue: int,
        previous_defaults: int,
        bankruptcy_history: int,
        credit_score: int,
        distance_from_branch: float,
        call_response: int
    ) -> Dict[str, Any]:
        """
        Predicts the recommended recovery strategy using the loaded Random Forest model,
        returning details on prediction confidence, class probabilities, and priority scores.
        """
        if model is None:
            logger.error("Prediction attempted but model is not loaded.")
            raise ValueError("Random Forest model is not loaded.")

        # Exact feature order matching the trained model:
        # 1. OutstandingAmount
        # 2. DaysOverdue
        # 3. PreviousLoanDefaults
        # 4. BankruptcyHistory
        # 5. CreditScore
        # 6. DistanceFromBranch
        # 7. CallResponse
        feature_names = [
            'OutstandingAmount',
            'DaysOverdue',
            'PreviousLoanDefaults',
            'BankruptcyHistory',
            'CreditScore',
            'DistanceFromBranch',
            'CallResponse'
        ]

        data = [[
            outstanding_amount,
            days_overdue,
            previous_defaults,
            bankruptcy_history,
            credit_score,
            distance_from_branch,
            call_response
        ]]

        # Calculate Priority Score and Risk Level
        priority_score = self.calculate_priority_score(
            outstanding_amount=outstanding_amount,
            days_overdue=days_overdue,
            previous_defaults=previous_defaults,
            bankruptcy_history=bankruptcy_history,
            credit_score=credit_score,
            distance_from_branch=distance_from_branch,
            call_response=call_response
        )
        risk_level = self.determine_risk_level(priority_score, days_overdue)

        # Run prediction
        try:
            df = pd.DataFrame(data, columns=feature_names)
            prediction = model.predict(df)[0]
            probabilities = model.predict_proba(df)[0]
        except Exception as e:
            logger.warning(f"DataFrame prediction failed: {e}. Trying list of lists fallback...")
            try:
                prediction = model.predict(data)[0]
                probabilities = model.predict_proba(data)[0]
            except Exception as e_fallback:
                logger.error(f"Fallback prediction failed: {e_fallback}")
                prediction = "SMS Reminder"
                probabilities = [1.0, 0.0, 0.0, 0.0]

        # Map class probabilities
        class_probabilities = {}
        for idx, cls_name in enumerate(model.classes_):
            class_probabilities[cls_name] = float(probabilities[idx])

        confidence = class_probabilities.get(prediction, 1.0)
        action = self.determine_recommended_action(prediction)
        cost = self.get_estimated_cost(prediction)

        return {
            "recommended_strategy": prediction,
            "prediction_confidence": confidence,
            "class_probabilities": class_probabilities,
            "priority_score": priority_score,
            "risk_level": risk_level,
            "recommended_action": action,
            "estimated_recovery_cost": cost
        }

    def get_recovery_queue(self) -> List[RecoveryRecord]:
        """
        Retrieves list of recovery records ordered by priority score descending.
        """
        return self.db.query(RecoveryRecord).filter(RecoveryRecord.payment_status == "UNPAID").order_by(RecoveryRecord.priority_score.desc()).all()

    def get_recovery_stats(self) -> Dict[str, Any]:
        """
        Retrieves statistics on recovery outstanding amounts and strategies.
        """
        unpaid_records = self.db.query(RecoveryRecord).filter(RecoveryRecord.payment_status == "UNPAID")
        
        total_outstanding = unpaid_records.with_entities(func.sum(RecoveryRecord.outstanding_amount)).scalar() or 0.0
        total_records = unpaid_records.count()
        
        # High risk: priority score >= 30.0 or days overdue >= 90
        high_risk_count = unpaid_records.filter(
            (RecoveryRecord.priority_score >= 30.0) | (RecoveryRecord.days_overdue >= 90)
        ).count()
        
        # Group count and outstanding amount by strategy
        strategy_data = self.db.query(
            RecoveryRecord.recovery_strategy,
            func.count(RecoveryRecord.id),
            func.sum(RecoveryRecord.outstanding_amount)
        ).filter(RecoveryRecord.payment_status == "UNPAID").group_by(RecoveryRecord.recovery_strategy).all()
        
        distribution = []
        for strategy, count, total_amt in strategy_data:
            distribution.append({
                "strategy": strategy,
                "count": count,
                "total_amount": total_amt or 0.0
            })
            
        return {
            "total_outstanding": total_outstanding,
            "total_records": total_records,
            "high_risk_count": high_risk_count,
            "strategy_distribution": distribution
        }

    def update_recovery_record(self, record_id: int, strategy: Optional[str] = None, notes: Optional[str] = None) -> Optional[RecoveryRecord]:
        """
        Updates an individual recovery record's strategy or comments.
        """
        record = self.db.query(RecoveryRecord).filter(RecoveryRecord.id == record_id).first()
        if not record:
            return None
        
        if strategy is not None:
            record.recovery_strategy = strategy
        if notes is not None:
            record.notes = notes
            
        record.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_dashboard(self) -> Dict[str, Any]:
        """
        Computes dashboard overview metrics for recovery.
        """
        unpaid_records = self.db.query(RecoveryRecord).filter(RecoveryRecord.payment_status == "UNPAID")
        total_customers = unpaid_records.count()
        
        if total_customers == 0:
            return {
                "total_customers": 0,
                "average_priority_score": 0.0,
                "average_outstanding": 0.0,
                "average_days_overdue": 0.0,
                "high_risk_customers_count": 0,
                "strategy_distribution": [],
                "top_priority_customers": []
            }
            
        avg_priority = unpaid_records.with_entities(func.avg(RecoveryRecord.priority_score)).scalar() or 0.0
        avg_outstanding = unpaid_records.with_entities(func.avg(RecoveryRecord.outstanding_amount)).scalar() or 0.0
        avg_days = unpaid_records.with_entities(func.avg(RecoveryRecord.days_overdue)).scalar() or 0.0
        high_risk_count = unpaid_records.filter(
            (RecoveryRecord.priority_score >= 30.0) | (RecoveryRecord.days_overdue >= 90)
        ).count()
        
        # Strategy distribution
        strategy_data = self.db.query(
            RecoveryRecord.recovery_strategy,
            func.count(RecoveryRecord.id),
            func.sum(RecoveryRecord.outstanding_amount)
        ).filter(RecoveryRecord.payment_status == "UNPAID").group_by(RecoveryRecord.recovery_strategy).all()
        
        distribution = []
        for strategy, count, total_amt in strategy_data:
            distribution.append({
                "strategy": strategy,
                "count": count,
                "total_amount": total_amt or 0.0
            })
            
        # Top 5 highest priority customers
        top_priority = unpaid_records.order_by(RecoveryRecord.priority_score.desc()).limit(5).all()
        
        return {
            "total_customers": total_customers,
            "average_priority_score": float(avg_priority),
            "average_outstanding": float(avg_outstanding),
            "average_days_overdue": float(avg_days),
            "high_risk_customers_count": high_risk_count,
            "strategy_distribution": distribution,
            "top_priority_customers": top_priority
        }

    def get_analytics(self) -> Dict[str, Any]:
        """
        Computes distributions and grouping averages for analytics.
        """
        records = self.db.query(RecoveryRecord).filter(RecoveryRecord.payment_status == "UNPAID").all()
        total_count = len(records) or 1
        
        strategy_counts = {}
        strategy_totals = {}
        strategy_days = {}
        strategy_priority = {}
        strategy_credit = {}
        
        # Distributions
        outstanding_dist = {"< 10k": 0, "10k - 25k": 0, "25k - 50k": 0, "> 50k": 0}
        priority_dist = {"< 15": 0, "15 - 30": 0, "> 30": 0}
        credit_dist = {"< 500": 0, "500 - 600": 0, "> 600": 0}
        days_dist = {"< 30 days": 0, "30 - 90 days": 0, "> 90 days": 0}
        risk_dist = {"High": 0, "Medium": 0, "Low": 0}
        
        high_priority_amount = 0.0
        overdue_90_count = 0
        field_visit_credit_sum = 0
        field_visit_count = 0
        sms_count = 0
        
        for r in records:
            strategy = r.recovery_strategy
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
            strategy_totals[strategy] = strategy_totals.get(strategy, 0.0) + r.outstanding_amount
            strategy_days[strategy] = strategy_days.get(strategy, 0) + r.days_overdue
            strategy_priority[strategy] = strategy_priority.get(strategy, 0.0) + r.priority_score
            strategy_credit[strategy] = strategy_credit.get(strategy, 0) + r.credit_score
            
            # Risk Level evaluation
            r_risk = self.determine_risk_level(r.priority_score, r.days_overdue)
            risk_dist[r_risk] = risk_dist.get(r_risk, 0) + 1
            
            # For dynamic insights
            if strategy in ["Field Visit", "Priority Call"]:
                high_priority_amount += r.outstanding_amount
            if r.days_overdue >= 90:
                overdue_90_count += 1
            if strategy == "Field Visit":
                field_visit_credit_sum += r.credit_score
                field_visit_count += 1
            if strategy == "SMS Reminder":
                sms_count += 1
            
            # Outstanding
            amt = r.outstanding_amount
            if amt < 10000:
                outstanding_dist["< 10k"] += 1
            elif amt <= 25000:
                outstanding_dist["10k - 25k"] += 1
            elif amt <= 50000:
                outstanding_dist["25k - 50k"] += 1
            else:
                outstanding_dist["> 50k"] += 1
                
            # Priority
            p = r.priority_score
            if p < 15:
                priority_dist["< 15"] += 1
            elif p <= 30:
                priority_dist["15 - 30"] += 1
            else:
                priority_dist["> 30"] += 1
                
            # Credit Score
            cs = r.credit_score
            if cs < 500:
                credit_dist["< 500"] += 1
            elif cs <= 600:
                credit_dist["500 - 600"] += 1
            else:
                credit_dist["> 600"] += 1
                
            # Days Overdue
            do = r.days_overdue
            if do < 30:
                days_dist["< 30 days"] += 1
            elif do <= 90:
                days_dist["30 - 90 days"] += 1
            else:
                days_dist["> 90 days"] += 1
                
        # Grouped averages
        averages = []
        for strategy in strategy_counts:
            count = strategy_counts[strategy]
            averages.append({
                "strategy": strategy,
                "average_outstanding": strategy_totals[strategy] / count,
                "average_days_overdue": strategy_days[strategy] / count,
                "average_priority_score": strategy_priority[strategy] / count,
                "average_credit_score": strategy_credit[strategy] / count
            })
            
        # Top 10 highest priority customers
        top_10 = self.db.query(RecoveryRecord).filter(RecoveryRecord.payment_status == "UNPAID").order_by(RecoveryRecord.priority_score.desc()).limit(10).all()
        
        # Calculate dynamic insights
        total_outstanding_amt = sum(strategy_totals.values()) or 1.0
        high_priority_pct = (high_priority_amount / total_outstanding_amt) * 100
        long_overdue_pct = (overdue_90_count / total_count) * 100
        field_visit_avg_credit = (field_visit_credit_sum / field_visit_count) if field_visit_count > 0 else 0.0
        
        insights = [
            f"High-priority collection actions (Field Visit & Priority Call) account for {high_priority_pct:.1f}% of total outstanding recovery pool (representing {high_priority_amount:,.0f} INR).",
            f"Approximately {long_overdue_pct:.1f}% of all active accounts in recovery have exceeded the 90-day overdue mark, placing them in critical collection status.",
            f"The average credit score for customers requiring Field Visits is {field_visit_avg_credit:.0f}, which highlights a strong correlation between historic credit deterioration and recovery escalation.",
            f"Automated SMS Reminders are currently handling {sms_count} lower-risk files ({ (sms_count/total_count)*100:.1f}% of files), safeguarding branch recovery teams from low-leverage contact efforts."
        ]
        
        return {
            "strategy_counts": strategy_counts,
            "outstanding_distribution": outstanding_dist,
            "priority_distribution": priority_dist,
            "credit_score_distribution": credit_dist,
            "days_overdue_distribution": days_dist,
            "risk_distribution": risk_dist,
            "averages_by_strategy": averages,
            "top_10_priority_customers": top_10,
            "business_insights": insights
        }
