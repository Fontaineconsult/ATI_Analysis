"""Unit tests for the single configuration gateway (app/config_gateway.py).

Pure unit tests — no DB, no Flask. Each builds an isolated ConfigGateway against a
temp dir so the real environment / repo .env files don't leak in.
"""
import os

import pytest

from app.config_gateway import ConfigGateway

pytestmark = pytest.mark.unit


WEB_CONFIG_XML = """<configuration>
  <appSettings>
    <add key="DATABASE_URL" value="bolt://wc-host:7687" />
    <add key="AUTH_ENFORCED" value="1" />
    <add key="FLASK_SECRET_KEY" value="from-web-config" />
  </appSettings>
</configuration>
"""


@pytest.fixture(autouse=True)
def _preserve_environ():
    """Restore os.environ after each test — the gateway hydrates it in place."""
    saved = dict(os.environ)
    yield
    os.environ.clear()
    os.environ.update(saved)


def _write(path, text):
    path.write_text(text, encoding="utf-8")
    return path


def _gw(tmp_path, web_config_xml=None, env_name="production", dotenv=None, env_filename=None):
    """Build a gateway whose app_dir is an empty temp subdir, with optional
    web.config and .env files written next to / under it."""
    app_dir = tmp_path / "app"
    app_dir.mkdir(exist_ok=True)
    wc_path = tmp_path / "web.config"
    if web_config_xml is not None:
        _write(wc_path, web_config_xml)
    if dotenv is not None:
        _write(app_dir / (env_filename or f".env.{env_name}"), dotenv)
    return ConfigGateway(env_name=env_name, app_dir=app_dir, web_config_path=wc_path)


def test_os_environ_wins_over_web_config(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "bolt://from-env:7687")
    gw = _gw(tmp_path, WEB_CONFIG_XML)
    assert gw.get("DATABASE_URL") == "bolt://from-env:7687"


def test_web_config_used_when_env_absent(tmp_path, monkeypatch):
    # Clear any inherited values so resolution falls through to web.config
    # (the repo .env.development hydrates these into os.environ at import).
    monkeypatch.delenv("FLASK_SECRET_KEY", raising=False)
    monkeypatch.delenv("AUTH_ENFORCED", raising=False)
    gw = _gw(tmp_path, WEB_CONFIG_XML)
    assert gw.get("FLASK_SECRET_KEY") == "from-web-config"
    assert gw.get_bool("AUTH_ENFORCED") is True


def test_production_ignores_dotenv(tmp_path, monkeypatch):
    monkeypatch.delenv("SECRET_ONLY_IN_DOTENV", raising=False)
    gw = _gw(tmp_path, web_config_xml=None, env_name="production",
             dotenv="SECRET_ONLY_IN_DOTENV=nope\n", env_filename=".env.production")
    assert gw.get("SECRET_ONLY_IN_DOTENV") is None


def test_development_reads_dotenv(tmp_path, monkeypatch):
    monkeypatch.delenv("DEV_KEY", raising=False)
    gw = _gw(tmp_path, web_config_xml=None, env_name="development", dotenv="DEV_KEY=dev-value\n")
    assert gw.get("DEV_KEY") == "dev-value"


def test_web_config_beats_dotenv_in_development(tmp_path, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    gw = _gw(tmp_path, WEB_CONFIG_XML, env_name="development",
             dotenv="DATABASE_URL=bolt://from-dotenv:7687\n")
    assert gw.get("DATABASE_URL") == "bolt://wc-host:7687"


def test_missing_web_config_no_crash(tmp_path):
    gw = ConfigGateway(env_name="production", app_dir=tmp_path / "app",
                       web_config_path=tmp_path / "none.config")
    assert gw.get("ANYTHING", "fallback") == "fallback"


def test_malformed_web_config_no_crash(tmp_path):
    bad = _write(tmp_path / "bad.config", "<configuration><appSettings><add key=")
    gw = ConfigGateway(env_name="production", app_dir=tmp_path / "app", web_config_path=bad)
    assert gw.get("ANYTHING", "fallback") == "fallback"


def test_typed_accessors(tmp_path):
    xml = """<configuration><appSettings>
      <add key="B" value="yes" />
      <add key="N" value="42" />
      <add key="L" value="a, b ,c" />
    </appSettings></configuration>"""
    gw = _gw(tmp_path, xml)
    assert gw.get_bool("B") is True
    assert gw.get_int("N") == 42
    assert gw.get_list("L") == ["a", "b", "c"]
    # defaults when missing / unparseable
    assert gw.get_int("MISSING", 7) == 7
    assert gw.get_bool("MISSING", True) is True
    assert gw.get_list("MISSING", ["x"]) == ["x"]


def test_empty_value_falls_through_to_default(tmp_path):
    xml = '<configuration><appSettings><add key="CORS" value="" /></appSettings></configuration>'
    gw = _gw(tmp_path, xml)
    assert gw.get("CORS", "fallback") == "fallback"


def test_hydration_fills_gaps_without_override(tmp_path, monkeypatch):
    monkeypatch.setenv("AUTH_ENFORCED", "0")          # pre-set: must be preserved
    monkeypatch.delenv("FLASK_SECRET_KEY", raising=False)
    _gw(tmp_path, WEB_CONFIG_XML)
    assert os.environ["AUTH_ENFORCED"] == "0"                    # not overridden
    assert os.environ["FLASK_SECRET_KEY"] == "from-web-config"   # gap filled


def test_flask_env_resolved_from_web_config(tmp_path, monkeypatch):
    # FLASK_ENV lives ONLY in web.config (not os.environ). The gateway must still
    # detect production and therefore skip .env — wfastcgi may not inject appSettings,
    # so the bootstrap variable has to be resolvable from web.config itself.
    monkeypatch.delenv("FLASK_ENV", raising=False)
    monkeypatch.delenv("LEAK", raising=False)
    appdir = tmp_path / "app"
    appdir.mkdir()
    _write(appdir / ".env.production", "LEAK=nope\n")
    wc = _write(tmp_path / "web.config",
                '<configuration><appSettings>'
                '<add key="FLASK_ENV" value="production" />'
                '</appSettings></configuration>')
    gw = ConfigGateway(app_dir=appdir, web_config_path=wc)   # NOTE: no env_name passed
    assert gw.env_name == "production"
    assert gw.is_production is True
    assert gw.get("LEAK") is None   # strict prod: .env.production ignored
