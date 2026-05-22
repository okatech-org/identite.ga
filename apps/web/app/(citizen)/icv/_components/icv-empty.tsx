"use client"

import * as React from "react"
import { FileText, Plus, Upload } from "lucide-react"

import { Button } from "@repo/ui/components/button"

import { CvPreviewA4, type PreviewCv } from "./cv-preview-a4"
import { ICV_ACCENT } from "../_content/themes"

const EMPTY_SAMPLE_CV: PreviewCv = {
  firstName: "Aïsha",
  lastName: "Ndong",
  email: "aisha.ndong@idn.ga",
  phone: "+241 06 12 34 56",
  address: "Libreville · Gabon",
  summary:
    "Chef de Projet Digital — 7 ans d'expérience en transformation numérique pour le secteur public et privé africain. Spécialiste UX et conduite du changement.",
  experiences: [
    {
      id: "1",
      title: "Chef de Projet Digital",
      company: "Agence Web Gabon",
      startDate: "Janv. 2022",
      endDate: "Présent",
      current: true,
      description:
        "Refonte de 3 plateformes e-commerce · +25% conversion · coord. 8 dev/designers.",
    },
    {
      id: "2",
      title: "Product Manager",
      company: "Bantu Tech",
      startDate: "Sept. 2019",
      endDate: "Déc. 2021",
      current: false,
      description: "Lancement d'une app fintech (50 k users actifs).",
    },
  ],
  education: [
    {
      id: "1",
      degree: "Master 2 Marketing Digital",
      school: "Université Omar Bongo",
      year: "2019",
    },
    {
      id: "2",
      degree: "Licence Communication",
      school: "INSG Libreville",
      year: "2017",
    },
  ],
  skills: [
    { id: "1", name: "Gestion de projet", level: "Expert" },
    { id: "2", name: "UX Design", level: "Advanced" },
    { id: "3", name: "Marketing digital", level: "Advanced" },
    { id: "4", name: "Figma", level: "Expert" },
    { id: "5", name: "SQL", level: "Intermediate" },
  ],
  languages: [
    { id: "1", name: "Français", level: "Native" },
    { id: "2", name: "Anglais", level: "C1" },
    { id: "3", name: "Fang", level: "B2" },
  ],
  hobbies: [],
}

const EMPTY_FAN_CARDS = [
  { themeId: "modern", rot: -10, dx: -90, dy: 40, z: 1 },
  { themeId: "bold", rot: 6, dx: 90, dy: 60, z: 2 },
  { themeId: "creative", rot: -2, dx: 0, dy: 0, z: 3 },
] as const

export function IcvEmpty({
  onStart,
  onImport,
}: {
  onStart: () => void
  onImport: () => void
}) {
  return (
    <section className="mx-auto flex w-full flex-1 items-center px-5 py-12 md:px-4 md:py-20 lg:px-20">
      <div className="grid w-full gap-8 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <div
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "#FCE7F3", color: ICV_ACCENT }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            iCV · NOUVEAU
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Votre CV professionnel,
            <br />
            <span style={{ color: ICV_ACCENT }}>en quelques minutes.</span>
          </h2>
          <p className="mt-4 max-w-[440px] text-sm text-muted-foreground md:text-base">
            12 thèmes professionnels, 5 outils IA pour reformuler, suggérer
            des compétences ou évaluer votre score ATS. Synchronisé avec
            votre identité IDN.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={onStart}>
              <Plus className="h-4 w-4" />
              Démarrer mon CV
            </Button>
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4" />
              Importer un CV
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-5">
            {[
              { l: "12", d: "Thèmes pro" },
              { l: "5", d: "Outils IA" },
              { l: "PDF", d: "Export 1 clic" },
              { l: "ATS", d: "Score auto" },
            ].map((s) => (
              <div key={s.d}>
                <div className="font-mono text-2xl font-bold text-foreground">
                  {s.l}
                </div>
                <div className="mt-1 text-[11px] tracking-wide text-muted-foreground">
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative hidden md:block"
          style={{ height: 520 }}
          aria-hidden="true"
        >
          {EMPTY_FAN_CARDS.map((c) => (
            <div
              key={c.themeId}
              className="absolute"
              style={{
                top: c.dy,
                left: "50%",
                marginLeft: c.dx - 160,
                transform: `rotate(${c.rot}deg)`,
                zIndex: c.z,
              }}
            >
              <CvPreviewA4 cv={EMPTY_SAMPLE_CV} themeId={c.themeId} targetWidth={320} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
