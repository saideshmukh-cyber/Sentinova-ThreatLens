from backend.app.providers.cisa_kev_provider import (
    CISAKEVProvider,
)
from backend.app.providers.feodo_provider import (
    FeodoProvider,
)
from backend.app.providers.malwarebazaar_provider import (
    MalwareBazaarProvider,
)
from backend.app.providers.otx_provider import (
    OTXProvider,
)
from backend.app.providers.threatfox_provider import (
    ThreatFoxProvider,
)
from backend.app.providers.urlhaus_provider import (
    URLhausProvider,
)


FEED_PROVIDERS = {
    "urlhaus": URLhausProvider,
    "threatfox": ThreatFoxProvider,
    "feodo": FeodoProvider,
    "malwarebazaar": MalwareBazaarProvider,
    "otx": OTXProvider,
    "cisa-kev": CISAKEVProvider,
}


def get_available_feeds():
    feeds = []

    for name, provider_class in (
        FEED_PROVIDERS.items()
    ):
        feeds.append(
            {
                "name": name,
                "provider": (
                    provider_class.__name__
                ),
                "description": (
                    provider_class.description
                ),
            }
        )

    return feeds


def get_feed_provider(
    feed_name: str,
):
    normalized_name = (
        feed_name.strip().lower()
    )

    provider_class = FEED_PROVIDERS.get(
        normalized_name
    )

    if provider_class is None:
        raise ValueError(
            f"Unknown feed: {feed_name}"
        )

    return provider_class()