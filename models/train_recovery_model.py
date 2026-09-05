import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
    classification_report
)


INPUT_FILE = "data/recovery_training.csv"
MODEL_FILE = "models/recovery_model.joblib"


def main():

    print("=" * 50)
    print("             Recoup ML Training")
    print("=" * 50)

    # Load training data
    df = pd.read_csv(INPUT_FILE)

    print(f"\nTraining rows loaded : {len(df)}")

    # Target
    target = "recovered"

    # Remove identifiers and target
    X = df.drop(
        columns=[
            target,
            "payment_id",
            "customer_id"
        ]
    )

    y = df[target]

    # Categorical features
    categorical_features = [
        "failure_reason",
        "payment_method",
        "payment_frequency",
        "preferred_method",
        "action"
    ]

    # Numerical features
    numerical_features = [
        "amount",
        "typical_payment_hour",
        "attempt_hour",
        "hour_difference",
        "hours_after_failure",
        "attempt_number"
    ]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features
            ),
            (
                "numerical",
                "passthrough",
                numerical_features
            )
        ]
    )

    # Random Forest
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    # Complete pipeline
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ]
    )

    # Split training scenarios for model validation
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print(f"Model training rows  : {len(X_train)}")
    print(f"Model validation rows: {len(X_test)}")

    # Train
    print("\nTraining Random Forest...")

    pipeline.fit(
        X_train,
        y_train
    )

    # Predictions
    predictions = pipeline.predict(X_test)

    probabilities = pipeline.predict_proba(X_test)[:, 1]

    # Metrics
    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    print("\n" + "=" * 50)
    print("             Model Performance")
    print("=" * 50)

    print(f"\nAccuracy  : {accuracy:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"ROC-AUC   : {roc_auc:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    # Save model
    joblib.dump(
        pipeline,
        MODEL_FILE
    )

    print("=" * 50)
    print("Recoup ML training complete!")
    print(f"Model saved to: {MODEL_FILE}")
    print("=" * 50)


if __name__ == "__main__":
    main()