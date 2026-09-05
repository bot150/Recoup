import csv
import random
from datetime import datetime, timedelta


# ============================================================
# CONFIGURATION
# ============================================================

NUM_CUSTOMERS = 1000
PAYMENTS_PER_CUSTOMER = 20

random.seed(42)


# ============================================================
# BASIC OPTIONS
# ============================================================

PAYMENT_METHODS = [
    "UPI",
    "CARD",
    "NETBANKING",
    "WALLET"
]

FAILURE_REASONS = [
    "INSUFFICIENT_FUNDS",
    "BANK_ERROR",
    "MANDATE_FAILURE",
    "UNKNOWN"
]


# ============================================================
# CREATE CUSTOMERS
# ============================================================

customers = []

for i in range(1, NUM_CUSTOMERS + 1):

    customer_id = f"CUST_{i:05d}"

    # Typical amount this customer pays
    avg_payment_amount = round(
        random.uniform(300, 5000),
        2
    )

    # How frequently the customer normally pays
    payment_frequency = random.choice([
        "weekly",
        "biweekly",
        "monthly"
    ])

    # Customer's preferred payment method
    preferred_method = random.choice(
        PAYMENT_METHODS
    )

    # For monthly customers
    preferred_payment_day = random.randint(1, 28)

    # For weekly / biweekly customers
    preferred_weekday = random.randint(0, 6)

    # How much the payment day can vary
    payment_day_variance = random.randint(0, 2)

    # Typical hour at which customer pays
    typical_payment_hour = random.randint(8, 21)

    customers.append({
        "customer_id": customer_id,
        "avg_payment_amount": avg_payment_amount,
        "payment_frequency": payment_frequency,
        "preferred_method": preferred_method,
        "preferred_payment_day": preferred_payment_day,
        "preferred_weekday": preferred_weekday,
        "payment_day_variance": payment_day_variance,
        "typical_payment_hour": typical_payment_hour,
        "successful_payments": 0,
        "failed_payments": 0
    })


# ============================================================
# CREATE HISTORICAL PAYMENTS
# ============================================================

payments = []

payment_id = 1

# We create history over roughly 18 months
start_date = datetime(2025, 1, 1)


for customer in customers:

    frequency = customer["payment_frequency"]

    # Determine the approximate gap between payments
    if frequency == "weekly":
        payment_gap = 7

    elif frequency == "biweekly":
        payment_gap = 14

    else:
        payment_gap = 30

    # Start at a random point in the historical period
    current_date = start_date + timedelta(
        days=random.randint(0, 20)
    )

    for _ in range(PAYMENTS_PER_CUSTOMER):

        # ----------------------------------------------------
        # PAYMENT DATE
        # ----------------------------------------------------

        if frequency in ["weekly", "biweekly"]:

            # Move toward the customer's preferred weekday
            days_until_preferred = (
                customer["preferred_weekday"]
                - current_date.weekday()
            ) % 7

            current_date += timedelta(
                days=days_until_preferred
            )

        else:

            # Monthly customers pay around their
            # preferred day of the month.
            year = current_date.year
            month = current_date.month

            preferred_day = (
                customer["preferred_payment_day"]
                + random.randint(
                    -customer["payment_day_variance"],
                    customer["payment_day_variance"]
                )
            )

            preferred_day = max(
                1,
                min(preferred_day, 28)
            )

            current_date = datetime(
                year,
                month,
                preferred_day
            )

        # ----------------------------------------------------
        # PAYMENT TIME
        # ----------------------------------------------------

        hour = customer["typical_payment_hour"]

        # Usually within ±1 hour of normal time
        hour_variation = random.choice([-1, 0, 0, 0, 1])

        hour = max(
            0,
            min(23, hour + hour_variation)
        )

        minute = random.randint(0, 59)

        timestamp = current_date.replace(
            hour=hour,
            minute=minute,
            second=0
        )

        # ----------------------------------------------------
        # PAYMENT AMOUNT
        # ----------------------------------------------------

        amount = round(
            random.uniform(
                customer["avg_payment_amount"] * 0.8,
                customer["avg_payment_amount"] * 1.2
            ),
            2
        )

        # ----------------------------------------------------
        # PAYMENT METHOD
        # ----------------------------------------------------

        # Customer usually uses their preferred method
        if random.random() < 0.75:

            payment_method = customer[
                "preferred_method"
            ]

        else:

            other_methods = [
                method
                for method in PAYMENT_METHODS
                if method != customer["preferred_method"]
            ]

            payment_method = random.choice(
                other_methods
            )

        # ----------------------------------------------------
        # PAYMENT RESULT
        # ----------------------------------------------------

        status = random.choices(
            ["SUCCESS", "FAILED"],
            weights=[0.85, 0.15]
        )[0]

        failure_reason = ""

        if status == "FAILED":

            failure_reason = random.choice(
                FAILURE_REASONS
            )

            customer["failed_payments"] += 1

        else:

            customer["successful_payments"] += 1

        # ----------------------------------------------------
        # STORE PAYMENT
        # ----------------------------------------------------

        payments.append({
            "payment_id": f"PAY_{payment_id:06d}",
            "customer_id": customer["customer_id"],
            "amount": amount,
            "timestamp": timestamp.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "payment_method": payment_method,
            "status": status,
            "failure_reason": failure_reason,
            "attempt_number": 1
        })

        payment_id += 1

        # Move forward according to frequency
        current_date += timedelta(
            days=payment_gap
        )


# ============================================================
# SAVE CUSTOMER DATA
# ============================================================

with open(
    "data/customers.csv",
    "w",
    newline=""
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=customers[0].keys()
    )

    writer.writeheader()
    writer.writerows(customers)


# ============================================================
# SAVE PAYMENT DATA
# ============================================================

with open(
    "data/payments.csv",
    "w",
    newline=""
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=payments[0].keys()
    )

    writer.writeheader()
    writer.writerows(payments)


# ============================================================
# SUMMARY
# ============================================================

successful = sum(
    1
    for payment in payments
    if payment["status"] == "SUCCESS"
)

failed = sum(
    1
    for payment in payments
    if payment["status"] == "FAILED"
)


print("======================================")
print("       RecoverOS Data Generator")
print("======================================")

print(f"Customers generated : {len(customers)}")
print(f"Payments generated  : {len(payments)}")
print(f"Successful payments : {successful}")
print(f"Failed payments     : {failed}")

print()
print("Files created:")
print("  data/customers.csv")
print("  data/payments.csv")

print()
print("Data generation complete!")