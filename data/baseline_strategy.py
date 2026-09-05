import csv
from datetime import datetime, timedelta

from recovery_simulator import (
    load_customers,
    simulate_recovery
)


# ============================================================
# LOAD FAILED PAYMENTS
# ============================================================

def load_failed_payments():

    failed_payments = []

    with open(
        "data/payments.csv",
        "r",
        newline=""
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            if row["status"] == "FAILED":

                failed_payments.append(row)

    return failed_payments


# ============================================================
# RUN BASELINE STRATEGY
# ============================================================

def run_baseline():

    customers = load_customers()

    failed_payments = load_failed_payments()

    total_failed = len(failed_payments)

    total_recovered = 0.0

    total_attempts = 0

    recovered_count = 0

    results = []


    # --------------------------------------------------------
    # PROCESS EVERY FAILED PAYMENT
    # --------------------------------------------------------

    for payment in failed_payments:

        customer = customers[
            payment["customer_id"]
        ]

        failure_time = datetime.strptime(
            payment["timestamp"],
            "%Y-%m-%d %H:%M:%S"
        )


        recovered = False

        # ====================================================
        # ATTEMPT 1
        # ====================================================

        attempt_time = (
            failure_time
            + timedelta(hours=1)
        )

        result = simulate_recovery(
            payment=payment,
            customer=customer,
            action="SMART_RETRY",
            action_time=attempt_time,
            attempt_number=1
        )

        total_attempts += 1

        if result["result"] == "RECOVERED":

            recovered = True

            total_recovered += float(
                result["recovered_amount"]
            )

            recovered_count += 1

            results.append({
                "payment_id": payment["payment_id"],
                "result": "RECOVERED",
                "attempts": 1,
                "recovered_amount":
                    result["recovered_amount"]
            })


        # ====================================================
        # ATTEMPT 2
        # ====================================================

        if not recovered:

            attempt_time = (
                failure_time
                + timedelta(hours=25)
            )

            result = simulate_recovery(
                payment=payment,
                customer=customer,
                action="SMART_RETRY",
                action_time=attempt_time,
                attempt_number=2
            )

            total_attempts += 1

            if result["result"] == "RECOVERED":

                recovered = True

                total_recovered += float(
                    result["recovered_amount"]
                )

                recovered_count += 1

                results.append({
                    "payment_id": payment["payment_id"],
                    "result": "RECOVERED",
                    "attempts": 2,
                    "recovered_amount":
                        result["recovered_amount"]
                })


        # ====================================================
        # NOT RECOVERED
        # ====================================================

        if not recovered:

            results.append({
                "payment_id": payment["payment_id"],
                "result": "NOT_RECOVERED",
                "attempts":
                    2,
                "recovered_amount":
                    0.0
            })


    # ========================================================
    # CALCULATE METRICS
    # ========================================================

    recovery_rate = (
        recovered_count / total_failed * 100
    )

    average_recovery_per_failed = (
        total_recovered / total_failed
    )

    average_attempts = (
        total_attempts / total_failed
    )


    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print("======================================")
    print("       RecoverOS Baseline")
    print("======================================")

    print()

    print(
        f"Failed payments      : {total_failed}"
    )

    print(
        f"Recovered payments   : {recovered_count}"
    )

    print(
        f"Recovery rate        : "
        f"{recovery_rate:.2f}%"
    )

    print(
        f"Total recovered ₹    : "
        f"{total_recovered:,.2f}"
    )

    print(
        f"Avg recovery/failed ₹: "
        f"{average_recovery_per_failed:,.2f}"
    )

    print(
        f"Average attempts     : "
        f"{average_attempts:.2f}"
    )

    print()

    print("Baseline evaluation complete!")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    run_baseline()