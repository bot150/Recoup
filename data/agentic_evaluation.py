import os
import sys
import csv
import random
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
# PROJECT IMPORTS
# ============================================================

from backend.decision_engine import choose_best_action
from backend.policy_engine import check_policy
from backend.audit_logger import log_decision

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
    "agentic_evaluation_results.csv"
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

MAX_AGENT_ROUNDS = 2


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
# CREATE MODEL INPUT
# ============================================================

def create_model_input(
    payment,
    customer,
    action,
    timing,
    attempt_number
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

    return {

        "amount":
            float(
                payment["amount"]
            ),

        "failure_reason":
            payment["failure_reason"],

        "payment_method":
            payment["payment_method"],

        "payment_frequency":
            customer["payment_frequency"],

        "preferred_method":
            customer["preferred_method"],

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
            attempt_number,

        "action":
            action
    }


# ============================================================
# TRUE SIMULATOR PROBABILITY
# ============================================================

def calculate_true_probability(
    payment,
    customer,
    action,
    action_time,
    attempt_number
):

    failure_score = get_failure_score(
        payment["failure_reason"]
    )

    timing_score = calculate_timing_score(
        customer,
        action_time
    )

    action_score = get_action_score(
        action,
        payment["failure_reason"]
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
# GENERATE VALID CANDIDATES
# ============================================================

def generate_candidates(
    payment,
    customer,
    model,
    attempt_number,
    last_action_time
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    candidates = []

    for action in ACTIONS:

        for timing in TIMINGS:

            action_time = (
                failure_time
                + timedelta(
                    hours=timing
                )
            )

            # ------------------------------------------------
            # Don't schedule an action before the previous one
            # ------------------------------------------------

            if last_action_time is not None:

                hours_since_last = (
                    action_time
                    - last_action_time
                ).total_seconds() / 3600

                if hours_since_last < 6:

                    continue


            # ------------------------------------------------
            # Don't go beyond recovery window
            # ------------------------------------------------

            hours_from_failure = (
                action_time
                - failure_time
            ).total_seconds() / 3600

            if hours_from_failure > (
                7 * 24
            ):

                continue


            model_input = create_model_input(
                payment,
                customer,
                action,
                timing,
                attempt_number
            )

            input_df = pd.DataFrame(
                [model_input]
            )

            probability = float(
                model.predict_proba(
                    input_df
                )[0][1]
            )

            expected_recovery = (
                float(
                    payment["amount"]
                )
                * probability
                - ACTION_COSTS[action]
            )

            candidates.append({

                "action":
                    action,

                "timing":
                    timing,

                "attempt_time":
                    action_time,

                "probability":
                    probability,

                "expected_recovery":
                    expected_recovery
            })

    return candidates


# ============================================================
# CHOOSE BEST STRATEGY
# ============================================================

def choose_strategy(
    payment,
    candidates
):

    if not candidates:

        return None

    # Find the best timing for each action
    # according to the ML probability.

    best_per_action = {}

    for action in ACTIONS:

        action_candidates = [
            candidate
            for candidate in candidates
            if candidate["action"] == action
        ]

        if action_candidates:

            best_candidate = max(
                action_candidates,
                key=lambda x:
                    x["probability"]
            )

            best_per_action[
                action
            ] = best_candidate[
                "probability"
            ]


    if not best_per_action:

        return None


    # Use the actual Decision Engine.

    best_action, decision_candidates = (
        choose_best_action(
            amount=float(
                payment["amount"]
            ),
            predictions=best_per_action
        )
    )


    selected_action = best_action[
        "action"
    ]


    # Find the selected action's best timing.

    selected_candidates = [
        candidate
        for candidate in candidates
        if candidate["action"]
        == selected_action
    ]

    selected = max(
        selected_candidates,
        key=lambda x:
            x["probability"]
    )

    return selected


# ============================================================
# RUN ONE AGENTIC PAYMENT
# ============================================================

def run_agent(
    payment,
    customer,
    model
):

    failure_time = datetime.fromisoformat(
        payment["timestamp"]
    )

    attempt_count = 0
    nudge_count = 0

    last_action_time = None

    action_history = []

    total_recovered = 0.0

    final_outcome = "STOP"

    # --------------------------------------------------------
    # Agent loop
    # --------------------------------------------------------

    for round_number in range(
        1,
        MAX_AGENT_ROUNDS + 1
    ):

        attempt_number = (
            round_number
        )

        # --------------------------------------------
        # Generate candidates
        # --------------------------------------------

        candidates = generate_candidates(
            payment,
            customer,
            model,
            attempt_number,
            last_action_time
        )

        # --------------------------------------------
        # Choose strategy
        # --------------------------------------------

        selected = choose_strategy(
            payment,
            candidates
        )

        # No valid strategy
        if selected is None:

            final_outcome = "STOP"

            break


        action = selected[
            "action"
        ]

        timing = selected[
            "timing"
        ]

        action_time = selected[
            "attempt_time"
        ]

        probability = selected[
            "probability"
        ]

        # --------------------------------------------
        # Policy Engine
        # --------------------------------------------

        policy_result = check_policy(

            action=action,

            attempt_count=attempt_count,

            nudge_count=nudge_count,

            last_action_time=last_action_time,

            current_time=action_time,

            failure_time=failure_time
        )


        # --------------------------------------------
        # If policy blocks, stop
        # --------------------------------------------

        if not policy_result[
            "allowed"
        ]:

            action_history.append({

                "round":
                    round_number,

                "action":
                    action,

                "timing":
                    timing,

                "probability":
                    probability,

                "policy_allowed":
                    False,

                "outcome":
                    "BLOCKED",

                "recovered_amount":
                    0.0
            })

            final_outcome = "BLOCKED"

            break


        # --------------------------------------------
        # Execute deterministic outcome
        # --------------------------------------------

        recovered = deterministic_outcome(

            payment[
                "payment_id"
            ],

            action,

            timing,

            attempt_number,

            probability
        )


        if recovered:

            recovered_amount = float(
                payment["amount"]
            )

            outcome = "RECOVERED"

            total_recovered = (
                recovered_amount
            )

        else:

            recovered_amount = 0.0

            outcome = "NOT_RECOVERED"


        # --------------------------------------------
        # Record action
        # --------------------------------------------

        action_history.append({

            "round":
                round_number,

            "action":
                action,

            "timing":
                timing,

            "probability":
                probability,

            "policy_allowed":
                True,

            "outcome":
                outcome,

            "recovered_amount":
                recovered_amount
        })


        # --------------------------------------------
        # Update state
        # --------------------------------------------

        attempt_count += (
            1
            if action == "SMART_RETRY"
            else 0
        )

        nudge_count += (
            1
            if action == "NUDGE"
            else 0
        )

        last_action_time = (
            action_time
        )


        # --------------------------------------------
        # STOP if recovered
        # --------------------------------------------

        if recovered:

            final_outcome = "RECOVERED"

            break


        # --------------------------------------------
        # Continue only if another round exists
        # --------------------------------------------

        final_outcome = "NOT_RECOVERED"


    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {

        "recovered":
            total_recovered > 0,

        "amount":
            total_recovered,

        "attempts":
            len(action_history),

        "actions":
            action_history,

        "final_outcome":
            final_outcome
    }


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

    for timing in [1, 25]:

        attempts += 1

        action = "SMART_RETRY"

        action_time = (
            failure_time
            + timedelta(
                hours=timing
            )
        )

        probability = calculate_true_probability(
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

                "recovered":
                    True,

                "amount":
                    float(
                        payment["amount"]
                    ),

                "attempts":
                    attempts
            }


    return {

        "recovered":
            False,

        "amount":
            0.0,

        "attempts":
            attempts
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 65)
    print("       RECOUP AGENTIC EVALUATION")
    print("=" * 65)

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    customers = load_customers()

    payments = load_payments()

    print(
        f"\nEvaluation payments : "
        f"{len(payments)}"
    )

    # --------------------------------------------------------
    # Model
    # --------------------------------------------------------

    print(
        "\nLoading trained ML model..."
    )

    model = joblib.load(
        MODEL_FILE
    )

    # Prevent nested parallelism.

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
    # Metrics
    # --------------------------------------------------------

    baseline_recovered = 0
    baseline_amount = 0.0
    baseline_attempts = 0

    recoup_recovered = 0
    recoup_amount = 0.0
    recoup_attempts = 0

    policy_blocks = 0

    second_actions = 0

    results = []


    # --------------------------------------------------------
    # Process payments
    # --------------------------------------------------------

    print(
        "\nRunning agentic evaluation..."
    )

    for index, payment in enumerate(
        payments
    ):

        customer = customers[
            payment[
                "customer_id"
            ]
        ]


        # --------------------------------------------
        # Baseline
        # --------------------------------------------

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


        # --------------------------------------------
        # Recoup
        # --------------------------------------------

        recoup = run_agent(
            payment,
            customer,
            model
        )

        if recoup[
            "recovered"
        ]:

            recoup_recovered += 1

            recoup_amount += (
                recoup[
                    "amount"
                ]
            )

        recoup_attempts += (
            recoup[
                "attempts"
            ]
        )


        # Count policy blocks

        for action_record in recoup[
            "actions"
        ]:

            if not action_record[
                "policy_allowed"
            ]:

                policy_blocks += 1


        # Count second actions

        if recoup[
            "attempts"
        ] > 1:

            second_actions += 1


        # --------------------------------------------
        # Save result
        # --------------------------------------------

        first_action = ""
        first_timing = 0
        first_probability = 0.0

        second_action = ""
        second_timing = 0
        second_probability = 0.0

        if len(
            recoup["actions"]
        ) >= 1:

            first = recoup[
                "actions"
            ][0]

            first_action = first[
                "action"
            ]

            first_timing = first[
                "timing"
            ]

            first_probability = first[
                "probability"
            ]


        if len(
            recoup["actions"]
        ) >= 2:

            second = recoup[
                "actions"
            ][1]

            second_action = second[
                "action"
            ]

            second_timing = second[
                "timing"
            ]

            second_probability = second[
                "probability"
            ]


        results.append({

            "payment_id":
                payment[
                    "payment_id"
                ],

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

            "baseline_attempts":
                baseline[
                    "attempts"
                ],

            "recoup_recovered":
                recoup[
                    "recovered"
                ],

            "recoup_attempts":
                recoup[
                    "attempts"
                ],

            "first_action":
                first_action,

            "first_timing":
                first_timing,

            "first_probability":
                first_probability,

            "second_action":
                second_action,

            "second_timing":
                second_timing,

            "second_probability":
                second_probability,

            "final_outcome":
                recoup[
                    "final_outcome"
                ]
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

    money_uplift = 0.0

    if baseline_amount > 0:

        money_uplift = (
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
    # FINAL REPORT
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
        "\nAGENTIC RECOUP"
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
        "\nAGENT BEHAVIOR"
    )

    print(
        f"Second actions     : "
        f"{second_actions}"
    )

    print(
        f"Policy blocks      : "
        f"{policy_blocks}"
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
        f"{money_uplift:.2f}%"
    )


    print(
        "\nResults saved to:"
    )

    print(
        f"  {RESULT_FILE}"
    )

    print(
        "\nAgentic evaluation complete."
    )


if __name__ == "__main__":

    main()