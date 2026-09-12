from abc import ABC, abstractmethod


class BaseFeedProvider(ABC):
    name: str = "unknown"
    description: str = ""

    @abstractmethod
    def fetch_indicators(self) -> list[dict]:
        raise NotImplementedError