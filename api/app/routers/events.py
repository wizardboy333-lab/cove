"""Event + RSVP routes (Stage 7 thin slice — metro/virtual only)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.auth import CurrentUser, DbSession
from app.models import (
    AttendeeListVisibility,
    Event,
    PlaceMode,
    Rsvp,
    RsvpStatus,
    User,
)
from app.schemas import (
    AttendeeOut,
    EventCreate,
    EventOut,
    EventUpdate,
    RsvpOut,
    RsvpUpsert,
)
from app.social_helpers import blocked_user_ids_for, is_blocked_either_way

router = APIRouter(prefix="/api/events", tags=["events"])


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"detail": "Event not found", "code": "NOT_FOUND"},
    )


def _bad_request(detail: str, code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"detail": detail, "code": code},
    )


def _forbidden(detail: str, code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"detail": detail, "code": code},
    )


def _get_event_or_404(db: DbSession, event_id: int) -> Event:
    event = db.get(Event, event_id)
    if event is None:
        raise _not_found()
    return event


def _require_visible(db: DbSession, event: Event, viewer_id: int) -> None:
    if is_blocked_either_way(db, viewer_id, event.host_id):
        raise _not_found()


def _my_rsvp(db: DbSession, event_id: int, user_id: int) -> Rsvp | None:
    return db.scalar(
        select(Rsvp).where(Rsvp.event_id == event_id, Rsvp.user_id == user_id)
    )


def _going_count(db: DbSession, event_id: int) -> int:
    count = db.scalar(
        select(func.count())
        .select_from(Rsvp)
        .where(Rsvp.event_id == event_id, Rsvp.status == RsvpStatus.going)
    )
    return int(count or 0)


def _can_see_virtual_url(event: Event, viewer_id: int, my: Rsvp | None) -> bool:
    if event.host_id == viewer_id:
        return True
    return my is not None and my.status == RsvpStatus.going


def _rsvp_out(rsvp: Rsvp) -> RsvpOut:
    return RsvpOut(
        id=rsvp.id,
        event_id=rsvp.event_id,
        user_id=rsvp.user_id,
        status=rsvp.status.value if isinstance(rsvp.status, RsvpStatus) else str(rsvp.status),
        show_on_list=rsvp.show_on_list,
        created_at=rsvp.created_at,
    )


def _event_out(
    db: DbSession,
    event: Event,
    viewer_id: int,
    *,
    include_rsvp: bool = True,
) -> EventOut:
    my = _my_rsvp(db, event.id, viewer_id) if include_rsvp else None
    host_name = event.host.display_name if event.host else None
    virtual_url = (
        event.virtual_url if _can_see_virtual_url(event, viewer_id, my) else None
    )
    return EventOut(
        id=event.id,
        host_id=event.host_id,
        host_display_name=host_name,
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        timezone=event.timezone,
        place_mode=event.place_mode.value
        if isinstance(event.place_mode, PlaceMode)
        else str(event.place_mode),
        metro_area=event.metro_area,
        virtual_url=virtual_url,
        attendee_list_visibility=event.attendee_list_visibility.value
        if isinstance(event.attendee_list_visibility, AttendeeListVisibility)
        else str(event.attendee_list_visibility),
        capacity=event.capacity,
        cancelled=event.cancelled,
        created_at=event.created_at,
        going_count=_going_count(db, event.id),
        my_rsvp=_rsvp_out(my) if my else None,
    )


def _validate_place_fields(
    place_mode: PlaceMode | str,
    metro_area: str | None,
    virtual_url: str | None,
) -> tuple[PlaceMode, str | None, str | None]:
    mode_raw = place_mode.value if isinstance(place_mode, PlaceMode) else str(place_mode)
    if mode_raw == "private_venue":
        raise _bad_request(
            "private_venue is not supported in v1 — use metro or virtual",
            "PLACE_MODE_UNSUPPORTED",
        )
    try:
        mode = PlaceMode(mode_raw)
    except ValueError as exc:
        raise _bad_request(
            "place_mode must be metro or virtual",
            "PLACE_MODE_UNSUPPORTED",
        ) from exc

    metro = metro_area.strip() if metro_area and metro_area.strip() else None
    vurl = virtual_url.strip() if virtual_url and virtual_url.strip() else None

    if mode == PlaceMode.metro:
        if not metro:
            raise _bad_request(
                "metro_area is required when place_mode is metro",
                "METRO_REQUIRED",
            )
    if mode == PlaceMode.virtual:
        # virtual_url optional at create (host can add later) but encouraged
        pass
    return mode, metro, vurl


def _can_see_attendees(event: Event, viewer_id: int, my: Rsvp | None) -> bool:
    vis = event.attendee_list_visibility
    if isinstance(vis, str):
        vis = AttendeeListVisibility(vis)
    if event.host_id == viewer_id:
        return True
    if vis == AttendeeListVisibility.public:
        return True
    if vis == AttendeeListVisibility.host_only:
        return False
    # going_only
    return my is not None and my.status == RsvpStatus.going


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(body: EventCreate, user: CurrentUser, db: DbSession) -> EventOut:
    mode, metro, vurl = _validate_place_fields(
        body.place_mode, body.metro_area, body.virtual_url
    )
    event = Event(
        host_id=user.id,
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        timezone=body.timezone.strip() or "America/New_York",
        place_mode=mode,
        metro_area=metro,
        virtual_url=vurl,
        attendee_list_visibility=AttendeeListVisibility(body.attendee_list_visibility),
        capacity=body.capacity,
        cancelled=False,
    )
    db.add(event)
    db.flush()
    db.add(
        Rsvp(
            event_id=event.id,
            user_id=user.id,
            status=RsvpStatus.going,
            show_on_list=True,
        )
    )
    db.commit()
    event = db.scalar(
        select(Event).options(joinedload(Event.host)).where(Event.id == event.id)
    )
    assert event is not None
    return _event_out(db, event, user.id)


@router.get("", response_model=list[EventOut])
def list_events(
    user: CurrentUser,
    db: DbSession,
    metro: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[EventOut]:
    now = datetime.now(timezone.utc)
    blocked = blocked_user_ids_for(db, user.id)
    stmt = (
        select(Event)
        .options(joinedload(Event.host))
        .where(Event.cancelled.is_(False), Event.starts_at >= now)
        .order_by(Event.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    if metro and metro.strip():
        stmt = stmt.where(Event.metro_area.ilike(metro.strip()))
    rows = db.scalars(stmt).unique().all()
    out: list[EventOut] = []
    for event in rows:
        if event.host_id in blocked:
            continue
        out.append(_event_out(db, event, user.id))
    return out


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, user: CurrentUser, db: DbSession) -> EventOut:
    event = db.scalar(
        select(Event).options(joinedload(Event.host)).where(Event.id == event_id)
    )
    if event is None:
        raise _not_found()
    _require_visible(db, event, user.id)
    return _event_out(db, event, user.id)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int, body: EventUpdate, user: CurrentUser, db: DbSession
) -> EventOut:
    event = _get_event_or_404(db, event_id)
    _require_visible(db, event, user.id)
    if event.host_id != user.id:
        raise _forbidden("Only the host can edit this event", "HOST_ONLY")

    data = body.model_dump(exclude_unset=True)
    if "place_mode" in data or "metro_area" in data or "virtual_url" in data:
        mode_src = data.get("place_mode", event.place_mode)
        metro_src = data.get("metro_area", event.metro_area)
        vurl_src = data.get("virtual_url", event.virtual_url)
        mode, metro, vurl = _validate_place_fields(mode_src, metro_src, vurl_src)
        event.place_mode = mode
        event.metro_area = metro
        event.virtual_url = vurl
        data.pop("place_mode", None)
        data.pop("metro_area", None)
        data.pop("virtual_url", None)

    if "title" in data and data["title"] is not None:
        event.title = data["title"].strip()
    if "description" in data:
        desc = data["description"]
        event.description = desc.strip() if isinstance(desc, str) and desc.strip() else desc
    if "starts_at" in data and data["starts_at"] is not None:
        event.starts_at = data["starts_at"]
    if "ends_at" in data:
        event.ends_at = data["ends_at"]
    if "timezone" in data and data["timezone"] is not None:
        event.timezone = data["timezone"].strip() or "America/New_York"
    if "attendee_list_visibility" in data and data["attendee_list_visibility"] is not None:
        event.attendee_list_visibility = AttendeeListVisibility(
            data["attendee_list_visibility"]
        )
    if "capacity" in data:
        event.capacity = data["capacity"]

    db.commit()
    event = db.scalar(
        select(Event).options(joinedload(Event.host)).where(Event.id == event.id)
    )
    assert event is not None
    return _event_out(db, event, user.id)


@router.post("/{event_id}/cancel", response_model=EventOut)
def cancel_event(event_id: int, user: CurrentUser, db: DbSession) -> EventOut:
    event = _get_event_or_404(db, event_id)
    _require_visible(db, event, user.id)
    if event.host_id != user.id:
        raise _forbidden("Only the host can cancel this event", "HOST_ONLY")
    event.cancelled = True
    db.commit()
    event = db.scalar(
        select(Event).options(joinedload(Event.host)).where(Event.id == event.id)
    )
    assert event is not None
    return _event_out(db, event, user.id)


@router.put("/{event_id}/rsvp", response_model=RsvpOut)
def upsert_rsvp(
    event_id: int, body: RsvpUpsert, user: CurrentUser, db: DbSession
) -> RsvpOut:
    event = _get_event_or_404(db, event_id)
    _require_visible(db, event, user.id)
    if event.cancelled:
        raise _bad_request("This event is cancelled", "EVENT_CANCELLED")

    status_val = RsvpStatus(body.status)
    if status_val == RsvpStatus.going and event.capacity is not None:
        existing = _my_rsvp(db, event.id, user.id)
        already_going = existing is not None and existing.status == RsvpStatus.going
        if not already_going:
            going = _going_count(db, event.id)
            if going >= event.capacity:
                raise _bad_request("Event is at capacity", "EVENT_FULL")

    rsvp = _my_rsvp(db, event.id, user.id)
    show = True if body.show_on_list is None else body.show_on_list
    if rsvp is None:
        rsvp = Rsvp(
            event_id=event.id,
            user_id=user.id,
            status=status_val,
            show_on_list=show,
        )
        db.add(rsvp)
    else:
        rsvp.status = status_val
        rsvp.show_on_list = show
    db.commit()
    db.refresh(rsvp)
    return _rsvp_out(rsvp)


@router.delete("/{event_id}/rsvp", status_code=status.HTTP_204_NO_CONTENT)
def clear_rsvp(event_id: int, user: CurrentUser, db: DbSession) -> None:
    event = _get_event_or_404(db, event_id)
    _require_visible(db, event, user.id)
    rsvp = _my_rsvp(db, event.id, user.id)
    if rsvp is not None:
        db.delete(rsvp)
        db.commit()
    return None


@router.get("/{event_id}/attendees", response_model=list[AttendeeOut])
def list_attendees(
    event_id: int, user: CurrentUser, db: DbSession
) -> list[AttendeeOut]:
    event = _get_event_or_404(db, event_id)
    _require_visible(db, event, user.id)
    my = _my_rsvp(db, event.id, user.id)
    if not _can_see_attendees(event, user.id, my):
        raise _forbidden(
            "Attendee list is not visible with your RSVP / host settings",
            "ATTENDEES_HIDDEN",
        )

    blocked = blocked_user_ids_for(db, user.id)
    rows = db.scalars(
        select(Rsvp)
        .options(joinedload(Rsvp.user))
        .where(
            Rsvp.event_id == event.id,
            Rsvp.show_on_list.is_(True),
            Rsvp.status.in_([RsvpStatus.going, RsvpStatus.interested]),
        )
        .order_by(Rsvp.created_at.asc())
    ).unique().all()

    out: list[AttendeeOut] = []
    for rsvp in rows:
        if rsvp.user_id in blocked:
            continue
        name = rsvp.user.display_name if rsvp.user else "Member"
        out.append(
            AttendeeOut(
                user_id=rsvp.user_id,
                display_name=name,
                status=rsvp.status.value
                if isinstance(rsvp.status, RsvpStatus)
                else str(rsvp.status),
            )
        )
    return out
