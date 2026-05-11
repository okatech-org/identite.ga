import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, background: "#009e60" }} />
        <div style={{ flex: 1, background: "#fcd116" }} />
        <div style={{ flex: 1, background: "#3a75c4" }} />
      </div>
    ),
    { ...size },
  )
}
