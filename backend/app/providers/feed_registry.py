
from backend.app.config import settings
from backend.app.providers.cisa_kev_provider import CISAKEVProvider
from backend.app.providers.feodo_provider import FeodoTrackerProvider
from backend.app.providers.malwarebazaar_provider import MalwareBazaarProvider
from backend.app.providers.otx_provider import OTXProvider
from backend.app.providers.threatfox_provider import ThreatFoxProvider
from backend.app.providers.urlhaus_provider import URLhausProvider


FEEDS = {
    "urlhaus": URLhausProvider,
    "threatfox": lambda: ThreatFoxProvider(),
    "feodo-tracker": FeodoTrackerProvider,
    "malwarebazaar": lambda: MalwareBazaarProvider(),
    "otx": lambda: OTXProvider(settings.otx_api_key),
    "cisa-kev": CISAKEVProvider,
}


def get_feed_provider(name: str):
    factory = FEEDS.get(name.strip().lower())

    if factory is None:
        return None

    return factory()


def list_feeds():
    return [
        {
            "name": "urlhaus",
            "description": "Malicious URLs from URLhaus",
        },
        {
            "name": "threatfox",
            "description": "Recent IOCs from ThreatFox",
        },
        {
            "name": "feodo-tracker",
            "description": "Feodo Tracker botnet IPs",
        },
        {
            "name": "malwarebazaar",
            "description": "Recent malware hashes from MalwareBazaar",
        },
        {
            "name": "otx",
            "description": "AlienVault OTX subscribed pulses",
        },
        {
            "name": "cisa-kev",
            "description": "CISA Known Exploited Vulnerabilities catalog",
        },
    ]
