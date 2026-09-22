const AGE_KEY = "cove_age_attested";
const AGE_VERSION = "v1";

export type AgeAttestation = {
  attested: true;
  is_18_plus: true;
  birth_year?: number;
  version: string;
  at: string; // ISO
};

export function readAgeAttestation(): AgeAttestation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgeAttestation>;
    if (
      parsed?.attested === true &&
      parsed.is_18_plus === true &&
      parsed.version === AGE_VERSION
    ) {
      return {
        attested: true,
        is_18_plus: true,
        birth_year:
          typeof parsed.birth_year === "number" ? parsed.birth_year : undefined,
        version: AGE_VERSION,
        at: typeof parsed.at === "string" ? parsed.at : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export type AttestInput = {
  is_18_plus: true;
  birth_year?: number;
};

export function writeAgeAttestation(input: AttestInput): AgeAttestation {
  const value: AgeAttestation = {
    attested: true,
    is_18_plus: true,
    version: AGE_VERSION,
    at: new Date().toISOString(),
  };
  if (typeof input.birth_year === "number") {
    value.birth_year = input.birth_year;
  }
  localStorage.setItem(AGE_KEY, JSON.stringify(value));
  return value;
}

export function clearAgeAttestation(): void {
  localStorage.removeItem(AGE_KEY);
}

export function hasAgeAttestation(): boolean {
  return readAgeAttestation() !== null;
}

/** Current calendar year in local time. */
export function currentYear(): number {
  return new Date().getFullYear();
}

/** Latest birth year that still means the person is ≥18. */
export function maxBirthYearFor18Plus(year = currentYear()): number {
  return year - 18;
}

export function isValidBirthYear(year: number, now = currentYear()): boolean {
  if (!Number.isInteger(year)) return false;
  if (year < 1900) return false;
  return year <= maxBirthYearFor18Plus(now);
}
