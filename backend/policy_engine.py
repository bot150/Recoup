# ============================================================
# Recoup Policy Engine
# ============================================================

MAX_RETRIES = 2
MAX_NUDGES = 2
COOLDOWN_HOURS = 6
MAX_RECOVERY_DAYS = 7


def check_policy(
    action,
    attempt_count,
    nudge_count,
    last_action_time,
    current_time,
    failure_time
):

    # STOP is always allowed
    if action == "STOP":
        return {
            "allowed": True,
            "reason": "Agent selected STOP."
        }

    # Maximum recovery window
    elapsed_seconds = (
        current_time - failure_time
    ).total_seconds()

    elapsed_days = elapsed_seconds / (60 * 60 * 24)

    if elapsed_days > MAX_RECOVERY_DAYS:
        return {
            "allowed": False,
            "reason": "Recovery window exceeded."
        }

    # Cooldown
    if last_action_time is not None:

        hours_since_last_action = (
            current_time - last_action_time
        ).total_seconds() / 3600

        if hours_since_last_action < COOLDOWN_HOURS:
            return {
                "allowed": False,
                "reason": "Cooldown period not completed."
            }

    # Retry limit
    if action == "SMART_RETRY":

        if attempt_count >= MAX_RETRIES:
            return {
                "allowed": False,
                "reason": "Maximum retry limit reached."
            }

    # Nudge limit
    if action == "NUDGE":

        if nudge_count >= MAX_NUDGES:
            return {
                "allowed": False,
                "reason": "Maximum nudge limit reached."
            }

    return {
        "allowed": True,
        "reason": "Action satisfies all policy rules."
    }