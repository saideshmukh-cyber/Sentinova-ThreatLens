from backend.app.providers.hash_provider import analyze_hash
from backend.app.services.scoring_service import (
    calculate_severity_score,
    risk_level_for_score,
    score_virustotal_result,
)


def test_hash_detection_md5_sha1_sha256():
    assert analyze_hash("d41d8cd98f00b204e9800998ecf8427e")["possible_types"] == ["MD5"]
    assert analyze_hash("a" * 40)["possible_types"] == ["SHA1"]
    assert analyze_hash("a" * 64)["possible_types"] == ["SHA256"]


def test_hash_detection_rejects_invalid_value():
    result = analyze_hash("not-a-hash")
    assert result["status"] == "invalid"
    assert result["is_valid_hash"] is False


def test_score_is_reproducible():
    inputs = {"malicious": 5, "suspicious": 2, "reputation": -10}
    assert calculate_severity_score(**inputs) == calculate_severity_score(**inputs) == 62


def test_score_boundaries_and_risk_levels():
    assert calculate_severity_score() == 0
    assert calculate_severity_score(malicious=6) == 60
    assert calculate_severity_score(malicious=6, reputation=-100) == 80
    assert calculate_severity_score(malicious=20, suspicious=20, reputation=-1000) == 100
    assert risk_level_for_score(0) == "LOW"
    assert risk_level_for_score(30) == "MEDIUM"
    assert risk_level_for_score(60) == "HIGH"
    assert risk_level_for_score(80) == "CRITICAL"


def test_virustotal_stats_are_used_for_scoring():
    result = score_virustotal_result(
        {
            "reputation": -10,
            "last_analysis_stats": {"malicious": 5, "suspicious": 2},
        }
    )
    assert result["severity_score"] == 62
    assert result["risk_level"] == "HIGH"
    assert result["score_inputs"] == {"malicious": 5, "suspicious": 2, "reputation": -10}
