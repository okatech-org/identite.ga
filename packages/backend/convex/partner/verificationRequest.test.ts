import { describe, expect, test } from "vitest";

import {
  parseAgentActedRequest,
  parseAvailabilityRequest,
  parseDecisionRequest,
  parseQueueQuery,
} from "./verificationRequest";

describe("lecture de la file partenaire", () => {
  test("accepte la file de travail par statut", () => {
    const result = parseQueueQuery(
      new URLSearchParams({ status: "waiting_controller", limit: "20" }),
    );
    expect(result).toEqual({
      ok: true,
      value: { status: "waiting_controller", updatedSince: undefined, limit: 20 },
    });
  });

  test("accepte une resynchronisation par horodatage", () => {
    const result = parseQueueQuery(
      new URLSearchParams({ updatedSince: "1750000000000" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.updatedSince).toBe(1750000000000);
  });

  test("refuse de combiner statut et resynchronisation", () => {
    // Une resync filtrée par statut manquerait exactement les demandes passées
    // à un statut non demandé — c'est-à-dire les divergences à réparer. Mieux
    // vaut refuser que renvoyer un résultat silencieusement partiel.
    const result = parseQueueQuery(
      new URLSearchParams({ status: "claimed", updatedSince: "1" }),
    );
    expect(result).toMatchObject({ ok: false, error: "ambiguous_query" });
  });

  test("refuse un statut inconnu", () => {
    expect(
      parseQueueQuery(new URLSearchParams({ status: "en_cours" })),
    ).toMatchObject({ ok: false, error: "invalid_status" });
  });

  test("borne la pagination", () => {
    expect(
      parseQueueQuery(new URLSearchParams({ limit: "500" })),
    ).toMatchObject({ ok: false, error: "invalid_limit" });
    expect(parseQueueQuery(new URLSearchParams({ limit: "0" }))).toMatchObject({
      ok: false,
      error: "invalid_limit",
    });
  });
});

describe("imputabilité d'un acte partenaire", () => {
  test("exige un agent identifié", () => {
    // Sans agentSub, l'audit d'identite.ga ne remonterait qu'à une clé API :
    // on saurait quelle application a agi, jamais quelle personne.
    expect(parseAgentActedRequest({ verificationId: "v1" })).toMatchObject({
      ok: false,
      error: "missing_agent",
    });
    expect(
      parseAgentActedRequest({ verificationId: "v1", agentSub: "   " }),
    ).toMatchObject({ ok: false, error: "missing_agent" });
  });

  test("exige la demande visée", () => {
    expect(parseAgentActedRequest({ agentSub: "agent_1" })).toMatchObject({
      ok: false,
      error: "missing_verification_id",
    });
  });

  test("accepte un acte complet et normalise les espaces", () => {
    expect(
      parseAgentActedRequest({
        verificationId: " v1 ",
        agentSub: " agent_1 ",
        agentName: " Awa Ondo ",
      }),
    ).toEqual({
      ok: true,
      value: {
        verificationId: "v1",
        agentSub: "agent_1",
        agentName: "Awa Ondo",
      },
    });
  });

  test("refuse un corps non objet", () => {
    expect(parseAgentActedRequest("v1")).toMatchObject({
      ok: false,
      error: "invalid_body",
    });
    expect(parseAgentActedRequest([])).toMatchObject({
      ok: false,
      error: "invalid_body",
    });
  });
});

describe("décision partenaire", () => {
  const base = { verificationId: "v1", agentSub: "agent_1" };

  test("accepte une approbation avec notes", () => {
    const result = parseDecisionRequest({
      ...base,
      decision: "approved",
      notes: "Pièces conformes.",
    });
    expect(result).toMatchObject({
      ok: true,
      value: { decision: "approved", notes: "Pièces conformes." },
    });
  });

  test("exige un motif exploitable pour un refus", () => {
    // Le motif est transmis au citoyen : un refus sans explication utilisable
    // le laisse sans moyen de corriger sa demande.
    expect(
      parseDecisionRequest({ ...base, decision: "rejected" }),
    ).toMatchObject({ ok: false, error: "missing_reason" });
    expect(
      parseDecisionRequest({ ...base, decision: "rejected", reason: "non" }),
    ).toMatchObject({ ok: false, error: "missing_reason" });
    expect(
      parseDecisionRequest({
        ...base,
        decision: "rejected",
        reason: "Pièce illisible",
      }),
    ).toMatchObject({ ok: true });
  });

  test("refuse une décision hors contrat", () => {
    expect(
      parseDecisionRequest({ ...base, decision: "peut_etre" }),
    ).toMatchObject({ ok: false, error: "invalid_decision" });
    expect(parseDecisionRequest(base)).toMatchObject({
      ok: false,
      error: "invalid_decision",
    });
  });

  test("hérite du contrôle d'imputabilité", () => {
    expect(
      parseDecisionRequest({ verificationId: "v1", decision: "approved" }),
    ).toMatchObject({ ok: false, error: "missing_agent" });
  });

  test("borne les textes libres", () => {
    expect(
      parseDecisionRequest({
        ...base,
        decision: "approved",
        notes: "x".repeat(2001),
      }),
    ).toMatchObject({ ok: false, error: "invalid_text" });
  });
});

describe("publication de disponibilité", () => {
  const base = { agentSub: "agent_1", startsAt: 1000, endsAt: 5000 };

  test("accepte une plage valide", () => {
    expect(
      parseAvailabilityRequest({ ...base, durationMinutes: 45 }),
    ).toEqual({
      ok: true,
      value: { agentSub: "agent_1", startsAt: 1000, endsAt: 5000, durationMinutes: 45 },
    });
  });

  test("refuse une durée hors barème", () => {
    expect(
      parseAvailabilityRequest({ ...base, durationMinutes: 20 }),
    ).toMatchObject({ ok: false, error: "invalid_duration" });
  });

  test("refuse une plage inversée ou non numérique", () => {
    expect(
      parseAvailabilityRequest({
        agentSub: "agent_1",
        startsAt: 5000,
        endsAt: 1000,
        durationMinutes: 30,
      }),
    ).toMatchObject({ ok: false, error: "invalid_range" });
    expect(
      parseAvailabilityRequest({
        agentSub: "agent_1",
        startsAt: "demain",
        endsAt: 1000,
        durationMinutes: 30,
      }),
    ).toMatchObject({ ok: false, error: "invalid_range" });
  });

  test("exige un agent identifié", () => {
    expect(
      parseAvailabilityRequest({ ...base, agentSub: "", durationMinutes: 30 }),
    ).toMatchObject({ ok: false, error: "missing_agent" });
  });
});
