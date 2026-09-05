import csv
import random
from datetime import datetime, timedelta


# ============================================================
# CONFIGURATION
# ============================================================

random.seed(100)


# ============================================================
# LOAD CUSTOMERS
# ============================================================

def load_customers():

    customers = {}

    with open(
        "data/customers.csv",
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:
            customers[row["customer_id"]] = row

    return customers


# ============================================================
# TIMING SCORE
# ============================================================

def calculate_timing_score(customer, action_time):

    preferred_hour = int(
        customer["typical_payment_hour"]
    )

    hour_difference = abs(
        action_time.hour - preferred_hour
    )

    # Circular clock distance.
    # Example: 23:00 and 01:00 are only 2 hours apart.
    hour_difference = min(
        hour_difference,
        24 - hour_difference
    )

    if hour_difference == 0:
        time_score = 1.00

    elif hour_difference == 1:
        time_score = 0.95

    elif hour_difference <= 2:
        time_score = 0.85

    elif hour_difference <= 4:
        time_score = 0.65

    elif hour_difference <= 7:
        time_score = 0.45

    else:
        time_score = 0.25


    # --------------------------------------------------------
    # DAY SCORE
    # --------------------------------------------------------

    frequency = customer["payment_frequency"]

    if frequency in ["weekly", "biweekly"]:

        preferred_weekday = int(
            customer["preferred_weekday"]
        )

        difference = abs(
            action_time.weekday()
            - preferred_weekday
        )

        difference = min(
            difference,
            7 - difference
        )

        if difference == 0:
            day_score = 1.00

        elif difference == 1:
            day_score = 0.85

        elif difference == 2:
            day_score = 0.65

        else:
            day_score = 0.40

    else:

        preferred_day = int(
            customer["preferred_payment_day"]
        )

        difference = abs(
            action_time.day
            - preferred_day
        )

        if difference == 0:
            day_score = 1.00

        elif difference <= 2:
            day_score = 0.85

        elif difference <= 5:
            day_score = 0.65

        elif difference <= 10:
            day_score = 0.45

        else:
            day_score = 0.25


    return (
        time_score * 0.55
        + day_score * 0.45
    )


# ============================================================
# FAILURE REASON BASE PROBABILITY
# ============================================================

def get_failure_score(failure_reason):

    scores = {

        # Temporary issue: retry is often useful
        "BANK_ERROR": 0.70,

        # Payment may succeed when customer has funds later
        "INSUFFICIENT_FUNDS": 0.55,

        # Existing payment mechanism may be broken
        "MANDATE_FAILURE": 0.45,

        # We know very little
        "UNKNOWN": 0.30
    }

    return scores.get(
        failure_reason,
        0.30
    )


# ============================================================
# ACTION / FAILURE COMPATIBILITY
# ============================================================

def get_action_score(
    action,
    failure_reason
):

    # --------------------------------------------------------
    # BANK ERROR
    # --------------------------------------------------------

    if failure_reason == "BANK_ERROR":

        scores = {
            "SMART_RETRY": 1.00,
            "PAYMENT_LINK": 0.65,
            "NUDGE": 0.45
        }

        return scores.get(action, 0.0)


    # --------------------------------------------------------
    # INSUFFICIENT FUNDS
    # --------------------------------------------------------

    if failure_reason == "INSUFFICIENT_FUNDS":

        scores = {
            "SMART_RETRY": 0.75,
            "PAYMENT_LINK": 0.65,
            "NUDGE": 1.00
        }

        return scores.get(action, 0.0)


    # --------------------------------------------------------
    # MANDATE FAILURE
    # --------------------------------------------------------

    if failure_reason == "MANDATE_FAILURE":

        scores = {
            "SMART_RETRY": 0.35,
            "PAYMENT_LINK": 1.00,
            "NUDGE": 0.55
        }

        return scores.get(action, 0.0)


    # --------------------------------------------------------
    # UNKNOWN
    # --------------------------------------------------------

    if failure_reason == "UNKNOWN":

        scores = {
            "SMART_RETRY": 0.45,
            "PAYMENT_LINK": 0.55,
            "NUDGE": 0.40
        }

        return scores.get(action, 0.0)


    return 0.30


# ============================================================
# ATTEMPT PENALTY
# ============================================================

def get_attempt_penalty(attempt_number):

    return 0.90 ** (attempt_number - 1)


# ============================================================
# SIMULATE RECOVERY
# ============================================================

def simulate_recovery(
    payment,
    customer,
    action,
    action_time,
    attempt_number=1
):

    if action == "STOP":

        return {
            "result": "STOPPED",
            "recovered_amount": 0.0,
            "recovery_time": "",
            "success_probability": 0.0
        }


    # --------------------------------------------------------
    # COMPONENTS
    # --------------------------------------------------------

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

    attempt_penalty = get_attempt_penalty(
        attempt_number
    )


    # --------------------------------------------------------
    # FINAL PROBABILITY
    # --------------------------------------------------------

    probability = (
        failure_score
        * timing_score
        * action_score
        * attempt_penalty
    )

    probability = min(
        max(probability, 0.02),
        0.95
    )


    # --------------------------------------------------------
    # DETERMINE OUTCOME
    # --------------------------------------------------------

    if random.random() < probability:

        recovery_delay = random.randint(
            5,
            60
        )

        recovery_time = (
            action_time
            + timedelta(minutes=recovery_delay)
        )

        return {
            "result": "RECOVERED",
            "recovered_amount":
                float(payment["amount"]),
            "recovery_time":
                recovery_time.strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
            "success_probability":
                round(probability, 4)
        }


    return {
        "result": "NOT_RECOVERED",
        "recovered_amount": 0.0,
        "recovery_time": "",
        "success_probability":
            round(probability, 4)
    }


# ============================================================
# QUICK TEST
# ============================================================

def get_first_failed_payment():

    with open(
        "data/payments.csv",
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            if row["status"] == "FAILED":
                return row

    return None


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    customers = load_customers()

    payment = get_first_failed_payment()

    if payment is None:

        print("No failed payment found.")

    else:

        customer = customers[
            payment["customer_id"]
        ]

        payment_time = datetime.strptime(
            payment["timestamp"],
            "%Y-%m-%d %H:%M:%S"
        )

        action_time = (
            payment_time
            + timedelta(hours=24)
        )

        result = simulate_recovery(
            payment=payment,
            customer=customer,
            action="SMART_RETRY",
            action_time=action_time,
            attempt_number=1
        )

        print("======================================")
        print("       Recoup Recovery Simulator")
        print("======================================")

        print()
        print(
            "Payment ID       :",
            payment["payment_id"]
        )

        print(
            "Customer ID      :",
            payment["customer_id"]
        )

        print(
            "Amount           :",
            payment["amount"]
        )

        print(
            "Failure reason   :",
            payment["failure_reason"]
        )

        print()
        print(
            "Action           : SMART_RETRY"
        )

        print(
            "Success probability :",
            result["success_probability"]
        )

        print(
            "Result              :",
            result["result"]
        )

        print(
            "Recovered amount    :",
            result["recovered_amount"]
        )

        print()
        print("Simulation complete!")