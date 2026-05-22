"use client"

/**
 * Catalogue iCV — 12 modèles de CV visuellement distincts.
 *
 * Chaque template est une fonction qui prend un `PreviewCv` et rend une
 * mise en page complète à l'échelle 1 (W=320, H=452 — ratio A4 ×0.226).
 * On utilise des tailles ≈ 7-12px parce qu'on rend la page A4 entière dans
 * une zone d'aperçu très compacte ; les exports PDF se font avec
 * `@react-pdf/renderer` côté serveur, à la vraie taille A4.
 *
 * Sources d'inspiration : Resume.io, Canva, NovoResume, Harvard Extension,
 * Kickresume, Enhancv. On reprend 4 grandes familles :
 *   • bande de couleur en haut, corps en colonne unique
 *   • sidebar colorée à gauche, corps à droite
 *   • centré minimaliste (Harvard / classique)
 *   • bicolonne dense (académique / compact)
 *
 * Pour ajouter un template : importer le composant + l'enregistrer dans
 * `TEMPLATES` plus bas, et l'ajouter à `_content/themes.ts`.
 */

import * as React from "react"

import type { PreviewCv } from "./cv-preview-a4"

// ─────────────────────────────────────────────────────────────────────────
// Constantes communes
// ─────────────────────────────────────────────────────────────────────────

export const W = 320
export const H = 452

const SANS = 'system-ui, -apple-system, "Segoe UI", Inter, sans-serif'
const SERIF = '"IBM Plex Serif", Georgia, "Times New Roman", serif'
const MONO = '"IBM Plex Mono", "JetBrains Mono", Menlo, monospace'

function formatRange(start: string, end?: string, current?: boolean) {
  if (current) return `${start} → Présent`
  if (!end) return start || ""
  return `${start} → ${end}`
}

function initials(cv: PreviewCv) {
  return `${(cv.firstName || "?")[0] ?? ""}${(cv.lastName || "?")[0] ?? ""}`.toUpperCase()
}

function fullName(cv: PreviewCv) {
  return `${cv.firstName} ${cv.lastName}`.trim() || "—"
}

function role(cv: PreviewCv) {
  return cv.experiences[0]?.title ?? ""
}

// ─────────────────────────────────────────────────────────────────────────
// 1. MODERN — Sidebar foncée avec avatar + corps clair avec timeline
// ─────────────────────────────────────────────────────────────────────────

function TplModern({ cv }: { cv: PreviewCv }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", display: "flex", fontFamily: SANS, color: "#1e293b", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 110, background: "#0f172a", color: "#fff", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 9999, background: "#334155", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: "2px solid #475569" }}>{initials(cv)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginTop: 6, lineHeight: 1.15 }}>{cv.firstName.toUpperCase()}<br />{cv.lastName.toUpperCase()}</div>
          {role(cv) && <div style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 3 }}>{role(cv)}</div>}
        </div>
        <div style={{ height: 1, background: "#1e293b" }} />
        <div style={{ fontSize: 7, lineHeight: 1.5 }}>
          {cv.email && <div style={{ marginBottom: 2, opacity: 0.92 }}>✉ {cv.email}</div>}
          {cv.phone && <div style={{ marginBottom: 2, opacity: 0.92 }}>☎ {cv.phone}</div>}
          {cv.address && <div style={{ opacity: 0.92 }}>⌖ {cv.address}</div>}
        </div>
        {cv.skills.length > 0 && (
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1, borderBottom: "1px solid #1e293b", paddingBottom: 3, marginBottom: 4 }}>COMPÉTENCES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {cv.skills.slice(0, 10).map((s) => (
                <span key={s.id} style={{ fontSize: 6.5, background: "#1e293b", padding: "2px 6px", borderRadius: 9999 }}>{s.name}</span>
              ))}
            </div>
          </div>
        )}
        {cv.languages.length > 0 && (
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1, borderBottom: "1px solid #1e293b", paddingBottom: 3, marginBottom: 4 }}>LANGUES</div>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 7 }}><span>{l.name}</span><span style={{ color: "#94a3b8" }}>{l.level}</span></div>
            ))}
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: 14, overflow: "hidden" }}>
        {cv.summary && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, borderBottom: "1.5px solid #0f172a", paddingBottom: 3, marginBottom: 5 }}>PROFIL</div>
            <p style={{ fontSize: 7.5, lineHeight: 1.5, color: "#475569", margin: 0 }}>{cv.summary}</p>
          </div>
        )}
        {cv.experiences.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, borderBottom: "1.5px solid #0f172a", paddingBottom: 3, marginBottom: 6 }}>EXPÉRIENCE</div>
            {cv.experiences.map((e) => (
              <div key={e.id} style={{ position: "relative", paddingLeft: 9, borderLeft: "1.5px solid #e2e8f0", marginBottom: 6 }}>
                <span style={{ position: "absolute", left: -3, top: 2, width: 5, height: 5, borderRadius: 9999, background: "#0f172a", border: "1px solid #fff" }} />
                <div style={{ fontSize: 8.5, fontWeight: 700 }}>{e.title}</div>
                <div style={{ fontSize: 7.5, color: "#64748b", fontWeight: 600 }}>{e.company}</div>
                <div style={{ fontSize: 6.5, color: "#94a3b8", fontFamily: MONO }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
                {e.description && <p style={{ fontSize: 7, color: "#475569", lineHeight: 1.45, margin: "2px 0 0" }}>{e.description}</p>}
              </div>
            ))}
          </div>
        )}
        {cv.education.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, borderBottom: "1.5px solid #0f172a", paddingBottom: 3, marginBottom: 5 }}>FORMATION</div>
            {cv.education.map((e) => (
              <div key={e.id} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 8, fontWeight: 700 }}>{e.degree}</div>
                <div style={{ fontSize: 7, color: "#64748b" }}>{e.school} · <span style={{ fontFamily: MONO, color: "#94a3b8" }}>{e.year}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 2. CLASSIC — Centré, serif, lignes horizontales, zéro couleur (Harvard)
// ─────────────────────────────────────────────────────────────────────────

function TplClassic({ cv }: { cv: PreviewCv }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#111827", fontFamily: SERIF, padding: 20, overflow: "hidden" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #111827", paddingBottom: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{fullName(cv).toUpperCase()}</div>
        {role(cv) && <div style={{ fontSize: 9, fontStyle: "italic", marginTop: 2, color: "#374151" }}>{role(cv)}</div>}
        <div style={{ fontSize: 7.5, color: "#4b5563", marginTop: 4 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join(" · ")}</div>
      </div>
      {cv.summary && (
        <p style={{ fontSize: 7.5, color: "#374151", lineHeight: 1.6, textAlign: "justify", margin: "0 0 10px", fontStyle: "italic" }}>{cv.summary}</p>
      )}
      {cv.experiences.length > 0 && (
        <Section title="Expérience professionnelle" serif>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 8.5, fontWeight: 700 }}>{e.title}</div>
                <div style={{ fontSize: 7, color: "#6b7280", fontStyle: "italic" }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
              </div>
              <div style={{ fontSize: 8, fontStyle: "italic", color: "#374151" }}>{e.company}</div>
              {e.description && <p style={{ fontSize: 7, lineHeight: 1.5, color: "#4b5563", margin: "2px 0 0" }}>{e.description}</p>}
            </div>
          ))}
        </Section>
      )}
      {cv.education.length > 0 && (
        <Section title="Formation" serif>
          {cv.education.map((e) => (
            <div key={e.id} style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700 }}>{e.degree}</div>
                <div style={{ fontSize: 7.5, fontStyle: "italic", color: "#374151" }}>{e.school}</div>
              </div>
              <div style={{ fontSize: 7, color: "#6b7280", fontStyle: "italic" }}>{e.year}</div>
            </div>
          ))}
        </Section>
      )}
      {(cv.skills.length > 0 || cv.languages.length > 0) && (
        <Section title="Compétences & Langues" serif>
          {cv.skills.length > 0 && <div style={{ fontSize: 7.5, color: "#374151", marginBottom: 3 }}>{cv.skills.map((s) => s.name).join(" · ")}</div>}
          {cv.languages.length > 0 && <div style={{ fontSize: 7.5, color: "#374151", fontStyle: "italic" }}>{cv.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</div>}
        </Section>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 3. MINIMALIST — Beaucoup d'air, typographie fine, gris uniquement
// ─────────────────────────────────────────────────────────────────────────

function TplMinimalist({ cv }: { cv: PreviewCv }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#0f172a", fontFamily: SANS, padding: 24, overflow: "hidden" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 200, letterSpacing: -0.5, lineHeight: 1.05 }}>{cv.firstName} <span style={{ fontWeight: 600 }}>{cv.lastName}</span></div>
        {role(cv) && <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 3, letterSpacing: 0.3 }}>{role(cv)}</div>}
        <div style={{ fontSize: 7, color: "#94a3b8", marginTop: 8, letterSpacing: 0.4 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join("  •  ")}</div>
      </div>
      {cv.summary && <p style={{ fontSize: 7.5, color: "#475569", lineHeight: 1.7, margin: "0 0 16px" }}>{cv.summary}</p>}
      {cv.experiences.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2.5, color: "#94a3b8", marginBottom: 8 }}>EXPÉRIENCE</div>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 7.5, color: "#64748b" }}>{e.company} <span style={{ color: "#94a3b8" }}>· {formatRange(e.startDate, e.endDate, e.current)}</span></div>
              {e.description && <p style={{ fontSize: 7, lineHeight: 1.55, color: "#475569", margin: "3px 0 0" }}>{e.description}</p>}
            </div>
          ))}
        </div>
      )}
      {cv.education.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2.5, color: "#94a3b8", marginBottom: 6 }}>FORMATION</div>
          {cv.education.map((e) => (
            <div key={e.id} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 8.5, fontWeight: 600 }}>{e.degree}</div>
              <div style={{ fontSize: 7.5, color: "#64748b" }}>{e.school} <span style={{ color: "#94a3b8" }}>· {e.year}</span></div>
            </div>
          ))}
        </div>
      )}
      {cv.skills.length > 0 && (
        <div>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2.5, color: "#94a3b8", marginBottom: 5 }}>COMPÉTENCES</div>
          <div style={{ fontSize: 8, color: "#334155" }}>{cv.skills.map((s) => s.name).join(" · ")}</div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 4. PROFESSIONAL — Bicolonne 35/65 avec accent teal
// ─────────────────────────────────────────────────────────────────────────

function TplProfessional({ cv }: { cv: PreviewCv }) {
  const C = "#0f766e"
  return (
    <div style={{ width: W, height: H, background: "#fff", fontFamily: SANS, color: "#1f2937", overflow: "hidden" }}>
      <div style={{ background: C, color: "#fff", padding: "12px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1 }}>{fullName(cv)}</div>
        {role(cv) && <div style={{ fontSize: 9, opacity: 0.92, marginTop: 3 }}>{role(cv)}</div>}
      </div>
      <div style={{ display: "flex", height: H - 50, overflow: "hidden" }}>
        <div style={{ width: "38%", background: "#f3f4f6", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 3 }}>CONTACT</div>
            <div style={{ fontSize: 7, color: "#374151", lineHeight: 1.5 }}>
              {cv.email && <div>{cv.email}</div>}
              {cv.phone && <div>{cv.phone}</div>}
              {cv.address && <div>{cv.address}</div>}
              {cv.linkedinUrl && <div style={{ color: C }}>{cv.linkedinUrl}</div>}
            </div>
          </div>
          {cv.skills.length > 0 && (
            <div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 3 }}>COMPÉTENCES</div>
              {cv.skills.slice(0, 12).map((s) => (
                <div key={s.id} style={{ fontSize: 7, color: "#374151", marginBottom: 1 }}>{s.name}</div>
              ))}
            </div>
          )}
          {cv.languages.length > 0 && (
            <div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 3 }}>LANGUES</div>
              {cv.languages.map((l) => (
                <div key={l.id} style={{ fontSize: 7, color: "#374151" }}>{l.name} <span style={{ color: "#6b7280" }}>· {l.level}</span></div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: "12px 14px", overflow: "hidden" }}>
          {cv.summary && (
            <>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 3 }}>PROFIL</div>
              <p style={{ fontSize: 7, color: "#4b5563", lineHeight: 1.5, margin: "0 0 8px" }}>{cv.summary}</p>
            </>
          )}
          {cv.experiences.length > 0 && (
            <>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 4 }}>EXPÉRIENCE</div>
              {cv.experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 8, fontWeight: 700 }}>{e.title}</div>
                    <div style={{ fontSize: 6.5, color: "#6b7280" }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
                  </div>
                  <div style={{ fontSize: 7.5, color: C, fontWeight: 600 }}>{e.company}</div>
                  {e.description && <p style={{ fontSize: 6.5, color: "#4b5563", lineHeight: 1.45, margin: "1px 0 0" }}>{e.description}</p>}
                </div>
              ))}
            </>
          )}
          {cv.education.length > 0 && (
            <>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: C, letterSpacing: 1, marginBottom: 3 }}>FORMATION</div>
              {cv.education.map((e) => (
                <div key={e.id} style={{ marginBottom: 3 }}>
                  <div style={{ fontSize: 7.5, fontWeight: 600 }}>{e.degree}</div>
                  <div style={{ fontSize: 7, color: "#6b7280" }}>{e.school} · {e.year}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 5. CREATIVE — Header gradient + cartes glass, Canva-style
// ─────────────────────────────────────────────────────────────────────────

function TplCreative({ cv }: { cv: PreviewCv }) {
  return (
    <div style={{ width: W, height: H, background: "linear-gradient(135deg, #fff1f2, #f5f3ff)", color: "#1f2937", fontFamily: SANS, padding: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #fb7185, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 10px rgba(168,85,247,0.3)" }}>{initials(cv)}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, background: "linear-gradient(90deg, #e11d48, #7c3aed)", WebkitBackgroundClip: "text", color: "transparent" }}>{fullName(cv)}</div>
          {role(cv) && <div style={{ fontSize: 8, color: "#7c3aed", fontWeight: 600 }}>{role(cv)}</div>}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
        {[cv.email, cv.phone, cv.address].filter(Boolean).map((x) => (
          <span key={x} style={{ fontSize: 6.5, color: "#6b7280", background: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: 9999 }}>{x}</span>
        ))}
      </div>
      {cv.summary && (
        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: 8, border: "1px solid rgba(255,255,255,0.6)", marginBottom: 7 }}>
          <p style={{ fontSize: 7, color: "#4b5563", lineHeight: 1.5, margin: 0 }}>{cv.summary}</p>
        </div>
      )}
      {cv.experiences.length > 0 && (
        <div style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "#7c3aed", marginBottom: 4 }}>✦ EXPÉRIENCE</div>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: 7, border: "1px solid rgba(255,255,255,0.6)", marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700 }}>{e.title}</div>
                  <div style={{ fontSize: 7, color: "#7c3aed", fontWeight: 600 }}>{e.company}</div>
                </div>
                <span style={{ fontSize: 6, color: "#6b7280", background: "#f3f4f6", padding: "1px 4px", borderRadius: 9999 }}>{formatRange(e.startDate, e.endDate, e.current)}</span>
              </div>
              {e.description && <p style={{ fontSize: 6.5, color: "#6b7280", margin: "3px 0 0", lineHeight: 1.45 }}>{e.description}</p>}
            </div>
          ))}
        </div>
      )}
      {cv.skills.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "#7c3aed", marginBottom: 3 }}>✦ COMPÉTENCES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {cv.skills.map((s) => <span key={s.id} style={{ fontSize: 6.5, padding: "2px 7px", borderRadius: 9999, background: "linear-gradient(90deg, #fce7f3, #ede9fe)", color: "#4b5563", border: "1px solid rgba(252,231,243,0.6)" }}>{s.name}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 6. STARTUP — Orange dynamique, headers serrés
// ─────────────────────────────────────────────────────────────────────────

function TplStartup({ cv }: { cv: PreviewCv }) {
  const C = "#f97316"
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#0f172a", fontFamily: SANS, padding: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: `2px solid ${C}` }}>
        <div style={{ width: 4, height: 30, background: C, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>{fullName(cv)}</div>
          {role(cv) && <div style={{ fontSize: 8.5, color: C, fontWeight: 600, marginTop: 2 }}>{role(cv)}</div>}
        </div>
      </div>
      <div style={{ fontSize: 6.5, color: "#64748b", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cv.email && <span>✉ {cv.email}</span>}
        {cv.phone && <span>☎ {cv.phone}</span>}
        {cv.linkedinUrl && <span style={{ color: C }}>in/{cv.linkedinUrl.split("/").pop()}</span>}
      </div>
      {cv.summary && <p style={{ fontSize: 7.5, color: "#475569", lineHeight: 1.5, margin: "8px 0 8px" }}>{cv.summary}</p>}
      {cv.experiences.length > 0 && (
        <div style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ background: C, color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 7, letterSpacing: 1 }}>EXP</span>
            <span style={{ letterSpacing: 0.5 }}>Expériences</span>
          </div>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ background: "#fff7ed", borderRadius: 8, padding: 7, marginBottom: 4, borderLeft: `2px solid ${C}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 8.5, fontWeight: 700 }}>{e.title}</div>
                <div style={{ fontSize: 6.5, color: "#78350f", fontWeight: 600 }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
              </div>
              <div style={{ fontSize: 7, color: C, fontWeight: 600 }}>{e.company}</div>
              {e.description && <p style={{ fontSize: 6.5, color: "#475569", margin: "2px 0 0", lineHeight: 1.45 }}>{e.description}</p>}
            </div>
          ))}
        </div>
      )}
      {cv.education.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ background: C, color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 7, letterSpacing: 1 }}>EDU</span>
            <span>Formation</span>
          </div>
          {cv.education.map((e) => (
            <div key={e.id} style={{ fontSize: 7.5, marginBottom: 2 }}>
              <span style={{ fontWeight: 700 }}>{e.degree}</span> · <span style={{ color: "#64748b" }}>{e.school}</span> · <span style={{ color: "#94a3b8", fontSize: 7 }}>{e.year}</span>
            </div>
          ))}
        </div>
      )}
      {cv.skills.length > 0 && (
        <div>
          <div style={{ fontSize: 7.5, fontWeight: 800, marginBottom: 3, letterSpacing: 0.5 }}>STACK</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {cv.skills.map((s) => <span key={s.id} style={{ fontSize: 6.5, padding: "1.5px 6px", borderRadius: 4, background: "#fff7ed", border: `1px solid ${C}`, color: "#9a3412", fontWeight: 600 }}>{s.name}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 7. BOLD — Nom géant, blocs de couleur, statement
// ─────────────────────────────────────────────────────────────────────────

function TplBold({ cv }: { cv: PreviewCv }) {
  const C = "#7c3aed"
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#111827", fontFamily: SANS, padding: 16, overflow: "hidden" }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 0.95, letterSpacing: -1, color: C, textTransform: "uppercase" }}>{cv.firstName}</div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 0.95, letterSpacing: -1, color: "#111827", textTransform: "uppercase" }}>{cv.lastName}</div>
        {role(cv) && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginTop: 6, color: C, textTransform: "uppercase" }}>{role(cv)}</div>}
      </div>
      <div style={{ fontSize: 7, color: "#374151", marginBottom: 10, letterSpacing: 0.2 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join(" / ")}</div>
      {cv.summary && (
        <>
          <SectionTitleBold>Profil</SectionTitleBold>
          <p style={{ fontSize: 7.5, color: "#374151", lineHeight: 1.55, margin: "0 0 8px" }}>{cv.summary}</p>
        </>
      )}
      {cv.experiences.length > 0 && (
        <>
          <SectionTitleBold>Expérience</SectionTitleBold>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{e.title}</div>
              <div style={{ fontSize: 7, color: "#4b5563", fontWeight: 600 }}>{e.company} · {formatRange(e.startDate, e.endDate, e.current)}</div>
              {e.description && <p style={{ fontSize: 7, color: "#4b5563", margin: "2px 0 0", lineHeight: 1.45 }}>{e.description}</p>}
            </div>
          ))}
        </>
      )}
      {cv.skills.length > 0 && (
        <>
          <SectionTitleBold>Skills</SectionTitleBold>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {cv.skills.map((s) => <span key={s.id} style={{ fontSize: 7, padding: "2px 7px", background: C, color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.name}</span>)}
          </div>
        </>
      )}
    </div>
  )
}

function SectionTitleBold({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#111827", color: "#fff", padding: "2px 6px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, display: "inline-block", marginTop: 4, marginBottom: 5 }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 8. TECH — Fond sombre, accents cyan, mono, terminal
// ─────────────────────────────────────────────────────────────────────────

function TplTech({ cv }: { cv: PreviewCv }) {
  const C = "#06b6d4"
  return (
    <div style={{ width: W, height: H, background: "#0b1220", color: "#e2e8f0", fontFamily: MONO, padding: 14, overflow: "hidden", fontSize: 7 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: C, fontSize: 8 }}>$ whoami</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>{fullName(cv)}</div>
        {role(cv) && <div style={{ fontSize: 8, color: C }}># {role(cv)}</div>}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 6.5, marginBottom: 8 }}>
        {cv.email && <div>email   : {cv.email}</div>}
        {cv.phone && <div>phone   : {cv.phone}</div>}
        {cv.address && <div>location: {cv.address}</div>}
        {cv.linkedinUrl && <div>linkedin: <span style={{ color: C }}>{cv.linkedinUrl}</span></div>}
      </div>
      {cv.summary && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: C }}>{">"} cat about.md</div>
          <p style={{ fontSize: 7, color: "#cbd5e1", lineHeight: 1.5, margin: "2px 0 0" }}>{cv.summary}</p>
        </div>
      )}
      {cv.experiences.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: C }}>{">"} ls -la experience/</div>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginTop: 3, marginBottom: 3 }}>
              <div style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>{e.title}<span style={{ color: "#64748b" }}> @ </span><span style={{ color: C }}>{e.company}</span></div>
              <div style={{ fontSize: 6.5, color: "#64748b" }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
              {e.description && <p style={{ fontSize: 6.5, color: "#94a3b8", margin: "1px 0 0", lineHeight: 1.4 }}>{e.description}</p>}
            </div>
          ))}
        </div>
      )}
      {cv.skills.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ color: C }}>{">"} cat stack.json</div>
          <div style={{ fontSize: 7, color: "#cbd5e1", marginTop: 2, lineHeight: 1.5 }}>
            <span style={{ color: "#64748b" }}>[</span>{cv.skills.map((s, i) => <span key={s.id}><span style={{ color: "#fbbf24" }}>"{s.name}"</span>{i < cv.skills.length - 1 ? ", " : ""}</span>)}<span style={{ color: "#64748b" }}>]</span>
          </div>
        </div>
      )}
      {cv.education.length > 0 && (
        <div>
          <div style={{ color: C }}>{">"} ls education/</div>
          {cv.education.map((e) => (
            <div key={e.id} style={{ fontSize: 7, color: "#cbd5e1" }}>{e.degree} <span style={{ color: "#64748b" }}>· {e.school} · {e.year}</span></div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 9. ACADEMIC — Serif dense, bicolonne, formel
// ─────────────────────────────────────────────────────────────────────────

function TplAcademic({ cv }: { cv: PreviewCv }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#1f2937", fontFamily: SERIF, padding: 16, overflow: "hidden" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>{fullName(cv)}</div>
        {role(cv) && <div style={{ fontSize: 9, fontStyle: "italic", color: "#374151" }}>{role(cv)}</div>}
        <div style={{ fontSize: 7, color: "#6b7280", marginTop: 3 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join(" · ")}</div>
        <div style={{ height: 1, background: "#1f2937", margin: "6px 30%" }} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1.5 }}>
          {cv.summary && (
            <>
              <SectionAcademic>Résumé</SectionAcademic>
              <p style={{ fontSize: 7, color: "#374151", lineHeight: 1.55, margin: "0 0 6px", textAlign: "justify" }}>{cv.summary}</p>
            </>
          )}
          {cv.experiences.length > 0 && (
            <>
              <SectionAcademic>Expérience</SectionAcademic>
              {cv.experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 8, fontWeight: 700 }}>{e.title}</div>
                  <div style={{ fontSize: 7, fontStyle: "italic", color: "#4b5563" }}>{e.company}, {formatRange(e.startDate, e.endDate, e.current)}</div>
                  {e.description && <p style={{ fontSize: 6.5, color: "#4b5563", margin: "1px 0 0", lineHeight: 1.45 }}>{e.description}</p>}
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {cv.education.length > 0 && (
            <>
              <SectionAcademic>Formation</SectionAcademic>
              {cv.education.map((e) => (
                <div key={e.id} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 7.5, fontWeight: 700 }}>{e.degree}</div>
                  <div style={{ fontSize: 7, fontStyle: "italic", color: "#4b5563" }}>{e.school}, {e.year}</div>
                </div>
              ))}
            </>
          )}
          {cv.skills.length > 0 && (
            <>
              <SectionAcademic>Compétences</SectionAcademic>
              <div style={{ fontSize: 7, color: "#374151", lineHeight: 1.5 }}>{cv.skills.map((s) => s.name).join(", ")}</div>
            </>
          )}
          {cv.languages.length > 0 && (
            <>
              <SectionAcademic>Langues</SectionAcademic>
              <div style={{ fontSize: 7, color: "#374151" }}>{cv.languages.map((l) => `${l.name} (${l.level})`).join(", ")}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionAcademic({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "#1f2937", borderBottom: "1px solid #1f2937", paddingBottom: 1, marginBottom: 3, marginTop: 5 }}>{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────
// 10. EXECUTIVE — Sidebar navy + corps serif, gravitas
// ─────────────────────────────────────────────────────────────────────────

function TplExecutive({ cv }: { cv: PreviewCv }) {
  const C = "#1e3a5f"
  return (
    <div style={{ width: W, height: H, background: "#fff", display: "flex", fontFamily: SANS, color: "#1f2937", overflow: "hidden" }}>
      <div style={{ width: 110, background: C, color: "#fff", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: 6, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 18, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>{initials(cv)}</div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{cv.firstName}<br /><span style={{ fontWeight: 400 }}>{cv.lastName}</span></div>
          {role(cv) && <div style={{ fontSize: 7, opacity: 0.85, marginTop: 4, fontStyle: "italic" }}>{role(cv)}</div>}
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.2)" }} />
        <div style={{ fontSize: 6.5, lineHeight: 1.6 }}>
          {cv.email && <div>{cv.email}</div>}
          {cv.phone && <div>{cv.phone}</div>}
          {cv.address && <div>{cv.address}</div>}
        </div>
        {cv.languages.length > 0 && (
          <div>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.2, opacity: 0.85, marginBottom: 3 }}>LANGUES</div>
            {cv.languages.map((l) => <div key={l.id} style={{ fontSize: 7 }}>{l.name} <span style={{ opacity: 0.7 }}>· {l.level}</span></div>)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: "14px 14px", overflow: "hidden" }}>
        {cv.summary && (
          <>
            <div style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, color: C, marginBottom: 3, borderBottom: `1px solid ${C}`, paddingBottom: 2 }}>Profil exécutif</div>
            <p style={{ fontSize: 7, color: "#374151", lineHeight: 1.55, margin: "0 0 8px", fontStyle: "italic" }}>{cv.summary}</p>
          </>
        )}
        {cv.experiences.length > 0 && (
          <>
            <div style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, color: C, marginBottom: 4, borderBottom: `1px solid ${C}`, paddingBottom: 2 }}>Parcours</div>
            {cv.experiences.map((e) => (
              <div key={e.id} style={{ marginBottom: 5 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700 }}>{e.title}</div>
                <div style={{ fontSize: 7, color: C, fontWeight: 600 }}>{e.company} <span style={{ color: "#94a3b8", fontWeight: 400 }}>· {formatRange(e.startDate, e.endDate, e.current)}</span></div>
                {e.description && <p style={{ fontSize: 6.5, color: "#4b5563", margin: "2px 0 0", lineHeight: 1.45 }}>{e.description}</p>}
              </div>
            ))}
          </>
        )}
        {cv.education.length > 0 && (
          <>
            <div style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, color: C, marginBottom: 3, borderBottom: `1px solid ${C}`, paddingBottom: 2 }}>Formation</div>
            {cv.education.map((e) => (
              <div key={e.id} style={{ fontSize: 7.5, marginBottom: 2 }}><span style={{ fontWeight: 700 }}>{e.degree}</span>, <span style={{ color: "#4b5563" }}>{e.school}, {e.year}</span></div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 11. ELEGANT — Serif avec ornements, accents pourpre/or
// ─────────────────────────────────────────────────────────────────────────

function TplElegant({ cv }: { cv: PreviewCv }) {
  const C = "#9d4edd"
  return (
    <div style={{ width: W, height: H, background: "#fdfaff", color: "#1f1235", fontFamily: SERIF, padding: 20, overflow: "hidden" }}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: C, letterSpacing: 4 }}>{"━━ ✦ ━━"}</div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 1, lineHeight: 1, marginTop: 4 }}>{fullName(cv)}</div>
        {role(cv) && <div style={{ fontSize: 8.5, fontStyle: "italic", color: C, marginTop: 3, letterSpacing: 1 }}>{role(cv)}</div>}
        <div style={{ fontSize: 7, color: "#6b5b8a", marginTop: 5, letterSpacing: 0.4 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join(" · ")}</div>
        <div style={{ fontSize: 9, color: C, letterSpacing: 4, marginTop: 5 }}>{"━━ ✦ ━━"}</div>
      </div>
      {cv.summary && <p style={{ fontSize: 7.5, color: "#3f2f5e", lineHeight: 1.6, margin: "0 0 10px", textAlign: "center", fontStyle: "italic" }}>« {cv.summary} »</p>}
      {cv.experiences.length > 0 && (
        <>
          <SectionElegant color={C}>Expérience</SectionElegant>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: 5, paddingLeft: 8 }}>
              <div style={{ fontSize: 8.5, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 7, color: C, fontStyle: "italic" }}>{e.company} · {formatRange(e.startDate, e.endDate, e.current)}</div>
              {e.description && <p style={{ fontSize: 7, color: "#3f2f5e", margin: "2px 0 0", lineHeight: 1.5 }}>{e.description}</p>}
            </div>
          ))}
        </>
      )}
      {cv.education.length > 0 && (
        <>
          <SectionElegant color={C}>Formation</SectionElegant>
          {cv.education.map((e) => (
            <div key={e.id} style={{ fontSize: 7.5, marginBottom: 2, paddingLeft: 8 }}><span style={{ fontWeight: 600 }}>{e.degree}</span> · <span style={{ fontStyle: "italic", color: "#6b5b8a" }}>{e.school}, {e.year}</span></div>
          ))}
        </>
      )}
      {cv.skills.length > 0 && (
        <>
          <SectionElegant color={C}>Compétences</SectionElegant>
          <div style={{ textAlign: "center", fontSize: 7, color: "#3f2f5e", letterSpacing: 0.5 }}>{cv.skills.map((s) => s.name).join("  ·  ")}</div>
        </>
      )}
    </div>
  )
}

function SectionElegant({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", margin: "6px 0 4px" }}>
      <div style={{ fontSize: 9, fontWeight: 600, color, letterSpacing: 2.5, textTransform: "uppercase" }}>{children}</div>
      <div style={{ fontSize: 7, color, opacity: 0.6, marginTop: -1 }}>· · ·</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 12. COMPACT — Bicolonne ultra-dense, vert
// ─────────────────────────────────────────────────────────────────────────

function TplCompact({ cv }: { cv: PreviewCv }) {
  const C = "#059669"
  return (
    <div style={{ width: W, height: H, background: "#fff", color: "#0f172a", fontFamily: SANS, padding: 12, overflow: "hidden", fontSize: 7 }}>
      <div style={{ borderLeft: `3px solid ${C}`, paddingLeft: 8, marginBottom: 7 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>{fullName(cv)}</div>
        {role(cv) && <div style={{ fontSize: 8, color: C, fontWeight: 700, marginTop: 1 }}>{role(cv)}</div>}
        <div style={{ fontSize: 6.5, color: "#475569", marginTop: 2 }}>{[cv.email, cv.phone, cv.address].filter(Boolean).join(" · ")}</div>
      </div>
      {cv.summary && <p style={{ fontSize: 6.5, color: "#475569", lineHeight: 1.4, margin: "0 0 6px" }}>{cv.summary}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          {cv.experiences.length > 0 && (
            <>
              <SectionCompact color={C}>Expérience</SectionCompact>
              {cv.experiences.map((e) => (
                <div key={e.id} style={{ marginBottom: 3 }}>
                  <div style={{ fontSize: 7.5, fontWeight: 700 }}>{e.title} <span style={{ color: C, fontWeight: 600 }}>· {e.company}</span></div>
                  <div style={{ fontSize: 6, color: "#64748b" }}>{formatRange(e.startDate, e.endDate, e.current)}</div>
                  {e.description && <p style={{ fontSize: 6, color: "#475569", margin: "1px 0 0", lineHeight: 1.4 }}>{e.description}</p>}
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {cv.education.length > 0 && (
            <>
              <SectionCompact color={C}>Formation</SectionCompact>
              {cv.education.map((e) => (
                <div key={e.id} style={{ marginBottom: 2 }}>
                  <div style={{ fontSize: 7, fontWeight: 700 }}>{e.degree}</div>
                  <div style={{ fontSize: 6.5, color: "#64748b" }}>{e.school} · {e.year}</div>
                </div>
              ))}
            </>
          )}
          {cv.skills.length > 0 && (
            <>
              <SectionCompact color={C}>Skills</SectionCompact>
              <div style={{ fontSize: 6.5, lineHeight: 1.45, color: "#334155" }}>{cv.skills.map((s) => s.name).join(" · ")}</div>
            </>
          )}
          {cv.languages.length > 0 && (
            <>
              <SectionCompact color={C}>Langues</SectionCompact>
              <div style={{ fontSize: 6.5, color: "#334155" }}>{cv.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionCompact({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: 7.5, fontWeight: 800, color, letterSpacing: 1, marginBottom: 2, marginTop: 4, textTransform: "uppercase" }}>{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers communs
// ─────────────────────────────────────────────────────────────────────────

function Section({ title, serif, children }: { title: string; serif?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#111827", borderBottom: serif ? "1px solid #111827" : "none", paddingBottom: 2, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, React.ComponentType<{ cv: PreviewCv }>> = {
  modern: TplModern,
  classic: TplClassic,
  minimalist: TplMinimalist,
  professional: TplProfessional,
  creative: TplCreative,
  startup: TplStartup,
  bold: TplBold,
  tech: TplTech,
  academic: TplAcademic,
  executive: TplExecutive,
  elegant: TplElegant,
  compact: TplCompact,
}

export function renderTemplate(themeId: string, cv: PreviewCv): React.ReactElement {
  const Component = TEMPLATES[themeId] ?? TEMPLATES.modern!
  return <Component cv={cv} />
}
