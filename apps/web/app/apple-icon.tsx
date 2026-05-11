import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
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
