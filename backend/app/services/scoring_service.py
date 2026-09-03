def calculate_virustotal_score(
    data: dict,
) -> int:
    stats = data.get(
        "last_analysis_stats",
        {},
    )

    malicious = stats.get(
        "malicious",
        0,
    )

    suspicious = stats.get(
        "suspicious",
        0,
    )

    score = (
        malicious * 10
    ) + (
        suspicious * 5
    )

    return min(
        score,
        100,
    )


def classify_risk(
    score: int,
) -> str:
    if score >= 70:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


def score_virustotal_result(
    data: dict,
) -> dict:
    score = calculate_virustotal_score(
        data
    )

    risk_level = classify_risk(
        score
    )

    return {
        "score": score,
        "risk_level": risk_level,
    }


def calculate_investigation_score(
    enrichments: list[dict],
) -> int:
    total_score = 0

    for enrichment in enrichments:
        score = enrichment.get(
            "score",
            0,
        )

        if isinstance(score, int):
            total_score += score

    return min(
        total_score,
        100,
    )


def calculate_investigation_risk(
    score: int,
) -> str:
    return classify_risk(
        score
    )