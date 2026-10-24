from backend.app.providers.abusech_provider import AbuseCHProvider


class FeodoTrackerProvider(AbuseCHProvider):
    def __init__(self):
        super().__init__("feodo-tracker", "https://feodotracker.abuse.ch/downloads/ipblocklist.json", "ip")
