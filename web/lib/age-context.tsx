"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readAgeAttestation,
  writeAgeAttestation,
  type AgeAttestation,
  type AttestInput,
} from "./age-gate";

type AgeContextValue = {
  ready: boolean;
  attested: boolean;
  attestation: AgeAttestation | null;
  attest: (input: AttestInput) => void;
};

const AgeContext = createContext<AgeContextValue | null>(null);

export function AgeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [attestation, setAttestation] = useState<AgeAttestation | null>(null);

  useEffect(() => {
    setAttestation(readAgeAttestation());
    setReady(true);
  }, []);

  const attest = useCallback((input: AttestInput) => {
    setAttestation(writeAgeAttestation(input));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      attested: !!attestation,
      attestation,
      attest,
    }),
    [ready, attestation, attest]
  );

  return <AgeContext.Provider value={value}>{children}</AgeContext.Provider>;
}

export function useAge(): AgeContextValue {
  const ctx = useContext(AgeContext);
  if (!ctx) throw new Error("useAge must be used within AgeProvider");
  return ctx;
}
