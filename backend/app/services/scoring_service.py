"""Deterministic, table-driven severity scoring helpers.

The VirusTotal component is capped at 100 and is deliberately reproducible:
the same malicious/suspicious/reputation inputs always produce the same score.
The indicator-level score additionally combines source confidence, source count,
internal sightings, enrichment score and recency in indicator_scoring_service.
"""


MALICIOUS_POINTS = 10
MALICIOUS_CAP = 60
SUSPICIOUS_POINTS = 5
SUSPICIOUS_CAP = 20
NEGATIVE_REPUTATION_DIVISOR = 5
NEGATIVE_REPUTATION_CAP = 20


def calculate_severity_score(malicious: int = 0, suspicious: int = 0, reputation: int = 0) -> int:
    malicious = max(int(malicious or 0), 0)
    suspicious = max(int(suspicious or 0), 0)
    reputation = int(reputation or 0)

    score = min(malicious * MALICIOUS_POINTS, MALICIOUS_CAP)
    score += min(suspicious * SUSPICIOUS_POINTS, SUSPICIOUS_CAP)

    if reputation < 0:
        score += min(abs(reputation) // NEGATIVE_REPUTATION_DIVISOR, NEGATIVE_REPUTATION_CAP)

    return min(max(score, 0), 100)


def risk_level_for_score(score: int) -> str:
    score = int(score)
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def score_virustotal_result(result: dict) -> dict:
    stats = result.get("last_analysis_stats") or {}
    malicious = int(result.get("malicious", stats.get("malicious", 0)) or 0)
    suspicious = int(result.get("suspicious", stats.get("suspicious", 0)) or 0)
    reputation = int(result.get("reputation", 0) or 0)

    score = calculate_severity_score(
        malicious=malicious,
        suspicious=suspicious,
        reputation=reputation,
    )

    return {
        "severity_score": score,
        "risk_level": risk_level_for_score(score),
        "score_inputs": {
            "malicious": malicious,
            "suspicious": suspicious,
            "reputation": reputation,
        },
    }


def calculate_investigation_score(enrichment_data):
    score = 0
    for data in enrichment_data:
        if not isinstance(data, dict):
            continue
        score += min(int(data.get("malicious", 0) or 0) * MALICIOUS_POINTS, MALICIOUS_CAP)
        score += min(int(data.get("suspicious", 0) or 0) * SUSPICIOUS_POINTS, SUSPICIOUS_CAP)
        reputation = int(data.get("reputation", 0) or 0)
        if reputation < 0:
            score += min(abs(reputation) // NEGATIVE_REPUTATION_DIVISOR, NEGATIVE_REPUTATION_CAP)
    return min(score, 100)


def calculate_investigation_risk(score: int):
    return risk_level_for_score(score)


def calculate_investigation_breakdown(enrichment_data):
    breakdown = {"reputation": 0, "malicious": 0, "suspicious": 0, "severity_score": 0}
    for data in enrichment_data:
        if not isinstance(data, dict):
            continue
        breakdown["reputation"] = int(data.get("reputation", breakdown["reputation"]) or 0)
        breakdown["malicious"] += int(data.get("malicious", 0) or 0)
        breakdown["suspicious"] += int(data.get("suspicious", 0) or 0)
        breakdown["severity_score"] = max(breakdown["severity_score"], int(data.get("severity_score", 0) or 0))
    return breakdown


def calculate_feed_score(source_confidence: int, malicious: int = 0, suspicious: int = 0, internal_sightings: int = 0):
    score = min(max(int(source_confidence), 0), 100) // 2
    score += min(max(int(malicious), 0) * 10, 30)
    score += min(max(int(suspicious), 0) * 5, 10)
    score += min(max(int(internal_sightings), 0) * 5, 10)
    return min(score, 100)

def calculate_indicator_severity(
    *,
    source_confidence: int = 0,
    source_count: int = 0,
    internal_sightings: int = 0,
    enrichment_score: int = 0,
) -> int:
    """
    Backward-compatible wrapper used by indicator_scoring_service.py.

    Returns the deterministic 0-100 indicator severity score.
    """
    return calculate_severity_score(
        source_confidence=source_confidence,
        source_count=source_count,
        internal_sightings=internal_sightings,
        enrichment_score=enrichment_score,
    )