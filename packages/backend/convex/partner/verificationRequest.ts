/**
 * Contrat HTTP de l'API partenaire de vérification — validation PURE.
 *
 * Séparé des fonctions Convex pour être testable seul, comme
 * `partner/resolveRequest.ts`. Ce qui se joue ici n'est pas cosmétique : c'est
 * la frontière où une application tierce affirme « c'est l'agent X qui agit ».
 * Un `agentSub` vide ou absent qui passerait produirait des actes d'identité
 * sans auteur — inexploitables en audit, et impossibles à imputer après coup.
 */

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; message: string };

const MAX_NAME_LENGTH = 120;
const MAX_TEXT_LENGTH = 2000;
/** Aligné sur la garde de `applyLevel3Decision` : un motif doit être utile. */
const MIN_REASON_LENGTH = 5;

function fail<T>(error: string, message: string): ParseResult<T> {
  return { ok: false, error, message };
}

function asObject(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function trimmed(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Statuts acceptés en filtre de file. La liste est la MÊME que celle du
 * schéma : le parseur est le validateur, donc il rend le type déjà restreint
 * plutôt qu'un `string` que l'appelant devrait re-caster — un cast serait
 * l'endroit exact où un statut inconnu se glisserait jusqu'à l'index.
 */
export const QUEUE_STATUSES = [
  "waiting_controller",
  "claimed",
  "in_interview",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export type QueueQuery = {
  status?: QueueStatus;
  updatedSince?: number;
  limit?: number;
};

function asQueueStatus(value: string): QueueStatus | null {
  return (QUEUE_STATUSES as readonly string[]).includes(value)
    ? (value as QueueStatus)
    : null;
}

/**
 * Lecture de la file.
 *
 * `status` et `updatedSince` sont EXCLUSIFS : le premier sert la file de
 * travail, le second la resynchronisation. Les combiner donnerait un résultat
 * silencieusement partiel — une resync filtrée par statut manquerait
 * précisément les demandes passées à un statut qu'on ne demande pas, c'est-à-dire
 * les divergences qu'on cherche à réparer.
 */
export function parseQueueQuery(params: URLSearchParams): ParseResult<QueueQuery> {
  const rawStatus = params.get("status")?.trim() || undefined;
  const rawSince = params.get("updatedSince")?.trim() || undefined;
  const rawLimit = params.get("limit")?.trim() || undefined;

  if (rawStatus && rawSince) {
    return fail(
      "ambiguous_query",
      "status et updatedSince s'excluent : la resynchronisation ignore le statut.",
    );
  }
  const status = rawStatus ? asQueueStatus(rawStatus) : undefined;
  if (rawStatus && status === null) {
    return fail(
      "invalid_status",
      `Statut inconnu : ${rawStatus}. Valides : ${QUEUE_STATUSES.join(", ")}.`,
    );
  }

  let updatedSince: number | undefined;
  if (rawSince !== undefined) {
    const parsed = Number(rawSince);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fail(
        "invalid_updated_since",
        "updatedSince doit être un horodatage epoch en millisecondes.",
      );
    }
    updatedSince = parsed;
  }

  let limit: number | undefined;
  if (rawLimit !== undefined) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      return fail("invalid_limit", "limit doit être un entier entre 1 et 200.");
    }
    limit = parsed;
  }

  return {
    ok: true,
    value: { status: status ?? undefined, updatedSince, limit },
  };
}

export type AgentActedRequest = {
  verificationId: string;
  agentSub: string;
  agentName?: string;
};

/**
 * Socle commun de tout acte partenaire : quelle demande, et QUI agit.
 * Le partenaire vouche pour son agent ; sans `agentSub`, l'acte serait
 * anonyme et l'audit d'identite.ga ne remonterait qu'à une clé API.
 */
export function parseAgentActedRequest(
  body: unknown,
): ParseResult<AgentActedRequest> {
  const raw = asObject(body);
  if (!raw) return fail("invalid_body", "Le corps JSON doit être un objet.");

  const verificationId = trimmed(raw.verificationId);
  if (!verificationId) {
    return fail("missing_verification_id", "verificationId est requis.");
  }
  const agentSub = trimmed(raw.agentSub);
  if (!agentSub) {
    return fail(
      "missing_agent",
      "agentSub est requis : tout acte doit être imputable à un agent identifié.",
    );
  }
  const agentName = trimmed(raw.agentName);
  if (agentName && agentName.length > MAX_NAME_LENGTH) {
    return fail("invalid_agent_name", "agentName dépasse 120 caractères.");
  }

  return { ok: true, value: { verificationId, agentSub, agentName } };
}

export type DecisionRequest = AgentActedRequest & {
  decision: "approved" | "rejected";
  notes?: string;
  reason?: string;
};

export function parseDecisionRequest(
  body: unknown,
): ParseResult<DecisionRequest> {
  const base = parseAgentActedRequest(body);
  if (!base.ok) return base;

  const raw = asObject(body)!;
  const decision = trimmed(raw.decision);
  if (decision !== "approved" && decision !== "rejected") {
    return fail(
      "invalid_decision",
      "decision doit valoir approved ou rejected.",
    );
  }

  const notes = trimmed(raw.notes);
  const reason = trimmed(raw.reason);
  if (decision === "rejected" && (!reason || reason.length < MIN_REASON_LENGTH)) {
    // Refusé ici plutôt que dans la mutation : le motif part au citoyen, une
    // décision négative sans explication utilisable n'est pas notifiable.
    return fail(
      "missing_reason",
      "Un motif d'au moins 5 caractères est requis pour un refus.",
    );
  }
  if (
    (notes && notes.length > MAX_TEXT_LENGTH) ||
    (reason && reason.length > MAX_TEXT_LENGTH)
  ) {
    return fail("invalid_text", "notes et reason sont limités à 2000 caractères.");
  }

  return { ok: true, value: { ...base.value, decision, notes, reason } };
}

export type AvailabilityRequest = {
  agentSub: string;
  startsAt: number;
  endsAt: number;
  durationMinutes: 30 | 45 | 60;
};

export function parseAvailabilityRequest(
  body: unknown,
): ParseResult<AvailabilityRequest> {
  const raw = asObject(body);
  if (!raw) return fail("invalid_body", "Le corps JSON doit être un objet.");

  const agentSub = trimmed(raw.agentSub);
  if (!agentSub) return fail("missing_agent", "agentSub est requis.");

  const startsAt = Number(raw.startsAt);
  const endsAt = Number(raw.endsAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    return fail(
      "invalid_range",
      "startsAt et endsAt doivent être des horodatages en millisecondes.",
    );
  }
  if (endsAt <= startsAt) {
    return fail("invalid_range", "endsAt doit être postérieur à startsAt.");
  }

  const duration = Number(raw.durationMinutes);
  if (duration !== 30 && duration !== 45 && duration !== 60) {
    return fail(
      "invalid_duration",
      "durationMinutes doit valoir 30, 45 ou 60.",
    );
  }

  return {
    ok: true,
    value: { agentSub, startsAt, endsAt, durationMinutes: duration },
  };
}
