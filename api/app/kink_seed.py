"""Curated English kink taxonomy seed (~200 tags, flat + parent_id)."""

from __future__ import annotations

# (slug, name, category, parent_slug|None)
KINK_SEED: list[tuple[str, str, str, str | None]] = [
    # ── Roots / categories ────────────────────────────────────────────────
    ("bdsm", "BDSM", "umbrella", None),
    ("power-exchange", "Power exchange", "power", None),
    ("impact", "Impact play", "impact", None),
    ("bondage", "Bondage", "bondage", None),
    ("sensation", "Sensation play", "sensation", None),
    ("restraint", "Restraint", "bondage", None),
    ("protocol", "Protocol & etiquette", "protocol", None),
    ("roleplay", "Roleplay", "roleplay", None),
    ("fetish", "Fetish", "fetish", None),
    ("body", "Body & appearance", "body", None),
    ("service", "Service", "service", None),
    ("psychological", "Psychological play", "psychological", None),
    ("medical", "Medical play", "medical", None),
    ("pet-play", "Pet play", "pet", None),
    ("age-play", "Age play (adult)", "ageplay", None),
    ("exhibition", "Exhibition & voyeur", "exhibition", None),
    ("group", "Group dynamics", "group", None),
    ("edge", "Edge / intense", "edge", None),
    ("aftercare", "Aftercare & negotiation", "meta", None),
    ("education", "Education & craft", "meta", None),
    # Power
    ("dominance", "Dominance", "power", "power-exchange"),
    ("submission", "Submission", "power", "power-exchange"),
    ("switch", "Switch", "power", "power-exchange"),
    ("tpe", "TPE / 24-7", "power", "power-exchange"),
    ("d-s", "D/s", "power", "power-exchange"),
    ("m-s", "M/s", "power", "power-exchange"),
    ("owner-property", "Owner / property", "power", "power-exchange"),
    ("collar", "Collaring", "power", "power-exchange"),
    ("consensual-nonconsent", "CNC (negotiated)", "power", "power-exchange"),
    ("brat", "Brat / brat tamer", "power", "power-exchange"),
    ("primal", "Primal", "power", "power-exchange"),
    ("sadism", "Sadism", "power", "bdsm"),
    ("masochism", "Masochism", "power", "bdsm"),
    ("sadomasochism", "Sadomasochism", "power", "bdsm"),
    # Impact
    ("spanking", "Spanking", "impact", "impact"),
    ("flogging", "Flogging", "impact", "impact"),
    ("caning", "Caning", "impact", "impact"),
    ("paddling", "Paddling", "impact", "impact"),
    ("whipping", "Whipping", "impact", "impact"),
    ("birching", "Birching", "impact", "impact"),
    ("bastinado", "Bastinado / foot impact", "impact", "impact"),
    ("punching", "Consensual punching", "impact", "impact"),
    ("slapping", "Face slapping (negotiated)", "impact", "impact"),
    ("thuddy", "Thuddy impact", "impact", "impact"),
    ("stingy", "Stingy impact", "impact", "impact"),
    # Bondage / restraint
    ("rope", "Rope bondage", "bondage", "bondage"),
    ("shibari", "Shibari / kinbaku", "bondage", "rope"),
    ("suspension", "Suspension", "bondage", "rope"),
    ("cuffs", "Cuffs", "bondage", "restraint"),
    ("metal-bondage", "Metal bondage", "bondage", "restraint"),
    ("leather-bondage", "Leather bondage", "bondage", "restraint"),
    ("mummification", "Mummification", "bondage", "restraint"),
    ("predicament", "Predicament bondage", "bondage", "bondage"),
    ("hogtie", "Hogtie", "bondage", "bondage"),
    ("gags", "Gags", "bondage", "restraint"),
    ("blindfolds", "Blindfolds", "sensation", "sensation"),
    ("hoods", "Hoods", "bondage", "restraint"),
    ("spreader-bars", "Spreader bars", "bondage", "restraint"),
    ("cages", "Cages", "bondage", "restraint"),
    # Sensation
    ("wax", "Wax play", "sensation", "sensation"),
    ("ice", "Ice play", "sensation", "sensation"),
    ("temperature", "Temperature play", "sensation", "sensation"),
    ("electro", "Electro play", "sensation", "sensation"),
    ("violet-wand", "Violet wand", "sensation", "electro"),
    ("needle", "Needle play", "sensation", "sensation"),
    ("knife-play", "Knife play (safe)", "sensation", "sensation"),
    ("scratching", "Scratching", "sensation", "sensation"),
    ("biting", "Biting", "sensation", "sensation"),
    ("tickling", "Tickling", "sensation", "sensation"),
    ("fire-play", "Fire play", "sensation", "sensation"),
    ("cupping", "Cupping", "sensation", "sensation"),
    ("suction", "Suction play", "sensation", "sensation"),
    ("feathers", "Feather / soft tease", "sensation", "sensation"),
    ("pressure-points", "Pressure points", "sensation", "sensation"),
    # Protocol / service
    ("high-protocol", "High protocol", "protocol", "protocol"),
    ("low-protocol", "Low protocol", "protocol", "protocol"),
    ("titles", "Titles & forms of address", "protocol", "protocol"),
    ("ritual", "Ritual", "protocol", "protocol"),
    ("rules", "Rules & tasks", "protocol", "protocol"),
    ("domestic-service", "Domestic service", "service", "service"),
    ("sexual-service", "Sexual service", "service", "service"),
    ("bootblacking", "Bootblacking", "service", "service"),
    ("body-service", "Body service", "service", "service"),
    ("secretary", "Secretary / assistant dynamic", "service", "service"),
    # Roleplay
    ("teacher-student", "Teacher / student (adult)", "roleplay", "roleplay"),
    ("boss-employee", "Boss / employee", "roleplay", "roleplay"),
    ("captor-captive", "Captor / captive", "roleplay", "roleplay"),
    ("interrogation", "Interrogation play", "roleplay", "roleplay"),
    ("uniform", "Uniforms", "roleplay", "roleplay"),
    ("fantasy", "Fantasy scenes", "roleplay", "roleplay"),
    ("objectification", "Objectification", "roleplay", "psychological"),
    ("degradation", "Degradation (consensual)", "roleplay", "psychological"),
    ("humiliation", "Humiliation (consensual)", "roleplay", "psychological"),
    ("praise", "Praise kink", "roleplay", "psychological"),
    ("mindfuck", "Mindfuck / head games", "roleplay", "psychological"),
    ("hypnosis", "Erotic hypnosis", "roleplay", "psychological"),
    # Fetish / body
    ("leather", "Leather", "fetish", "fetish"),
    ("latex", "Latex / rubber", "fetish", "fetish"),
    ("pvc", "PVC", "fetish", "fetish"),
    ("boots", "Boots", "fetish", "fetish"),
    ("heels", "Heels", "fetish", "fetish"),
    ("stockings", "Stockings / hosiery", "fetish", "fetish"),
    ("corsets", "Corsets", "fetish", "fetish"),
    ("gloves", "Gloves", "fetish", "fetish"),
    ("lingerie", "Lingerie", "fetish", "fetish"),
    ("uniforms-fetish", "Uniform fetish", "fetish", "fetish"),
    ("smoke", "Smoke / cigar", "fetish", "fetish"),
    ("feet", "Feet", "fetish", "body"),
    ("hands", "Hands", "fetish", "body"),
    ("hair", "Hair", "fetish", "body"),
    ("muscles", "Muscles", "fetish", "body"),
    ("body-hair", "Body hair", "fetish", "body"),
    ("piercings", "Piercings", "body", "body"),
    ("tattoos", "Tattoos", "body", "body"),
    ("size-difference", "Size difference", "body", "body"),
    # Pet / ageplay (adult)
    ("puppy", "Puppy play", "pet", "pet-play"),
    ("kitten", "Kitten play", "pet", "pet-play"),
    ("pony", "Pony play", "pet", "pet-play"),
    ("handler", "Handler", "pet", "pet-play"),
    ("pup-training", "Pup training", "pet", "puppy"),
    ("littles", "Little space (adult)", "ageplay", "age-play"),
    ("caregiver", "Caregiver / CG", "ageplay", "age-play"),
    ("ddlg", "DDLG (adult)", "ageplay", "age-play"),
    ("mdlb", "MDLB (adult)", "ageplay", "age-play"),
    # Exhibition / group
    ("exhibitionism", "Exhibitionism", "exhibition", "exhibition"),
    ("voyeurism", "Voyeurism", "exhibition", "exhibition"),
    ("public-play", "Public play (legal/discreet)", "exhibition", "exhibition"),
    ("cuckolding", "Cuckolding", "group", "group"),
    ("hotwife", "Hotwife / stag", "group", "group"),
    ("swinging", "Swinging", "group", "group"),
    ("poly", "Polyamory-aware play", "group", "group"),
    ("threesome", "Threesomes", "group", "group"),
    ("orgy", "Group sex / orgy", "group", "group"),
    ("sharing", "Sharing / lending", "group", "group"),
    # Medical / edge (consensual adult)
    ("medical-play", "Medical play", "medical", "medical"),
    ("doctor-patient", "Doctor / patient", "medical", "medical"),
    ("exam", "Exam play", "medical", "medical"),
    ("enema", "Enema play", "medical", "medical"),
    ("catheter", "Catheter play", "medical", "medical"),
    ("breath", "Breath play (educated)", "edge", "edge"),
    ("choking", "Choking (educated)", "edge", "edge"),
    ("blood-play", "Blood play", "edge", "edge"),
    ("scarification", "Scarification", "edge", "edge"),
    ("branding", "Branding", "edge", "edge"),
    ("watersports", "Watersports", "edge", "edge"),
    ("scat", "Scat (niche)", "edge", "edge"),
    ("knife-edge", "Edge knife scenes", "edge", "edge"),
    # Psychological / intimacy-adjacent
    ("orgasm-control", "Orgasm control", "psychological", "psychological"),
    ("chastity", "Chastity", "psychological", "psychological"),
    ("denial", "Denial", "psychological", "psychological"),
    ("edging", "Edging", "psychological", "psychological"),
    ("tease-denial", "Tease & denial", "psychological", "psychological"),
    ("forced-orgasm", "Forced orgasm (consensual)", "psychological", "psychological"),
    ("free-use", "Free use (negotiated)", "psychological", "psychological"),
    ("ownership-marking", "Marking / ownership signs", "psychological", "psychological"),
    ("jealousy-play", "Jealousy play", "psychological", "psychological"),
    ("fear-play", "Fear play", "psychological", "psychological"),
    # Meta / aftercare / education
    ("negotiation", "Negotiation", "meta", "aftercare"),
    ("safewords", "Safewords & traffic lights", "meta", "aftercare"),
    ("aftercare-cuddles", "Aftercare cuddles", "meta", "aftercare"),
    ("drop-support", "Drop support", "meta", "aftercare"),
    ("scene-debrief", "Scene debrief", "meta", "aftercare"),
    ("consent-models", "Consent models", "meta", "education"),
    ("risk-aware", "RACK / PRICK", "meta", "education"),
    ("ssc", "SSC", "meta", "education"),
    ("rope-safety", "Rope safety", "meta", "education"),
    ("impact-safety", "Impact safety", "meta", "education"),
    ("first-aid", "Kink first aid", "meta", "education"),
    ("toy-care", "Toy care & hygiene", "meta", "education"),
    ("munches", "Munches & socials", "meta", "education"),
    ("dungeons", "Dungeon etiquette", "meta", "education"),
    ("vetting", "Vetting partners", "meta", "education"),
    ("limits-talk", "Limits discussion", "meta", "aftercare"),
    ("yes-no-maybe", "Yes/No/Maybe lists", "meta", "education"),
    ("journal", "Scene journaling", "meta", "education"),
    # Extra popular leaves
    ("anal", "Anal play", "body", "body"),
    ("oral", "Oral focus", "body", "body"),
    ("pegging", "Pegging", "body", "body"),
    ("strap-on", "Strap-on", "body", "body"),
    ("fisting", "Fisting", "body", "body"),
    ("prostate", "Prostate play", "body", "body"),
    ("nipple", "Nipple play", "body", "body"),
    ("breast", "Breast play", "body", "body"),
    ("genitorture", "Genitorture (CBT/TT)", "impact", "impact"),
    ("clamps", "Clamps", "sensation", "sensation"),
    ("weights", "Weights", "sensation", "sensation"),
    ("ice-impact", "Ice + impact", "sensation", "temperature"),
    ("hot-wax-art", "Wax art", "sensation", "wax"),
    ("shaving", "Shaving play", "body", "body"),
    ("makeup", "Makeup / transformation", "body", "body"),
    ("crossdress", "Crossdressing", "body", "body"),
    ("feminization", "Feminization", "roleplay", "roleplay"),
    ("masculinization", "Masculinization", "roleplay", "roleplay"),
    ("sissy", "Sissy play", "roleplay", "roleplay"),
    ("goddess", "Goddess worship", "service", "service"),
    ("worship", "Body worship", "service", "service"),
    ("financial", "Financial domination (consensual)", "power", "power-exchange"),
    ("findom", "Findom", "power", "financial"),
    ("keyholding", "Keyholding", "psychological", "chastity"),
    ("long-distance", "Long-distance D/s", "power", "power-exchange"),
    ("online-dom", "Online dynamics", "power", "power-exchange"),
    ("public-protocol", "Public protocol (discreet)", "protocol", "protocol"),
    ("kitchen-table", "Kitchen-table poly kink", "group", "poly"),
    ("relationship-anarchy", "Relationship anarchy + kink", "group", "poly"),
]


def seed_kink_tags(db) -> int:
    """Insert seed tags if table empty. Returns count inserted."""
    from sqlalchemy import func, select

    from app.models import KinkTag

    count = db.scalar(select(func.count()).select_from(KinkTag))
    if count and int(count) > 0:
        return 0

    slug_to_id: dict[str, int] = {}
    # Parents first: two passes
    pending = list(KINK_SEED)
    inserted = 0
    guard = 0
    while pending and guard < 10:
        guard += 1
        next_pending: list[tuple[str, str, str, str | None]] = []
        for slug, name, category, parent_slug in pending:
            parent_id = None
            if parent_slug:
                if parent_slug not in slug_to_id:
                    next_pending.append((slug, name, category, parent_slug))
                    continue
                parent_id = slug_to_id[parent_slug]
            tag = KinkTag(slug=slug, name=name, category=category, parent_id=parent_id)
            db.add(tag)
            db.flush()
            slug_to_id[slug] = tag.id
            inserted += 1
        pending = next_pending
    db.commit()
    return inserted
