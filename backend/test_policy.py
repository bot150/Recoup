from datetime import datetime, timedelta

from policy_engine import check_policy


print("=" * 60)
print("             RECOUP POLICY TEST")
print("=" * 60)


failure_time = datetime(2026, 9, 1, 10, 0)


def test_policy(name, action, attempt_count, nudge_count,
                last_action_time, current_time):

    result = check_policy(
        action=action,
        attempt_count=attempt_count,
        nudge_count=nudge_count,
        last_action_time=last_action_time,
        current_time=current_time,
        failure_time=failure_time
    )

    status = "PASS" if result["allowed"] == name["expected"] else "FAIL"

    print()
    print(name["label"])
    print("-" * 45)
    print("Action  :", action)
    print("Allowed :", result["allowed"])
    print("Reason  :", result["reason"])
    print("Test    :", status)

    return status == "PASS"


tests = []


# ------------------------------------------------------------
# TEST 1 — Normal retry should be allowed
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 1 — Normal retry",
            "expected": True
        },
        action="SMART_RETRY",
        attempt_count=1,
        nudge_count=0,
        last_action_time=failure_time,
        current_time=failure_time + timedelta(hours=6)
    )
)


# ------------------------------------------------------------
# TEST 2 — Third retry should be blocked
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 2 — Maximum retry exceeded",
            "expected": False
        },
        action="SMART_RETRY",
        attempt_count=2,
        nudge_count=0,
        last_action_time=failure_time,
        current_time=failure_time + timedelta(hours=24)
    )
)


# ------------------------------------------------------------
# TEST 3 — Third nudge should be blocked
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 3 — Maximum nudges exceeded",
            "expected": False
        },
        action="NUDGE",
        attempt_count=0,
        nudge_count=2,
        last_action_time=failure_time,
        current_time=failure_time + timedelta(hours=24)
    )
)


# ------------------------------------------------------------
# TEST 4 — Cooldown should block action
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 4 — Cooldown violation",
            "expected": False
        },
        action="PAYMENT_LINK",
        attempt_count=0,
        nudge_count=0,
        last_action_time=failure_time,
        current_time=failure_time + timedelta(hours=2)
    )
)


# ------------------------------------------------------------
# TEST 5 — Recovery window should block action
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 5 — Recovery window exceeded",
            "expected": False
        },
        action="PAYMENT_LINK",
        attempt_count=0,
        nudge_count=0,
        last_action_time=None,
        current_time=failure_time + timedelta(days=8)
    )
)


# ------------------------------------------------------------
# TEST 6 — STOP should always be allowed
# ------------------------------------------------------------

tests.append(
    test_policy(
        {
            "label": "TEST 6 — STOP action",
            "expected": True
        },
        action="STOP",
        attempt_count=2,
        nudge_count=2,
        last_action_time=failure_time,
        current_time=failure_time + timedelta(hours=1)
    )
)


# ------------------------------------------------------------
# FINAL RESULT
# ------------------------------------------------------------

print()
print("=" * 60)

passed = sum(tests)
total = len(tests)

print(f"POLICY TEST RESULT: {passed}/{total} PASSED")

if passed == total:
    print("ALL POLICY GUARDRAILS PASSED.")
else:
    print("SOME POLICY TESTS FAILED.")

print("=" * 60)