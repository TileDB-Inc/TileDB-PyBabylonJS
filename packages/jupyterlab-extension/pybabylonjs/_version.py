import json
from pathlib import Path

__all__ = ["__version__"]


def _fetchVersion():
    HERE = Path(__file__).parent.resolve()

    for settings in HERE.rglob("package.json"):
        try:
            with settings.open() as f:
                version = json.load(f)["version"]
                return version
        except FileNotFoundError:
            pass

    raise FileNotFoundError(f"Could not find package.json under dir {HERE!s}")


__npm_version__ = _fetchVersion()

__version__ = (
    __npm_version__.replace("-alpha.", "a").replace("-beta.", "b").replace("-rc.", "rc")
)
