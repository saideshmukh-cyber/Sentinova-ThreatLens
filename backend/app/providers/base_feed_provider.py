from abc import ABC, abstractmethod


class BaseFeedProvider(ABC):
    name: str = "unknown"

    @abstractmethod
    def fetch_indicators(self) -> list[dict]:
        raise NotImplementedError