import csv
import os
import sys
from datetime import datetime, timedelta
import random

# Add project root to Python path
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

sys.path.insert(0, PROJECT_ROOT)

from recovery_simulator import (
    calculate_timing_score,
    get_failure_score,
    get_action_score
)


# ============================================================
# FILES
# ============================================================

EVALUATION_FILE = "data/evaluation_payments.csv"
CUSTOMER_FILE = "data/customers.csv"

RESULT_FILE = "data/evaluation_results.csv"


# ============================================================
# BASELINE CONFIGURATION
# ============================================================

BASELINE_ATTEMPTS = [
    ("SMART_RETRY", 1),
    ("SMART_RETRY", 25)
]


# ============================================================
# RECOUP CONFIGURATION
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
# LOAD EVALUATION PAYMENTS
# ============================================================

def load_payments():

    payments = []

    with open(
        EVALUATION_FILE,
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            payments.append(row)

    return payments


# ============================================================
# CALCULATE RECOVERY PROBABILITY
# ============================================================

def calculate_probability(
    payment,
    customer,
    action,
    action_time,
    attempt_number
):

    failure_reason = payment[
        "failure_reason"
    ]

    timing_score = calculate_timing_score(
        customer,
        action_time
    )

    failure_score = get_failure_score(
        failure_reason
    )

    action_score = get_action_score(
        action,
        failure_reason
    )

    attempt_penalty = (
        0.90 ** (attempt_number - 1)
    )

    probability = (
        failure_score
        * timing_score
        * action_score
        * attempt_penalty
    )

    probability = max(
        0.02,
        min(
            probability,
            0.95
        )
    )

    return probability


# ============================================================
# DETERMINISTIC OUTCOME
# ============================================================

def deterministic_outcome(
    payment_id,
    action,
    hours_after_failure,
    attempt_number,
    probability
):

    # Create a stable seed from the scenario.
    seed_string = (
        f"{payment_id}|"
        f"{action}|"
        f"{hours_after_failure}|"
        f"{attempt_number}"
    )

    seed = sum(
        ord(char)
        for char in seed_string
    )

    rng = random.Random(seed)

    return rng.random() < probability


# ============================================================
# BASELINE
# ============================================================

def run_baseline(
    payment,
    customer
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    attempts = 0

    for action, hours_after_failure in BASELINE_ATTEMPTS:

        attempts += 1

        action_time = (
            failure_time
            + timedelta(
                hours=hours_after_failure
            )
        )

        probability = calculate_probability(
            payment,
            customer,
            action,
            action_time,
            attempts
        )

        recovered = deterministic_outcome(
            payment["payment_id"],
            action,
            hours_after_failure,
            attempts,
            probability
        )

        if recovered:

            return {
                "recovered": True,
                "amount": float(
                    payment["amount"]
                ),
                "attempts": attempts,
                "action": action,
                "timing": hours_after_failure
            }

    return {
        "recovered": False,
        "amount": 0.0,
        "attempts": attempts,
        "action": "STOP",
        "timing": 0
    }


# ============================================================
# RECOUP
# ============================================================

def run_recoup(
    payment,
    customer
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    candidates = []

    for action in ACTIONS:

        for hours_after_failure in TIMINGS:

            action_time = (
                failure_time
                + timedelta(
                    hours=hours_after_failure
                )
            )

            probability = calculate_probability(
                payment,
                customer,
                action,
                action_time,
                1
            )

            # Same costs used by Decision Engine
            costs = {
                "SMART_RETRY": 0.50,
                "PAYMENT_LINK": 1.00,
                "NUDGE": 0.20
            }

            expected_recovery = (
                float(payment["amount"])
                * probability
                - costs[action]
            )

            candidates.append({
                "action": action,
                "timing": hours_after_failure,
                "probability": probability,
                "expected_recovery":
                    expected_recovery
            })

    # Select highest expected recovery
    best = max(
        candidates,
        key=lambda x: x[
            "expected_recovery"
        ]
    )

    recovered = deterministic_outcome(
        payment["payment_id"],
        best["action"],
        best["timing"],
        1,
        best["probability"]
    )

    if recovered:

        return {
            "recovered": True,
            "amount": float(
                payment["amount"]
            ),
            "attempts": 1,
            "action": best["action"],
            "timing": best["timing"]
        }

    return {
        "recovered": False,
        "amount": 0.0,
        "attempts": 1,
        "action": best["action"],
        "timing": best["timing"]
    }


# ============================================================
# MAIN BENCHMARK
# ============================================================

def main():

    print("=" * 60)
    print("        RECOUP EVALUATION BENCHMARK")
    print("=" * 60)

    customers = load_customers()

    payments = load_payments()

    print(
        f"\nEvaluation payments: "
        f"{len(payments)}"
    )

    results = []

    baseline_recovered = 0
    baseline_amount = 0.0
    baseline_attempts = 0

    recoup_recovered = 0
    recoup_amount = 0.0
    recoup_attempts = 0

    print(
        "\nRunning benchmark..."
    )

    for index, payment in enumerate(payments):

        customer = customers[
            payment["customer_id"]
        ]

        baseline = run_baseline(
            payment,
            customer
        )

        recoup = run_recoup(
            payment,
            customer
        )

        if baseline["recovered"]:

            baseline_recovered += 1

            baseline_amount += (
                baseline["amount"]
            )

        baseline_attempts += (
            baseline["attempts"]
        )

        if recoup["recovered"]:

            recoup_recovered += 1

            recoup_amount += (
                recoup["amount"]
            )

        recoup_attempts += (
            recoup["attempts"]
        )

        results.append({

            "payment_id":
                payment["payment_id"],

            "amount":
                payment["amount"],

            "failure_reason":
                payment["failure_reason"],

            "baseline_recovered":
                baseline["recovered"],

            "baseline_action":
                baseline["action"],

            "baseline_timing":
                baseline["timing"],

            "baseline_attempts":
                baseline["attempts"],

            "recoup_recovered":
                recoup["recovered"],

            "recoup_action":
                recoup["action"],

            "recoup_timing":
                recoup["timing"],

            "recoup_attempts":
                recoup["attempts"]
        })

        if (
            index + 1
        ) % 100 == 0:

            print(
                f"  Processed "
                f"{index + 1}/"
                f"{len(payments)}"
            )


    # ========================================================
    # METRICS
    # ========================================================

    total = len(payments)

    baseline_rate = (
        baseline_recovered / total
    ) * 100

    recoup_rate = (
        recoup_recovered / total
    ) * 100

    baseline_avg_attempts = (
        baseline_attempts / total
    )

    recoup_avg_attempts = (
        recoup_attempts / total
    )

    incremental_recovery = (
        recoup_amount
        - baseline_amount
    )


    # ========================================================
    # SAVE RESULTS
    # ========================================================

    with open(
        RESULT_FILE,
        "w",
        newline=""
    ) as file:

        fieldnames = results[0].keys()

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()

        writer.writerows(results)


    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "                 RESULTS"
    )

    print(
        "=" * 60
    )

    print("\nBASELINE")

    print(
        f"Recovered payments : "
        f"{baseline_recovered}"
    )

    print(
        f"Recovery rate      : "
        f"{baseline_rate:.2f}%"
    )

    print(
        f"Total recovered ₹  : "
        f"₹{baseline_amount:,.2f}"
    )

    print(
        f"Average attempts   : "
        f"{baseline_avg_attempts:.2f}"
    )


    print("\nRECOUP")

    print(
        f"Recovered payments : "
        f"{recoup_recovered}"
    )

    print(
        f"Recovery rate      : "
        f"{recoup_rate:.2f}%"
    )

    print(
        f"Total recovered ₹  : "
        f"₹{recoup_amount:,.2f}"
    )

    print(
        f"Average attempts   : "
        f"{recoup_avg_attempts:.2f}"
    )


    print("\nIMPROVEMENT")

    print(
        f"Additional ₹ recovered : "
        f"₹{incremental_recovery:,.2f}"
    )

    print(
        f"Recovery rate uplift   : "
        f"{recoup_rate - baseline_rate:.2f} "
        f"percentage points"
    )


    print(
        "\nResults saved to:"
    )

    print(
        f"  {RESULT_FILE}"
    )

    print(
        "\nBenchmark complete."
    )


if __name__ == "__main__":

    main()