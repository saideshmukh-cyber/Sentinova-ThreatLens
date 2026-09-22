from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.services.elasticsearch_service import index_indicator


def main() -> None:
    db: Session = SessionLocal()

    try:
        indicators = db.query(Indicator).order_by(Indicator.id).all()

        total = len(indicators)
        success = 0
        failed = 0

        print(f"Found {total} indicators.")

        for number, indicator in enumerate(indicators, start=1):
            try:
                index_indicator(indicator)
                success += 1
            except Exception as exc:
                failed += 1
                print(
                    f"Failed for indicator {indicator.id}: {exc}"
                )

            if number % 500 == 0 or number == total:
                print(
                    f"Processed {number}/{total} | "
                    f"success={success} | failed={failed}"
                )

        print(
            f"Finished: success={success}, failed={failed}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()