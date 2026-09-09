def calculate_severity_score(
    malicious: int = 0,
    suspicious: int = 0,
    reputation: int = 0,
) -> int:
    score = 0

    if malicious > 0:
        score += min(malicious * 10, 60)

    if suspicious > 0:
        score += min(suspicious * 5, 20)

    if reputation < 0:
        score += min(abs(reputation) // 5, 20)

    return min(score, 100)


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