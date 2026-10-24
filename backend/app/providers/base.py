from abc import ABC, abstractmethod


class EnrichmentProvider(ABC):

    @abstractmethod
    def enrich(
        self,
        value: str,
        indicator_type: str,
    ) -> dict:
        raise NotImplementedError