import csv
import os
from datetime import datetime


# ============================================================
# AUDIT FILE
# ============================================================

AUDIT_FILE = "data/audit_log.csv"


# ============================================================
# CREATE AUDIT LOG
# ============================================================

def log_decision(
    payment_id,
    customer_id,
    amount,
    failure_reason,
    predictions,
    selected_action,
    policy_allowed,
    policy_reason,
    outcome,
    recovered_amount,
    expected_recovery=0.0,
    selected_probability=0.0,
    selected_timing_hours=0,
    attempt_number=1
):

    file_exists = os.path.exists(AUDIT_FILE)

    fieldnames = [
        "timestamp",
        "payment_id",
        "customer_id",
        "amount",
        "failure_reason",

        # ML predictions
        "smart_retry_probability",
        "payment_link_probability",
        "nudge_probability",

        # Agent decision
        "selected_action",
        "selected_probability",
        "expected_recovery",
        "selected_timing_hours",
        "attempt_number",

        # Policy
        "policy_allowed",
        "policy_reason",

        # Outcome
        "outcome",
        "recovered_amount"
    ]

    with open(
        AUDIT_FILE,
        "a",
        newline=""
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        if not file_exists:
            writer.writeheader()

        writer.writerow({

            "timestamp":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

            "payment_id":
                payment_id,

            "customer_id":
                customer_id,

            "amount":
                amount,

            "failure_reason":
                failure_reason,

            # ------------------------------------------------
            # ML predictions
            # ------------------------------------------------

            "smart_retry_probability":
                predictions.get(
                    "SMART_RETRY",
                    0
                ),

            "payment_link_probability":
                predictions.get(
                    "PAYMENT_LINK",
                    0
                ),

            "nudge_probability":
                predictions.get(
                    "NUDGE",
                    0
                ),

            # ------------------------------------------------
            # Agent decision
            # ------------------------------------------------

            "selected_action":
                selected_action,

            "selected_probability":
                selected_probability,

            "expected_recovery":
                expected_recovery,

            "selected_timing_hours":
                selected_timing_hours,

            "attempt_number":
                attempt_number,

            # ------------------------------------------------
            # Policy
            # ------------------------------------------------

            "policy_allowed":
                policy_allowed,

            "policy_reason":
                policy_reason,

            # ------------------------------------------------
            # Outcome
            # ------------------------------------------------

            "outcome":
                outcome,

            "recovered_amount":
                recovered_amount
        })


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    predictions = {
        "SMART_RETRY": 0.15,
        "PAYMENT_LINK": 0.61,
        "NUDGE": 0.38
    }

    log_decision(

        payment_id="PAY_TEST_001",

        customer_id="CUST_TEST_001",

        amount=3407.85,

        failure_reason="MANDATE_FAILURE",

        predictions=predictions,

        selected_action="PAYMENT_LINK",

        policy_allowed=True,

        policy_reason=
            "Action satisfies all policy rules.",

        outcome="RECOVERED",

        recovered_amount=3407.85,

        expected_recovery=2079.78,

        selected_probability=0.61,

        selected_timing_hours=6,

        attempt_number=1
    )

    print("======================================")
    print("          Recoup Audit Logger")
    print("======================================")

    print()
    print("Audit event recorded successfully.")

    print()
    print(
        "Audit file:",
        AUDIT_FILE
    )