"""The single configuration gateway for the ATI app.

One place where configuration enters the application. Every setting is resolved from
an ordered chain of sources, so call sites ask the gateway instead of reaching into
``os.environ`` / dotenv directly — and a new source (a JSON file, a secrets vault, a
remote config service) plugs in HERE, once, without touching any call site.

Resolution order (first non-empty hit wins):

  1. ``os.environ``       The live process environment. Under IIS, wfastcgi injects the
                          web.config ``<appSettings>`` here before the app boots; shell
                          exports and machine env vars also land here. Always wins.
  2. ``web.config``       ``<appSettings>`` parsed straight from the IIS site web.config
                          (default ``<parent-of-app>/web.config``, override with the
                          ``ATI_WEB_CONFIG`` env var). The production source of truth — and,
                          because it is parsed directly, it is readable even by standalone
                          host scripts that run OUTSIDE wfastcgi.
  3. ``.env.<FLASK_ENV>`` A dotenv file, for local development/test only. NEVER read when
                          ``FLASK_ENV=production`` — production is web.config-only (strict).
  4. caller default.

On construction the gateway also *hydrates* ``os.environ`` from sources (2) then (3),
gap-fill only (it never overrides a value already set), so code and libraries that read
``os.environ`` directly (neomodel, third-party packages, existing call sites) see the same
resolved configuration the gateway returns.

Imports are stdlib + python-dotenv ONLY — no project imports — so this module is
import-cycle safe and may be imported from anywhere (see the circular-import notes in
CLAUDE.md). Importing the module constructs the shared ``config`` singleton, which is the
side effect that hydrates ``os.environ``.
"""
from __future__ import annotations

import os
from pathlib import Path
from xml.etree import ElementTree

from dotenv import dotenv_values

# Truthy spellings accepted by get_bool (case-insensitive).
_TRUE = {"1", "true", "yes", "on"}


class ConfigGateway:
    """Resolve configuration from an ordered chain of sources.

    The module-level ``config`` instance is what the app reads through; the class is
    public so tests can build isolated instances with an explicit ``env_name`` /
    ``app_dir`` / ``web_config_path`` instead of the real environment.
    """

    def __init__(self, env_name=None, app_dir=None, web_config_path=None):
        self.app_dir = Path(app_dir) if app_dir else Path(__file__).resolve().parent

        # Parse web.config FIRST so FLASK_ENV can be resolved from it too. FLASK_ENV
        # is the bootstrap variable that decides production mode, and wfastcgi does NOT
        # reliably inject <appSettings> into os.environ — so the one variable that
        # makes web.config authoritative must itself be resolvable FROM web.config,
        # not from os.environ alone. Precedence: explicit arg > os.environ > web.config.
        self._web_config = self._read_web_config(web_config_path)
        self.env_name = (
            env_name
            or os.environ.get("FLASK_ENV")
            or self._web_config.get("FLASK_ENV")
            or "development"
        )
        self.is_production = self.env_name == "production"

        # Strict: production never consults a dotenv file — web.config is the source.
        self._dotenv = {} if self.is_production else self._read_dotenv()

        self._hydrate_os_environ()

    # --- source loaders ----------------------------------------------------
    def _resolve_web_config_path(self, explicit):
        if explicit:
            return Path(explicit)
        env_override = os.environ.get("ATI_WEB_CONFIG")
        if env_override:
            return Path(env_override)
        # On the IIS host the package lives at <SiteRoot>\app, so web.config sits one
        # level up. In the dev repo there is none there, and it is simply skipped.
        return self.app_dir.parent / "web.config"

    def _read_web_config(self, explicit):
        path = self._resolve_web_config_path(explicit)
        self.web_config_path = path
        if not path.is_file():
            return {}
        try:
            root = ElementTree.parse(path).getroot()
        except ElementTree.ParseError:
            # A malformed web.config must not take down boot — fall through to other
            # sources. (Under IIS a broken web.config fails at the IIS layer anyway.)
            return {}
        settings = {}
        for add in root.findall("./appSettings/add"):
            key = add.get("key")
            if key is not None:
                settings[key] = add.get("value", "")
        return settings

    def _read_dotenv(self):
        path = self.app_dir / f".env.{self.env_name}"
        if not path.is_file():
            return {}
        # dotenv_values returns a dict WITHOUT mutating os.environ; hydration below is
        # what decides (gap-fill only) which values reach the process environment.
        return {k: v for k, v in dotenv_values(path).items() if v is not None}

    def _hydrate_os_environ(self):
        # web.config first, then dotenv: a key present in both keeps the web.config
        # value, matching get()'s precedence. Never override an already-set variable.
        for source in (self._web_config, self._dotenv):
            for key, value in source.items():
                if value is not None and key not in os.environ:
                    os.environ[key] = value

    # --- accessors ---------------------------------------------------------
    def get(self, key, default=None):
        """Resolved string value for ``key``, or ``default``. Empty string is treated
        as unset and falls through to the next source."""
        for source in (os.environ, self._web_config, self._dotenv):
            value = source.get(key)
            if value not in (None, ""):
                return value
        return default

    def get_bool(self, key, default=False):
        value = self.get(key)
        if value is None:
            return default
        return str(value).strip().casefold() in _TRUE

    def get_int(self, key, default=0):
        value = self.get(key)
        if value in (None, ""):
            return default
        try:
            return int(str(value).strip())
        except (TypeError, ValueError):
            return default

    def get_list(self, key, default=None):
        """Comma-separated value as a trimmed list (empty entries dropped)."""
        value = self.get(key)
        if value in (None, ""):
            return list(default) if default is not None else []
        return [part.strip() for part in str(value).split(",") if part.strip()]


# The single gateway instance the app reads through. Constructing it here is what
# hydrates os.environ for the rest of the process.
config = ConfigGateway()
