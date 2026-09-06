import os
import uuid
from datetime import datetime

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="Recoup API",
    description="Adaptive AI Revenue Recovery Agent",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://recoup-ruby.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")

EVALUATION_FILE = os.path.join(
    DATA_DIR,
    "evaluation_payments.csv"
)

AUDIT_FILE = os.path.join(
    DATA_DIR,
    "audit_log.csv"
)


# ============================================================
# REQUEST MODELS
# ============================================================

class MockPaymentRequest(BaseModel):
    amount: float
    method: str = "UPI"
    failure_reason: str = "BANK_ERROR"


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Recoup API is running",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Recoup Backend",
        "api": "online",
    }


# ============================================================
# PAYMENTS
# ============================================================

@app.get("/api/payments")
def get_payments():

    if not os.path.exists(EVALUATION_FILE):
        raise HTTPException(
            status_code=404,
            detail="Evaluation payments file not found."
        )

    try:
        df = pd.read_csv(EVALUATION_FILE)

        df = df.fillna("")

        payments = df.to_dict(orient="records")

        return {
            "success": True,
            "count": len(payments),
            "payments": payments,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CREATE MOCK FAILED PAYMENT
# ============================================================

@app.post("/api/payments/mock-failure")
def create_mock_failure(request: MockPaymentRequest):

    if not os.path.exists(EVALUATION_FILE):
        raise HTTPException(
            status_code=404,
            detail="Evaluation payments file not found."
        )

    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero."
        )

    try:

        # ----------------------------------------------------
        # Load existing evaluation data
        # ----------------------------------------------------

        df = pd.read_csv(EVALUATION_FILE)

        df = df.fillna("")

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No evaluation payments found."
            )

        # ----------------------------------------------------
        # Use an existing row as a template.
        # This preserves the exact CSV structure.
        # ----------------------------------------------------

        template = df.iloc[0].to_dict()

        # ----------------------------------------------------
        # Generate unique mock payment ID
        # ----------------------------------------------------

        payment_id = (
            "MOCK_" +
            uuid.uuid4().hex[:8].upper()
        )

        new_payment = {}

        # Preserve every existing column
        for column in df.columns:
            new_payment[column] = template.get(
                column,
                ""
            )

        # ----------------------------------------------------
        # Override payment information
        # ----------------------------------------------------

        if "payment_id" in new_payment:
            new_payment["payment_id"] = payment_id

        if "amount" in new_payment:
            new_payment["amount"] = float(
                request.amount
            )

        # IMPORTANT:
        # Give the new mock payment the current timestamp.
        # This makes it appear at the top when Recovery
        # Operations sorts by timestamp descending.
        if "timestamp" in new_payment:
            new_payment["timestamp"] = (
                datetime.now().isoformat()
            )

        if "failure_reason" in new_payment:
            new_payment["failure_reason"] = (
                request.failure_reason
            )

        if "payment_method" in new_payment:
            new_payment["payment_method"] = (
                request.method
            )

        if "method" in new_payment:
            new_payment["method"] = (
                request.method
            )

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

        # ----------------------------------------------------
        # Save permanently
        # ----------------------------------------------------

        df.to_csv(
            EVALUATION_FILE,
            index=False
        )

        print(
            f"[MOCK PAYMENT] Created "
            f"{payment_id} for "
            f"₹{request.amount:.2f}"
        )

        return {
            "success": True,
            "message": "Mock failed payment created.",
            "payment": new_payment,
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            f"[MOCK PAYMENT ERROR] {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# AUDIT
# ============================================================

@app.get("/api/audit")
def get_audit():

    if not os.path.exists(AUDIT_FILE):
        return {
            "success": True,
            "count": 0,
            "audit": [],
        }

    try:

        df = pd.read_csv(AUDIT_FILE)

        df = df.fillna("")

        records = df.to_dict(
            orient="records"
        )

        return {
            "success": True,
            "count": len(records),
            "audit": records,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# RECENT AUDIT
# ============================================================

@app.get("/api/audit/recent")
def get_recent_audit():

    if not os.path.exists(AUDIT_FILE):
        return {
            "success": True,
            "count": 0,
            "audit": [],
        }

    try:

        df = pd.read_csv(AUDIT_FILE)

        df = df.fillna("")

        # Most recent records first
        if "timestamp" in df.columns:
            df = df.sort_values(
                by="timestamp",
                ascending=False
            )

        df = df.head(10)

        records = df.to_dict(
            orient="records"
        )

        return {
            "success": True,
            "count": len(records),
            "audit": records,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# EVALUATION
# ============================================================

@app.get("/api/evaluation")
def get_evaluation():

    evaluation_file = os.path.join(
        DATA_DIR,
        "evaluation_results.csv"
    )

    if not os.path.exists(evaluation_file):

        return {
            "success": True,
            "evaluation": [],
        }

    try:

        df = pd.read_csv(
            evaluation_file
        )

        df = df.fillna("")

        records = df.to_dict(
            orient="records"
        )

        return {
            "success": True,
            "count": len(records),
            "evaluation": records,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# SUMMARY
# ============================================================

@app.get("/api/summary")
def get_summary():

    return {
        "success": True,

        "baseline": {
            "recovered_payments": 235,
            "total_payments": 605,
            "recovery_rate": 38.84,
            "recovered_amount": 597783.55,
            "average_attempts": 1.69,
        },

        "ml": {
            "recovered_payments": 403,
            "total_payments": 605,
            "recovery_rate": 66.61,
            "recovered_amount": 1075704.97,
            "average_attempts": 1.00,
        },

        "agentic": {
            "recovered_payments": 515,
            "total_payments": 605,
            "recovery_rate": 85.12,
            "recovered_amount": 1387407.84,
            "average_attempts": 1.25,
            "second_actions": 151,
        },

        "improvement": {
            "additional_revenue": 789624.29,
            "recovery_rate_uplift": 46.28,
            "relative_improvement": 132.09,
        },
    }


# ============================================================
# RECOVERY AGENT
# ============================================================

@app.post("/api/recover/{payment_id}")
def recover_payment(payment_id: str):

    if not os.path.exists(EVALUATION_FILE):
        raise HTTPException(
            status_code=404,
            detail="Evaluation payments file not found."
        )

    try:

        # ----------------------------------------------------
        # Load payments
        # ----------------------------------------------------

        df = pd.read_csv(
            EVALUATION_FILE
        )

        df = df.fillna("")

        matching = df[
            df["payment_id"].astype(str)
            == str(payment_id)
        ]

        if matching.empty:

            raise HTTPException(
                status_code=404,
                detail=f"Payment {payment_id} not found."
            )

        payment = matching.iloc[0].to_dict()

        # ----------------------------------------------------
        # Import recovery agent
        # ----------------------------------------------------

        try:

            from backend.agent import run_recovery_agent

        except ImportError:

            try:
                from agent import run_recovery_agent

            except ImportError as e:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Recovery agent could not be imported: "
                        + str(e)
                    )
                )

        # ----------------------------------------------------
        # Execute recovery agent
        # ----------------------------------------------------

        print()
        print("=" * 60)
        print("RECOUP AGENT")
        print("=" * 60)

        print(
            f"Payment ID : "
            f"{payment.get('payment_id')}"
        )

        print(
            f"Customer ID: "
            f"{payment.get('customer_id')}"
        )

        print(
            f"Amount     : "
            f"₹{float(payment.get('amount', 0)):,.2f}"
        )

        print(
            f"Failure reason: "
            f"{payment.get('failure_reason')}"
        )

        # ----------------------------------------------------
        # Run agent
        # ----------------------------------------------------

        result = run_recovery_agent(
            payment
        )

        print("=" * 60)

        return {
            "success": True,
            "payment_id": payment_id,
            "result": result,
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            f"[RECOVERY ERROR] {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# STARTUP MESSAGE
# ============================================================

@app.on_event("startup")
def startup_event():

    print()
    print("=" * 60)
    print("RECOUP BACKEND")
    print("=" * 60)
    print("Status : ONLINE")
    print(f"Data   : {DATA_DIR}")
    print(
        f"Payments file exists: "
        f"{os.path.exists(EVALUATION_FILE)}"
    )
    print("=" * 60)
    print()
