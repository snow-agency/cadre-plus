import pytest

from app import ratelimit


@pytest.fixture(autouse=True)
def compteurs_ia_vierges():
    ratelimit.reinitialiser()
    yield
    ratelimit.reinitialiser()
