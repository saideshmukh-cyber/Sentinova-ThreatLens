from backend.app.services.scoring_service import (
    calculate_severity_score,
    score_virustotal_result,
)


def test_zero_score():
    score = calculate_severity_score()

    assert score == 0


def test_malicious_score():
    score = calculate_severity_score(
        malicious=5,
    )

    assert score == 50


def test_suspicious_score():
    score = calculate_severity_score(
        suspicious=4,
    )

    assert score == 20


def test_negative_reputation():
    score = calculate_severity_score(
        reputation=-50,
    )

    assert score == 10


def test_score_is_capped():
    score = calculate_severity_score(
        malicious=20,
        suspicious=20,
        reputation=-1000,
    )

    assert score == 100


def test_virustotal_result():
    result = score_virustotal_result(
        {
            "status": "ok",
            "malicious": 5,
            "suspicious": 2,
            "reputation": -10,
        }
    )

    assert result["severity_score"] == 62
    assert result["risk_level"] == "HIGH"