"""Pull Pope Tech scan snapshots and, when asked, record them as Metric nodes.

No runner is chosen yet. Whatever ends up calling this (a scheduled task, a
queue worker, an endpoint) awaits pull_metric_snapshots and logs the result.
"""
import asyncio

from app.services._support import ServiceResult, new_run_dir
from app.services.pope_tech_integration import config
from app.services.pope_tech_integration.fetch import fetch_snapshots


async def pull_metric_snapshots(*, academic_year: str, orgs=None, as_of=None,
                                save: bool = False, link_to: dict = None,
                                tracking_titles: dict = None,
                                timeout: int = config.DEFAULT_TIMEOUT) -> ServiceResult:
    """Fetch snapshots, keep the files locally, and optionally save them.

    :param academic_year: the reporting year the Metrics belong to, e.g. '2025-2026'.
        Named by the caller because the reporting year is not the calendar year.
    :param orgs: org slugs or fuzzy names ('sfsu'); None means every org.
    :param as_of: list of YYYY-MM-DD dates; None means today.
    :param save: write each snapshot to the graph. False only fetches.
    :param link_to: optional {campus: year_identifier} to link each Metric to a YSE.
    :param tracking_titles: {campus: Tracking title} each Metric is attached to;
        None uses config.TRACKING_TITLES.
    """
    result = ServiceResult(service=config.SERVICE_NAME)
    run_dir = new_run_dir(config.SERVICE_NAME)
    result.run_dir = str(run_dir)

    try:
        fetched = await fetch_snapshots(run_dir, orgs=orgs, as_of=as_of, timeout=timeout)
    # SnapshotFetchError, ServiceTimeout and ServiceNotConfigured are all
    # RuntimeErrors; OSError covers a program that cannot be started.
    except (OSError, RuntimeError) as e:
        result.fail(str(e))
        return result

    if fetched.partial:
        result.skip("ptq", fetched.stderr or "some dates had no usable data")

    if not save:
        for snap in fetched.snapshots:
            result.skip(f"{snap.get('org', {}).get('campus')} {snap.get('as_of')}", "not saved (save=False)")
        return result

    # Imported here so a fetch-only run never loads the queries layer.
    from app.services.pope_tech_integration.store import save_snapshot

    for snap in fetched.snapshots:
        label = f"{snap.get('org', {}).get('campus')} {snap.get('as_of')}"
        yse = (link_to or {}).get(snap.get("org", {}).get("campus"))
        try:
            key = await asyncio.to_thread(
                save_snapshot, snap, academic_year, yse, tracking_titles)
            result.saved.append(key)
        except Exception as e:  # one bad snapshot must not drop the others
            result.skip(label, str(e))
    return result
