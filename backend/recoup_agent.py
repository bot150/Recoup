import os
import sys
import csv
from datetime import datetime, timedelta

import pandas as pd
import joblib


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(0, PROJECT_ROOT)


# ============================================================
# IMPORT PROJECT MODULES
# ============================================================

from backend.decision_engine import (
    choose_best_action_with_timing
)

from backend.policy_engine import (
    check_policy
)

from backend.audit_logger import (
    log_decision
)

from data.recovery_simulator import (
    simulate_recovery
)


# ============================================================
# FILE PATHS
# ============================================================

MODEL_FILE = os.path.join(
    PROJECT_ROOT,
    "models",
    "recovery_model.joblib"
)

CUSTOMER_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "customers.csv"
)

EVALUATION_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "evaluation_payments.csv"
)


# ============================================================
# ACTIONS AND TIMINGS
# ============================================================

ACTIONS = [
    "SMART_RETRY",
    "PAYMENT_LINK",
    "NUDGE"
]

TIMINGS = [
    1,
    6,
    12,
    24,
    48
]


# ============================================================
# LOAD ML MODEL
# ============================================================

def load_model():

    return joblib.load(
        MODEL_FILE
    )


# ============================================================
# LOAD CUSTOMERS
# ============================================================

def load_customers():

    customers = {}

    with open(
        CUSTOMER_FILE,
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            customers[
                row["customer_id"]
            ] = row

    return customers


# ============================================================
# CREATE CANDIDATE
# ============================================================

def create_candidate(
    payment,
    customer,
    action,
    hours_after_failure
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    attempt_time = (
        failure_time
        + timedelta(
            hours=hours_after_failure
        )
    )

    hour_difference = abs(
        attempt_time.hour
        - int(
            customer[
                "typical_payment_hour"
            ]
        )
    )

    candidate = {

        "payment_id":
            payment[
                "payment_id"
            ],

        "customer_id":
            payment[
                "customer_id"
            ],

        "amount":
            float(
                payment[
                    "amount"
                ]
            ),

        "failure_reason":
            payment[
                "failure_reason"
            ],

        "payment_method":
            payment[
                "payment_method"
            ],

        "payment_frequency":
            customer[
                "payment_frequency"
            ],

        "preferred_method":
            customer[
                "preferred_method"
            ],

        "typical_payment_hour":
            int(
                customer[
                    "typical_payment_hour"
                ]
            ),

        "attempt_hour":
            attempt_time.hour,

        "hour_difference":
            hour_difference,

        "hours_after_failure":
            hours_after_failure,

        "attempt_number":
            1,

        "action":
            action,

        "attempt_time":
            attempt_time
    }

    return candidate


# ============================================================
# GENERATE AND SCORE ALL CANDIDATES
# ============================================================

def generate_candidates(
    payment,
    customer,
    model
):

    candidates = []

    for action in ACTIONS:

        for hours_after_failure in TIMINGS:

            candidate = create_candidate(
                payment,
                customer,
                action,
                hours_after_failure
            )

            model_input = pd.DataFrame(
                [candidate]
            )

            probability = (
                model.predict_proba(
                    model_input
                )[0][1]
            )

            candidate[
                "probability"
            ] = float(
                probability
            )

            candidates.append(
                candidate
            )

    return candidates


# ============================================================
# RUN RECOUP
# ============================================================

def run_recoup(
    payment,
    customer
):

    print("\n" + "=" * 60)
    print("                 RECOUP AGENT")
    print("=" * 60)

    print(
        f"\nPayment ID     : "
        f"{payment['payment_id']}"
    )

    print(
        f"Customer ID    : "
        f"{payment['customer_id']}"
    )

    print(
        f"Amount         : "
        f"₹{float(payment['amount']):.2f}"
    )

    print(
        f"Failure reason : "
        f"{payment['failure_reason']}"
    )


    # ========================================================
    # LOAD MODEL
    # ========================================================

    print(
        "\nLoading ML model..."
    )

    model = load_model()

    print(
        "ML model loaded successfully."
    )


    # ========================================================
    # STEP 1 — ML EVALUATION
    # ========================================================

    print(
        "\n[1] Evaluating action + timing strategies..."
    )

    candidates = generate_candidates(
        payment,
        customer,
        model
    )

    print(
        f"  Candidates evaluated : "
        f"{len(candidates)}"
    )


    # ========================================================
    # STEP 2 — DECISION ENGINE
    # ========================================================

    print(
        "\n[2] Decision Engine selecting best "
        "action + timing..."
    )

    best, decision_candidates = (
        choose_best_action_with_timing(
            amount=float(
                payment["amount"]
            ),
            candidates=candidates
        )
    )


    # ========================================================
    # DISPLAY TOP CANDIDATES
    # ========================================================

    print(
        "\nTop candidate strategies:"
    )

    top_candidates = sorted(
        decision_candidates,
        key=lambda x: x["expected_recovery"],
        reverse=True
    )[:10]

    for candidate in top_candidates:

        print(
            f"  {candidate['action']:<15}"
            f" +{candidate['hours_after_failure']:>2}h"
            f" Probability: "
            f"{candidate['probability']:.2%}"
            f" | Expected ₹: "
            f"{candidate['expected_recovery']:.2f}"
        )


    # ========================================================
    # SELECTED ACTION
    # ========================================================

    best_action = str(
        best["action"]
    ).strip().upper()

    selected_time = (
        best["attempt_time"]
    )

    selected_probability = float(
        best["probability"]
    )

    selected_timing_hours = int(
        best["hours_after_failure"]
    )

    expected_recovery = float(
        best["expected_recovery"]
    )


    # ========================================================
    # DISPLAY DECISION
    # ========================================================

    print(
        "\nSelected strategy:"
    )

    print(
        f"  Action              : "
        f"{best_action}"
    )

    print(
        f"  Timing              : "
        f"+{selected_timing_hours} hours"
    )

    print(
        f"  Probability         : "
        f"{selected_probability:.2%}"
    )

    print(
        f"  Expected recovery   : "
        f"₹{expected_recovery:.2f}"
    )


    # ========================================================
    # PREPARE ACTION-LEVEL PREDICTIONS FOR AUDIT
    # ========================================================

    audit_predictions = {}

    for action in ACTIONS:

        action_candidates = [
            candidate
            for candidate in decision_candidates
            if candidate["action"] == action
        ]

        best_for_action = max(
            action_candidates,
            key=lambda x: x["probability"]
        )

        audit_predictions[
            action
        ] = float(
            best_for_action["probability"]
        )


    # ========================================================
    # STEP 3 — POLICY ENGINE
    # ========================================================

    print(
        "\n[3] Policy Engine checking action..."
    )

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    policy_result = check_policy(

        action=best_action,

        attempt_count=0,

        nudge_count=0,

        last_action_time=None,

        current_time=selected_time,

        failure_time=failure_time
    )


    print(
        f"  Allowed : "
        f"{policy_result['allowed']}"
    )

    print(
        f"  Reason  : "
        f"{policy_result['reason']}"
    )


    # ========================================================
    # STEP 4 — EXECUTE ACTION
    # ========================================================

    if not policy_result[
        "allowed"
    ]:

        outcome = "BLOCKED"

        recovered_amount = 0.0

        print(
            "\n[4] Action blocked by policy."
        )

    else:

        print(
            "\n[4] Executing recovery action..."
        )

        result = simulate_recovery(

            payment=payment,

            customer=customer,

            action=best_action,

            action_time=selected_time,

            attempt_number=1
        )

        outcome = result[
            "result"
        ]

        recovered_amount = float(
            result[
                "recovered_amount"
            ]
        )

        print(
            f"  Result          : "
            f"{outcome}"
        )

        print(
            f"  Recovered amount: "
            f"₹{recovered_amount:.2f}"
        )


    # ========================================================
    # STEP 5 — AUDIT LOGGER
    # ========================================================

    print(
        "\n[5] Recording audit event..."
    )

    log_decision(

        payment_id=
            payment[
                "payment_id"
            ],

        customer_id=
            payment[
                "customer_id"
            ],

        amount=
            float(
                payment[
                    "amount"
                ]
            ),

        failure_reason=
            payment[
                "failure_reason"
            ],

        predictions=
            audit_predictions,

        selected_action=
            best_action,

        policy_allowed=
            policy_result[
                "allowed"
            ],

        policy_reason=
            policy_result[
                "reason"
            ],

        outcome=
            outcome,

        recovered_amount=
            recovered_amount,

        expected_recovery=
            expected_recovery,

        selected_probability=
            selected_probability,

        selected_timing_hours=
            selected_timing_hours,

        attempt_number=1
    )


    print(
        "  Audit recorded."
    )


    # ========================================================
    # COMPLETE
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "             RECOUP COMPLETE"
    )

    print(
        "=" * 60
    )
    return {
        "payment_id": payment["payment_id"],
        "customer_id": payment["customer_id"],
        "amount": float(payment["amount"]),
        "failure_reason": payment["failure_reason"],
        "action": best_action,
        "timing_hours": selected_timing_hours,
        "probability": selected_probability,
        "expected_recovery": expected_recovery,
        "policy_allowed": policy_result["allowed"],
        "policy_reason": policy_result["reason"],
        "outcome": outcome,
        "recovered_amount": recovered_amount,
        "attempt_number": 1,
        "candidates": [
            {
                "action": c["action"],
                "timing_hours": c["hours_after_failure"],
                "probability": float(c["probability"]),
                "expected_recovery": float(c["expected_recovery"])
            }
            for c in top_candidates
        ]
    }


# ============================================================
# MAIN
# ============================================================

def main():

    customers = load_customers()

    evaluation_df = pd.read_csv(
        EVALUATION_FILE
    )

    # First completely unseen evaluation payment
    payment = (
        evaluation_df
        .iloc[0]
        .to_dict()
    )

    customer = customers[
        payment[
            "customer_id"
        ]
    ]

    run_recoup(
        payment,
        customer
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    main()