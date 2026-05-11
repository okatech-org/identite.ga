import { ImageResponse } from "next/og"

export const alt = "Identité Numérique du Gabon — un compte unique pour tous les services de l'État"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          color: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "20px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#a3a3a3",
          }}
        >
          <div style={{ display: "flex", width: 56, height: 12 }}>
            <div style={{ flex: 1, background: "#009e60" }} />
            <div style={{ flex: 1, background: "#fcd116" }} />
            <div style={{ flex: 1, background: "#3a75c4" }} />
          </div>
          République Gabonaise
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "84px",
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Identité Numérique</span>
            <span style={{ color: "#22c55e" }}>du Gabon</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.35,
              color: "#d4d4d4",
              maxWidth: "920px",
            }}
          >
            Un compte unique pour accéder à tous les services administratifs en ligne.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
