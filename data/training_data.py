import csv
import random
from datetime import datetime, timedelta

from recovery_simulator import simulate_recovery


INPUT_FILE = "data/payments.csv"
CUSTOMER_FILE = "data/customers.csv"

TRAINING_OUTPUT = "data/recovery_training.csv"
EVALUATION_OUTPUT = "data/evaluation_payments.csv"

RANDOM_SEED = 42

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


def load_customers():
    customers = {}

    with open(CUSTOMER_FILE, "r", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            customers[row["customer_id"]] = row

    return customers


def load_failed_payments():
    failed_payments = []

    with open(INPUT_FILE, "r", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            if row["status"] == "FAILED":
                failed_payments.append(row)

    return failed_payments


def create_train_test_split(payments):
    random.seed(RANDOM_SEED)

    random.shuffle(payments)

    split_index = int(len(payments) * 0.8)

    train_payments = payments[:split_index]
    test_payments = payments[split_index:]

    return train_payments, test_payments

def generate_training_data(payments, customers):
    rows = []

    for payment in payments:

        customer = customers[payment["customer_id"]]

        failure_time = datetime.fromisoformat(
            payment["timestamp"]
        )

        for attempt_number in [1, 2]:

            for action in ACTIONS:

                for hours_after_failure in TIMINGS:

                    attempt_time = failure_time + timedelta(
                        hours=hours_after_failure
                    )

                    result = simulate_recovery(
                        payment=payment,
                        customer=customer,
                        action=action,
                        action_time=attempt_time,
                        attempt_number=attempt_number
                    )

                    hour_difference = abs(
                        attempt_time.hour
                        - int(customer["typical_payment_hour"])
                    )

                    rows.append({
                        "payment_id": payment["payment_id"],
                        "customer_id": payment["customer_id"],
                        "amount": payment["amount"],
                        "failure_reason": payment["failure_reason"],
                        "payment_method": payment["payment_method"],
                        "payment_frequency": customer["payment_frequency"],
                        "preferred_method": customer["preferred_method"],
                        "typical_payment_hour": customer["typical_payment_hour"],
                        "attempt_hour": attempt_time.hour,
                        "hour_difference": hour_difference,
                        "hours_after_failure": hours_after_failure,
                        "attempt_number": attempt_number,
                        "action": action,

                        "recovered": (
                            1
                            if result["result"] == "RECOVERED"
                            else 0
                        )
                    })

    return rows

def save_csv(filename, rows):

    if not rows:
        return

    fieldnames = rows[0].keys()

    with open(filename, "w", newline="") as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(rows)


def save_evaluation_payments(filename, payments):

    if not payments:
        return

    fieldnames = payments[0].keys()

    with open(filename, "w", newline="") as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(payments)


def main():

    print("=" * 50)
    print("          Recoup Training Data Generator")
    print("=" * 50)

    # Load customer information
    customers = load_customers()

    # Load failed payments
    failed_payments = load_failed_payments()

    print(f"\nFailed payments found : {len(failed_payments)}")

    # Create proper train/test split
    train_payments, test_payments = create_train_test_split(
        failed_payments
    )

    print(f"Training payments     : {len(train_payments)}")
    print(f"Evaluation payments   : {len(test_payments)}")

    # Generate ML training scenarios ONLY
    # from training payments
    training_rows = generate_training_data(
        train_payments,
        customers
    )

    # Save training data
    save_csv(
        TRAINING_OUTPUT,
        training_rows
    )

    # Save completely unseen evaluation payments
    save_evaluation_payments(
        EVALUATION_OUTPUT,
        test_payments
    )

    # Count recovered examples
    recovered = sum(
        int(row["recovered"])
        for row in training_rows
    )

    failed = len(training_rows) - recovered

    print(f"\nTraining examples     : {len(training_rows)}")
    print(f"Recovered examples    : {recovered}")
    print(f"Failed examples       : {failed}")

    print("\nFiles created:")
    print(f"  {TRAINING_OUTPUT}")
    print(f"  {EVALUATION_OUTPUT}")

    print("\nRecoup training dataset ready.")


if __name__ == "__main__":
    main()