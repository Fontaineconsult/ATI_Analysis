"""The provider-neutral identity contract.

Every credential verifier (local table today, OIDC callback later) resolves to
an Identity; everything downstream (session, guard, /me) consumes only this.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Identity:
    username: str          # local username today; OIDC sub/UPN later
    display_name: str
    employee_id: str | None
    provider: str          # 'local' | 'oidc' | 'shibboleth'
