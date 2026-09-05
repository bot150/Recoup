# ============================================================
# Recoup Decision Engine
# ============================================================

ACTIONS = [
    "SMART_RETRY",
    "PAYMENT_LINK",
    "NUDGE"
]


# ============================================================
# ACTION COSTS
# ============================================================

ACTION_COSTS = {
    "SMART_RETRY": 0.50,
    "PAYMENT_LINK": 1.00,
    "NUDGE": 0.20
}


# ============================================================
# CALCULATE EXPECTED RECOVERY
# ============================================================

def calculate_expected_recovery(
    amount,
    probability,
    action
):

    action_cost = ACTION_COSTS[action]

    expected_recovery = (
        amount * probability
    ) - action_cost

    return expected_recovery


# ============================================================
# CHOOSE BEST ACTION
#
# Existing function kept unchanged for compatibility.
# ============================================================

def choose_best_action(
    amount,
    predictions
):

    candidates = []

    for action in ACTIONS:

        probability = predictions[action]

        expected_recovery = (
            calculate_expected_recovery(
                amount=amount,
                probability=probability,
                action=action
            )
        )

        candidates.append({

            "action":
                action,

            "probability":
                probability,

            "expected_recovery":
                expected_recovery
        })


    best = max(
        candidates,
        key=lambda x: x["expected_recovery"]
    )

    return best, candidates


# ============================================================
# CHOOSE BEST ACTION + TIMING
#
# This is the improved decision function.
#
# Every action/timing combination becomes a candidate.
# The candidate with the highest expected recovery wins.
# ============================================================

def choose_best_action_with_timing(
    amount,
    candidates
):

    evaluated_candidates = []

    for candidate in candidates:

        action = candidate["action"]

        probability = candidate["probability"]

        expected_recovery = (
            calculate_expected_recovery(
                amount=amount,
                probability=probability,
                action=action
            )
        )

        evaluated_candidate = {
            **candidate,

            "expected_recovery":
                expected_recovery
        }

        evaluated_candidates.append(
            evaluated_candidate
        )


    # Highest expected recovery wins
    best = max(
        evaluated_candidates,
        key=lambda x: x["expected_recovery"]
    )

    return best, evaluated_candidates


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    payment_amount = 5000


    # Example candidates.
    # In the real system these probabilities
    # will come from the ML model.

    candidates = [

        {
            "action": "SMART_RETRY",
            "hours_after_failure": 1,
            "probability": 0.31
        },

        {
            "action": "SMART_RETRY",
            "hours_after_failure": 6,
            "probability": 0.42
        },

        {
            "action": "PAYMENT_LINK",
            "hours_after_failure": 1,
            "probability": 0.48
        },

        {
            "action": "PAYMENT_LINK",
            "hours_after_failure": 24,
            "probability": 0.55
        },

        {
            "action": "NUDGE",
            "hours_after_failure": 1,
            "probability": 0.57
        },

        {
            "action": "NUDGE",
            "hours_after_failure": 12,
            "probability": 0.63
        }
    ]


    best, evaluated_candidates = (
        choose_best_action_with_timing(
            amount=payment_amount,
            candidates=candidates
        )
    )


    print("======================================")
    print("       Recoup Decision Engine")
    print("======================================")

    print()

    print(
        f"Payment amount: ₹{payment_amount:,.2f}"
    )

    print()

    print("Candidate strategies:")

    for candidate in evaluated_candidates:

        print(
            f"{candidate['action']:15}"
            f" +{candidate['hours_after_failure']:>2}h"
            f" Probability: "
            f"{candidate['probability']:.2%}"
            f" | Expected recovery: "
            f"₹{candidate['expected_recovery']:,.2f}"
        )

    print()

    print("--------------------------------------")

    print(
        "SELECTED ACTION :",
        best["action"]
    )

    print(
        "SELECTED TIMING :",
        f"+{best['hours_after_failure']} hours"
    )

    print(
        "Probability     :",
        f"{best['probability']:.2%}"
    )

    print(
        "Expected recovery:",
        f"₹{best['expected_recovery']:,.2f}"
    )