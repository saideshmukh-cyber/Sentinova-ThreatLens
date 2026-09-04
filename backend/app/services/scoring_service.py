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

    return {
        "score": score,
        "risk_level": risk_level,
        "score_breakdown": {
            "malicious_detections": (
                malicious
            ),
            "malicious_points": (
                malicious * 10
            ),
            "suspicious_detections": (
                suspicious
            ),
            "suspicious_points": (
                suspicious * 5
            ),
        },
    }


def calculate_investigation_score(
    enrichment_data: list[dict],
) -> int:
    total_score = 0

    for data in enrichment_data:
        if not isinstance(
            data,
            dict,
        ):
            continue

        if (
            "last_analysis_stats"
            in data
        ):
            total_score += (
                calculate_virustotal_score(
                    data
                )
            )

    return min(
        total_score,
        100,
    )


def calculate_investigation_risk(
    score: int,
) -> str:
    return classify_risk(score)


def calculate_investigation_breakdown(
    enrichment_data: list[dict],
) -> dict:
    total_malicious = 0
    total_suspicious = 0

    virustotal_sources = 0

    for data in enrichment_data:
        if not isinstance(
            data,
            dict,
        ):
            continue

        stats = data.get(
            "last_analysis_stats"
        )

        if not isinstance(
            stats,
            dict,
        ):
            continue

        malicious = stats.get(
            "malicious",
            0,
        )

        suspicious = stats.get(
            "suspicious",
            0,
        )

        total_malicious += malicious
        total_suspicious += suspicious
        virustotal_sources += 1

    malicious_points = (
        total_malicious * 10
    )

    suspicious_points = (
        total_suspicious * 5
    )

    return {
        "virustotal_sources": (
            virustotal_sources
        ),
        "malicious_detections": (
            total_malicious
        ),
        "malicious_points": (
            malicious_points
        ),
        "suspicious_detections": (
            total_suspicious
        ),
        "suspicious_points": (
            suspicious_points
        ),
        "total_score": min(
            malicious_points
            + suspicious_points,
            100,
        ),
    }