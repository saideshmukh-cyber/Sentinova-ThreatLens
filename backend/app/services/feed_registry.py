from backend.app.providers.urlhaus_provider import URLhausProvider


FEED_PROVIDERS = {
    "urlhaus": URLhausProvider,
}


def get_available_feeds():
    return [
        {
            "name": name,
            "provider": provider.__name__,
        }
        for name, provider in FEED_PROVIDERS.items()
    ]


def get_feed_provider(
    feed_name: str,
):
    provider_class = FEED_PROVIDERS.get(
        feed_name.strip().lower()
    )

    if provider_class is None:
        raise ValueError(
            f"Unknown feed: {feed_name}"
        )

    return provider_class()