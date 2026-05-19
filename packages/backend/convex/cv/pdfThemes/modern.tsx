"use node"

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import * as React from "react"

/**
 * Template PDF « modern » — utilisé comme fallback pour les 12 thèmes iCV
 * en Phase 1. Layout A4, deux colonnes (gauche infos perso / résumé, droite
 * sections), typographie sobre.
 *
 * Évolution prévue : un composant par thème (`classic.tsx`, `executive.tsx`,
 * etc.) — pour l'instant le designer travaille sur les variantes visuelles
 * et le backend renvoie ce rendu par défaut.
 */

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  sidebar: {
    width: "32%",
    backgroundColor: "#0e7c3a",
    color: "#ffffff",
    padding: 24,
  },
  main: {
    width: "68%",
    padding: 28,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    color: "#e2e8f0",
    marginBottom: 20,
  },
  sectionTitleSidebar: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#ffffff",
  },
  sidebarLine: { fontSize: 9, marginBottom: 4, color: "#f8fafc" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 8,
    color: "#0e7c3a",
    borderBottomWidth: 1,
    borderBottomColor: "#0e7c3a",
    paddingBottom: 4,
  },
  entry: {
    marginBottom: 12,
  },
  entryTitle: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  entrySub: { fontSize: 9, color: "#475569", marginBottom: 4 },
  entryBody: { fontSize: 10, color: "#1e293b", lineHeight: 1.4 },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    marginBottom: 4,
  },
  skillName: { fontWeight: 600, color: "#0f172a" },
  skillLevel: { color: "#64748b" },
  summary: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#334155",
    marginBottom: 16,
  },
})

export interface CvData {
  name: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  summary: string
  portfolioUrl?: string
  linkedinUrl?: string
  experiences: Array<{
    id: string
    title: string
    company: string
    startDate: string
    endDate?: string
    current: boolean
    description: string
  }>
  education: Array<{
    id: string
    degree: string
    school: string
    year: string
    description?: string
  }>
  skills: Array<{ id: string; name: string; level: string }>
  languages: Array<{ id: string; name: string; level: string }>
  hobbies: string[]
}

function formatDateRange(start: string, end?: string, current?: boolean) {
  if (current) return `${start} → Aujourd'hui`
  if (!end) return start
  return `${start} → ${end}`
}

export function ModernCvPdf({ cv }: { cv: CvData }) {
  const fullName = `${cv.firstName} ${cv.lastName}`.trim() || cv.name

  return (
    <Document
      title={`CV - ${fullName}`}
      author={fullName}
      producer="Identite.ga"
      creator="Identite.ga"
    >
      <Page size="A4" style={styles.page}>
        {/* Sidebar gauche */}
        <View style={styles.sidebar}>
          <Text style={styles.name}>{fullName || "—"}</Text>
          {cv.experiences[0]?.title ? (
            <Text style={styles.role}>{cv.experiences[0].title}</Text>
          ) : null}

          <Text style={styles.sectionTitleSidebar}>Contact</Text>
          {cv.email ? <Text style={styles.sidebarLine}>{cv.email}</Text> : null}
          {cv.phone ? <Text style={styles.sidebarLine}>{cv.phone}</Text> : null}
          {cv.address ? (
            <Text style={styles.sidebarLine}>{cv.address}</Text>
          ) : null}
          {cv.linkedinUrl ? (
            <Text style={styles.sidebarLine}>{cv.linkedinUrl}</Text>
          ) : null}
          {cv.portfolioUrl ? (
            <Text style={styles.sidebarLine}>{cv.portfolioUrl}</Text>
          ) : null}

          {cv.skills.length > 0 ? (
            <>
              <Text style={styles.sectionTitleSidebar}>Compétences</Text>
              {cv.skills.map((s) => (
                <Text key={s.id} style={styles.sidebarLine}>
                  • {s.name} ({s.level})
                </Text>
              ))}
            </>
          ) : null}

          {cv.languages.length > 0 ? (
            <>
              <Text style={styles.sectionTitleSidebar}>Langues</Text>
              {cv.languages.map((l) => (
                <Text key={l.id} style={styles.sidebarLine}>
                  • {l.name} — {l.level}
                </Text>
              ))}
            </>
          ) : null}

          {cv.hobbies.length > 0 ? (
            <>
              <Text style={styles.sectionTitleSidebar}>Centres d'intérêt</Text>
              {cv.hobbies.map((h, i) => (
                <Text key={i} style={styles.sidebarLine}>
                  • {h}
                </Text>
              ))}
            </>
          ) : null}
        </View>

        {/* Colonne principale */}
        <View style={styles.main}>
          {cv.summary ? (
            <>
              <Text style={styles.sectionTitle}>Profil</Text>
              <Text style={styles.summary}>{cv.summary}</Text>
            </>
          ) : null}

          {cv.experiences.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Expériences</Text>
              {cv.experiences.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <Text style={styles.entryTitle}>
                    {e.title} — {e.company}
                  </Text>
                  <Text style={styles.entrySub}>
                    {formatDateRange(e.startDate, e.endDate, e.current)}
                  </Text>
                  {e.description ? (
                    <Text style={styles.entryBody}>{e.description}</Text>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}

          {cv.education.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Formation</Text>
              {cv.education.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <Text style={styles.entryTitle}>
                    {e.degree} — {e.school}
                  </Text>
                  <Text style={styles.entrySub}>{e.year}</Text>
                  {e.description ? (
                    <Text style={styles.entryBody}>{e.description}</Text>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
