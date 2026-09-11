def calculate_investigation_score(
    enrichment_data,
):
    score = 0

    for data in enrichment_data:
        if not isinstance(data, dict):
            continue

        malicious = int(
            data.get("malicious", 0) or 0
        )

        suspicious = int(
            data.get("suspicious", 0) or 0
        )

        reputation = int(
            data.get("reputation", 0) or 0
        )

        score += min(
            malicious * 10,
            60,
        )

        score += min(
            suspicious * 5,
            20,
        )

        if reputation < 0:
            score += min(
                abs(reputation) // 5,
                20,
            )

    return min(
        score,
        100,
    )


def calculate_investigation_risk(
    score: int,
):
    if score >= 80:
        return "CRITICAL"

    if score >= 60:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


def calculate_investigation_breakdown(
    enrichment_data,
):
    breakdown = {
        "reputation": 0,
        "malicious": 0,
        "suspicious": 0,
        "severity_score": 0,
    }

    for data in enrichment_data:
        if not isinstance(data, dict):
            continue

        if "reputation" in data:
            breakdown["reputation"] = int(
                data.get("reputation", 0) or 0
            )

        if "malicious" in data:
            breakdown["malicious"] += int(
                data.get("malicious", 0) or 0
            )

        if "suspicious" in data:
            breakdown["suspicious"] += int(
                data.get("suspicious", 0) or 0
            )

        if "severity_score" in data:
            breakdown["severity_score"] = max(
                breakdown["severity_score"],
                int(
                    data.get(
                        "severity_score",
                        0,
                    )
                    or 0
                ),
            )

    return breakdown


def calculate_severity_score(
    malicious: int = 0,
    suspicious: int = 0,
    reputation: int = 0,
) -> int:
    score = 0

    if malicious > 0:
        score += min(
            malicious * 10,
            60,
        )

    if suspicious > 0:
        score += min(
            suspicious * 5,
            20,
        )

    if reputation < 0:
        score += min(
            abs(reputation) // 5,
            20,
        )

    return min(
        score,
        100,
    )


def score_virustotal_result(
    result: dict,
) -> dict:
    malicious = int(
        result.get("malicious", 0) or 0
    )

    suspicious = int(
        result.get("suspicious", 0) or 0
    )

    reputation = int(
        result.get("reputation", 0) or 0
    )

    score = calculate_severity_score(
        malicious=malicious,
        suspicious=suspicious,
        reputation=reputation,
    )

    if score >= 80:
        risk_level = "CRITICAL"
    elif score >= 60:
        risk_level = "HIGH"
    elif score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "severity_score": score,
        "risk_level": risk_level,
    }

def calculate_feed_score(
    source_confidence: int,
    malicious: int = 0,
    suspicious: int = 0,
    internal_sightings: int = 0,
):
    score = 0

    score += min(
        source_confidence // 2,
        50,
    )

    score += min(
        malicious * 10,
        30,
    )

    score += min(
        suspicious * 5,
        10,
    )

    score += min(
        internal_sightings * 5,
        10,
    )

    return min(score, 100)