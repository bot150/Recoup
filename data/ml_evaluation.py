import os
import sys
import csv
from datetime import datetime, timedelta
import random

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
# IMPORT SIMULATOR
# ============================================================

from recovery_simulator import (
    calculate_timing_score,
    get_failure_score,
    get_action_score
)


# ============================================================
# FILES
# ============================================================

EVALUATION_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "evaluation_payments.csv"
)

CUSTOMER_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "customers.csv"
)

MODEL_FILE = os.path.join(
    PROJECT_ROOT,
    "models",
    "recovery_model.joblib"
)

RESULT_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "ml_evaluation_results.csv"
)


# ============================================================
# CONFIGURATION
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

ACTION_COSTS = {
    "SMART_RETRY": 0.50,
    "PAYMENT_LINK": 1.00,
    "NUDGE": 0.20
}


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
# CREATE ONE ML CANDIDATE
# ============================================================

def create_candidate(
    payment,
    customer,
    action,
    timing
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    attempt_time = (
        failure_time
        + timedelta(
            hours=timing
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

    model_input = {

        "amount":
            float(
                payment["amount"]
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
            timing,

        "attempt_number":
            1,

        "action":
            action
    }

    return (
        model_input,
        attempt_time
    )


# ============================================================
# CALCULATE TRUE SIMULATOR PROBABILITY
# ============================================================

def calculate_probability(
    payment,
    customer,
    action,
    action_time,
    attempt_number
):

    failure_score = get_failure_score(
        payment[
            "failure_reason"
        ]
    )

    timing_score = calculate_timing_score(
        customer,
        action_time
    )

    action_score = get_action_score(
        action,
        payment[
            "failure_reason"
        ]
    )

    attempt_penalty = (
        0.90 ** (
            attempt_number - 1
        )
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
    timing,
    attempt_number,
    probability
):

    seed_string = (
        f"{payment_id}|"
        f"{action}|"
        f"{timing}|"
        f"{attempt_number}"
    )

    seed = sum(
        ord(char)
        for char in seed_string
    )

    rng = random.Random(seed)

    return (
        rng.random()
        < probability
    )


# ============================================================
# RUN BASELINE
# ============================================================

def run_baseline(
    payment,
    customer
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    attempts = 0

    baseline_schedule = [
        1,
        25
    ]

    for timing in baseline_schedule:

        attempts += 1

        action = "SMART_RETRY"

        action_time = (
            failure_time
            + timedelta(
                hours=timing
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
            payment[
                "payment_id"
            ],
            action,
            timing,
            attempts,
            probability
        )

        if recovered:

            return {
                "recovered": True,
                "amount":
                    float(
                        payment[
                            "amount"
                        ]
                    ),
                "attempts":
                    attempts,
                "action":
                    action,
                "timing":
                    timing
            }

    return {
        "recovered": False,
        "amount": 0.0,
        "attempts":
            attempts,
        "action":
            "STOP",
        "timing":
            0
    }


# ============================================================
# CREATE ALL RECOUP CANDIDATES
# ============================================================

def create_recoup_candidates(
    payments,
    customers
):

    candidates = []

    for payment in payments:

        customer = customers[
            payment[
                "customer_id"
            ]
        ]

        for action in ACTIONS:

            for timing in TIMINGS:

                model_input, attempt_time = (
                    create_candidate(
                        payment,
                        customer,
                        action,
                        timing
                    )
                )

                candidates.append({

                    "payment_id":
                        payment[
                            "payment_id"
                        ],

                    "amount":
                        float(
                            payment[
                                "amount"
                            ]
                        ),

                    "action":
                        action,

                    "timing":
                        timing,

                    "attempt_time":
                        attempt_time,

                    "model_input":
                        model_input
                })

    return candidates


# ============================================================
# RUN ML RECOUP
# ============================================================

def run_recoup(
    payments,
    customers,
    model
):

    print(
        "\nCreating ML candidates..."
    )

    candidates = create_recoup_candidates(
        payments,
        customers
    )

    print(
        f"Candidates created : "
        f"{len(candidates)}"
    )

    # --------------------------------------------------------
    # Build ONE DataFrame for all candidates
    # --------------------------------------------------------

    model_inputs = pd.DataFrame(
        [
            candidate[
                "model_input"
            ]
            for candidate in candidates
        ]
    )

    print(
        "Running batch ML prediction..."
    )

    probabilities = (
        model.predict_proba(
            model_inputs
        )[:, 1]
    )

    print(
        "ML prediction complete."
    )

    # --------------------------------------------------------
    # Attach predictions
    # --------------------------------------------------------

    for index, candidate in enumerate(
        candidates
    ):

        probability = float(
            probabilities[index]
        )

        candidate[
            "probability"
        ] = probability

        candidate[
            "expected_recovery"
        ] = (
            candidate[
                "amount"
            ]
            * probability
            - ACTION_COSTS[
                candidate[
                    "action"
                ]
            ]
        )

    # --------------------------------------------------------
    # Group candidates by payment
    # --------------------------------------------------------

    payment_candidates = {}

    for candidate in candidates:

        payment_id = candidate[
            "payment_id"
        ]

        if payment_id not in payment_candidates:

            payment_candidates[
                payment_id
            ] = []

        payment_candidates[
            payment_id
        ].append(candidate)

    return payment_candidates


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 65)
    print("          RECOUP ML EVALUATION")
    print("=" * 65)

    # --------------------------------------------------------
    # Load data
    # --------------------------------------------------------

    customers = load_customers()

    payments = load_payments()

    print(
        f"\nEvaluation payments : "
        f"{len(payments)}"
    )

    # --------------------------------------------------------
    # Load model
    # --------------------------------------------------------

    print(
        "\nLoading trained ML model..."
    )

    model = joblib.load(
        MODEL_FILE
    )

    # IMPORTANT:
    # Prevent nested multiprocessing during
    # evaluation.

    if hasattr(
        model,
        "named_steps"
    ):

        if "model" in model.named_steps:

            model.named_steps[
                "model"
            ].set_params(
                n_jobs=1
            )

    print(
        "ML model loaded successfully."
    )

    # --------------------------------------------------------
    # Run ML Recoup predictions
    # --------------------------------------------------------

    payment_candidates = run_recoup(
        payments,
        customers,
        model
    )

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    baseline_recovered = 0
    baseline_amount = 0.0
    baseline_attempts = 0

    recoup_recovered = 0
    recoup_amount = 0.0
    recoup_attempts = 0

    results = []

    print(
        "\nEvaluating payment outcomes..."
    )

    for index, payment in enumerate(
        payments
    ):

        customer = customers[
            payment[
                "customer_id"
            ]
        ]

        payment_id = payment[
            "payment_id"
        ]

        # ----------------------------------------------------
        # BASELINE
        # ----------------------------------------------------

        baseline = run_baseline(
            payment,
            customer
        )

        if baseline[
            "recovered"
        ]:

            baseline_recovered += 1

            baseline_amount += (
                baseline[
                    "amount"
                ]
            )

        baseline_attempts += (
            baseline[
                "attempts"
            ]
        )

        # ----------------------------------------------------
        # RECOUP
        # ----------------------------------------------------

        candidates = payment_candidates[
            payment_id
        ]

        best = max(
            candidates,
            key=lambda x:
                x[
                    "expected_recovery"
                ]
        )

        recoup_recovered_bool = (
            deterministic_outcome(
                payment_id,
                best["action"],
                best["timing"],
                1,
                best["probability"]
            )
        )

        if recoup_recovered_bool:

            recoup_recovered += 1

            recoup_amount += float(
                payment[
                    "amount"
                ]
            )

        recoup_attempts += 1

        # ----------------------------------------------------
        # Store result
        # ----------------------------------------------------

        results.append({

            "payment_id":
                payment_id,

            "amount":
                payment[
                    "amount"
                ],

            "failure_reason":
                payment[
                    "failure_reason"
                ],

            "baseline_recovered":
                baseline[
                    "recovered"
                ],

            "baseline_action":
                baseline[
                    "action"
                ],

            "baseline_timing":
                baseline[
                    "timing"
                ],

            "baseline_attempts":
                baseline[
                    "attempts"
                ],

            "recoup_recovered":
                recoup_recovered_bool,

            "recoup_action":
                best[
                    "action"
                ],

            "recoup_timing":
                best[
                    "timing"
                ],

            "recoup_probability":
                best[
                    "probability"
                ],

            "recoup_expected_recovery":
                best[
                    "expected_recovery"
                ],

            "recoup_attempts":
                1
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
    # CALCULATE FINAL METRICS
    # ========================================================

    total = len(payments)

    baseline_rate = (
        baseline_recovered
        / total
        * 100
    )

    recoup_rate = (
        recoup_recovered
        / total
        * 100
    )

    baseline_avg_attempts = (
        baseline_attempts
        / total
    )

    recoup_avg_attempts = (
        recoup_attempts
        / total
    )

    additional_recovery = (
        recoup_amount
        - baseline_amount
    )

    recovery_uplift = (
        recoup_rate
        - baseline_rate
    )

    relative_money_uplift = 0.0

    if baseline_amount > 0:

        relative_money_uplift = (
            (
                recoup_amount
                - baseline_amount
            )
            / baseline_amount
            * 100
        )

    # ========================================================
    # SAVE RESULTS
    # ========================================================

    with open(
        RESULT_FILE,
        "w",
        newline=""
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=results[0].keys()
        )

        writer.writeheader()

        writer.writerows(
            results
        )

    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print(
        "\n" + "=" * 65
    )

    print(
        "                    RESULTS"
    )

    print(
        "=" * 65
    )

    print(
        "\nBASELINE"
    )

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

    print(
        "\nML-POWERED RECOUP"
    )

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

    print(
        "\nIMPROVEMENT"
    )

    print(
        f"Additional ₹ recovered : "
        f"₹{additional_recovery:,.2f}"
    )

    print(
        f"Recovery rate uplift   : "
        f"{recovery_uplift:.2f} "
        f"percentage points"
    )

    print(
        f"Relative money uplift  : "
        f"{relative_money_uplift:.2f}%"
    )

    print(
        "\nResults saved to:"
    )

    print(
        f"  {RESULT_FILE}"
    )

    print(
        "\nML evaluation complete."
    )


if __name__ == "__main__":

    main()