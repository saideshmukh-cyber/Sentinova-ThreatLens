from abc import ABC, abstractmethod


class EnrichmentProvider(ABC):

    @abstractmethod
    def enrich(self, value: str) -> dict:
        pass