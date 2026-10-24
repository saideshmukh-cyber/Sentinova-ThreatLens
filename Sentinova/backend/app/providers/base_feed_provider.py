from abc import ABC, abstractmethod


class BaseFeedProvider(ABC):
    name = "unknown"
    description = ""

    @abstractmethod
    def fetch_indicators(self) -> list[dict]:
        raise NotImplementedError
