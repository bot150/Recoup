# ============================================================
# RECOUP FASTAPI BACKEND
# ============================================================

import os
import sys
import csv
import uuid

import pandas as pd

from pydantic import BaseModel

from backend.recoup_agent import (
    load_customers,
    run_recoup
)

from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware


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
# FILE PATHS
# ============================================================

AUDIT_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "audit_log.csv"
)

EVALUATION_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "evaluation_payments.csv"
)

AGENTIC_RESULTS_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "agentic_evaluation_results.csv"
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Recoup API",
    description="Adaptive AI Revenue Recovery Agent",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# MOCK PAYMENT REQUEST
# ============================================================

class MockPaymentRequest(BaseModel):
    amount: float
    method: str = "UPI"
    failure_reason: str = "BANK_ERROR"


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "service": "Recoup",
        "status": "online",
        "description": "Adaptive AI Revenue Recovery Agent"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# AUDIT DATA
# ============================================================

@app.get("/api/audit")
def get_audit():

    if not os.path.exists(AUDIT_FILE):
        return {
            "records": []
        }

    df = pd.read_csv(AUDIT_FILE)

    df = df.fillna("")

    records = df.to_dict(
        orient="records"
    )

    return {
        "records": records
    }


# ============================================================
# RECENT AUDIT EVENTS
# ============================================================

@app.get("/api/audit/recent")
def get_recent_audit():

    if not os.path.exists(AUDIT_FILE):
        return {
            "records": []
        }

    df = pd.read_csv(AUDIT_FILE)

    df = df.fillna("")

    df = df.tail(20)

    return {
        "records": df.to_dict(
            orient="records"
        )
    }


# ============================================================
# EVALUATION PAYMENTS
# ============================================================

@app.get("/api/payments")
def get_payments():

    if not os.path.exists(EVALUATION_FILE):
        return {
            "payments": []
        }

    df = pd.read_csv(EVALUATION_FILE)

    df = df.fillna("")

    return {
        "payments": df.to_dict(
            orient="records"
        )
    }


# ============================================================
# AGENTIC EVALUATION RESULTS
# ============================================================

@app.get("/api/evaluation")
def get_evaluation():

    if not os.path.exists(AGENTIC_RESULTS_FILE):
        return {
            "results": []
        }

    df = pd.read_csv(
        AGENTIC_RESULTS_FILE
    )

    df = df.fillna("")

    return {
        "results": df.to_dict(
            orient="records"
        )
    }


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@app.get("/api/summary")
def get_summary():

    # Synthetic evaluation benchmark.
    # These are not production Razorpay results.

    baseline_recovered = 235
    baseline_rate = 38.84
    baseline_amount = 597783.55
    baseline_attempts = 1.69

    recoup_recovered = 515
    recoup_rate = 85.12
    recoup_amount = 1387407.84
    recoup_attempts = 1.25

    additional_amount = (
        recoup_amount
        - baseline_amount
    )

    rate_uplift = (
        recoup_rate
        - baseline_rate
    )

    money_uplift = (
        (
            recoup_amount
            - baseline_amount
        )
        / baseline_amount
    ) * 100

    return {
        "evaluation_payments": 605,

        "baseline": {
            "recovered_payments":
                baseline_recovered,

            "recovery_rate":
                baseline_rate,

            "total_recovered":
                baseline_amount,

            "average_attempts":
                baseline_attempts
        },

        "recoup": {
            "recovered_payments":
                recoup_recovered,

            "recovery_rate":
                recoup_rate,

            "total_recovered":
                recoup_amount,

            "average_attempts":
                recoup_attempts,

            "second_actions":
                151,

            "policy_blocks":
                0
        },

        "improvement": {
            "additional_recovered":
                round(
                    additional_amount,
                    2
                ),

            "recovery_rate_uplift":
                round(
                    rate_uplift,
                    2
                ),

            "relative_money_uplift":
                round(
                    money_uplift,
                    2
                )
        },

        "environment":
            "Synthetic evaluation environment"
    }


# ============================================================
# MOCK CHECKOUT - CREATE FAILED PAYMENT
# ============================================================

@app.post("/api/payments/mock-failure")
def create_mock_failure(
    request: MockPaymentRequest
):

    if not os.path.exists(
        EVALUATION_FILE
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Evaluation payments "
                "file not found."
            )
        )

    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Amount must be "
                "greater than zero."
            )
        )

    try:

        # Load existing payments
        df = pd.read_csv(
            EVALUATION_FILE
        )

        df = df.fillna("")

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No evaluation "
                    "payments found."
                )
            )

        # Use an existing payment as
        # the structure/template.
        template = df.iloc[0].to_dict()

        # Generate unique payment ID
        payment_id = (
            "MOCK_"
            + uuid.uuid4().hex[:8].upper()
        )

        new_payment = {}

        # Preserve exact CSV structure
        for column in df.columns:
            new_payment[column] = (
                template.get(column, "")
            )

        # ----------------------------------------------------
        # Payment ID
        # ----------------------------------------------------

        if "payment_id" in new_payment:
            new_payment["payment_id"] = (
                payment_id
            )

        # ----------------------------------------------------
        # Amount
        # ----------------------------------------------------

        if "amount" in new_payment:
            new_payment["amount"] = float(
                request.amount
            )

        # ----------------------------------------------------
        # Failure reason
        # ----------------------------------------------------

        if "failure_reason" in new_payment:
            new_payment["failure_reason"] = (
                request.failure_reason
            )

        # ----------------------------------------------------
        # Payment method
        # ----------------------------------------------------

        if "payment_method" in new_payment:
            new_payment["payment_method"] = (
                request.method
            )

        if "method" in new_payment:
            new_payment["method"] = (
                request.method
            )

        # ----------------------------------------------------
        # Status
        # ----------------------------------------------------

        if "status" in new_payment:
            new_payment["status"] = "FAILED"

        if "payment_status" in new_payment:
            new_payment["payment_status"] = "FAILED"

        # ----------------------------------------------------
        # Append new payment
        # ----------------------------------------------------

        new_row = pd.DataFrame(
            [new_payment],
            columns=df.columns
        )

        df = pd.concat(
            [df, new_row],
            ignore_index=True
        )

        # Save to CSV
        df.to_csv(
            EVALUATION_FILE,
            index=False
        )

        print(
            "[MOCK PAYMENT] "
            f"Created {payment_id} "
            f"for ₹{request.amount:.2f}"
        )

        return {
            "success": True,
            "payment": new_payment
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "[MOCK PAYMENT ERROR] "
            f"{str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# RECOVER PAYMENT
# ============================================================

@app.post("/api/recover/{payment_id}")
def recover_payment(payment_id: str):

    if not os.path.exists(
        EVALUATION_FILE
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Evaluation payments "
                "file not found."
            )
        )

    payments_df = pd.read_csv(
        EVALUATION_FILE
    )

    payments_df = payments_df.fillna("")

    payment_rows = payments_df[
        payments_df["payment_id"]
        .astype(str)
        == str(payment_id)
    ]

    if payment_rows.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Payment {payment_id} "
                "not found."
            )
        )

    payment = (
        payment_rows
        .iloc[0]
        .to_dict()
    )

    customers = load_customers()

    customer_id = payment[
        "customer_id"
    ]

    if customer_id not in customers:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Customer {customer_id} "
                "not found."
            )
        )

    customer = customers[
        customer_id
    ]

    try:

        result = run_recoup(
            payment,
            customer
        )

        return {
            "success": True,
            "result": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )