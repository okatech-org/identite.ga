import React, { useMemo, useState } from "react"
import { Linking, Platform } from "react-native"
import { WebView } from "react-native-webview"
import type { IdnTheme } from "@/design/tokens"

function removeUnsafeMarkup(html: string): string {
  return html
    .replace(
      /<(script|iframe|object|embed|form|input|button|meta|base|link|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<(script|iframe|object|embed|form|input|button|meta|base|link|svg|math)\b[^>]*\/?\s*>/gi,
      "",
    )
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s+(href|src)\s*=\s*(["'])\s*(javascript:|data:text\/html)[\s\S]*?\2/gi,
      "",
    )
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(["']?)\s*javascript:[^)]*\)/gi, "")
}

function documentForEmail(html: string, t: IdnTheme): string {
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: cid:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none'">
<base target="_blank">
<style>html,body{margin:0;padding:0;background:${t.surface};color:${t.ink};font:15px/1.55 -apple-system,BlinkMacSystemFont,Arial,sans-serif;overflow-wrap:anywhere}body{padding:16px}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}a{color:#0e7c3a}</style>
</head><body>${removeUnsafeMarkup(html)}</body></html>`
}

function openExternalUrl(url: string) {
  if (!/^(https?:|mailto:|tel:)/i.test(url)) return
  void Linking.openURL(url)
}

export function EmailHtmlView({ html, t }: { html: string; t: IdnTheme }) {
  const [height, setHeight] = useState(320)
  const source = useMemo(() => ({ html: documentForEmail(html, t) }), [html, t])

  if (Platform.OS === "web") return null

  return (
    <WebView
      source={source}
      originWhitelist={["about:blank"]}
      referrerPolicy="no-referrer"
      mixedContentMode="never"
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === "about:blank") return true
        openExternalUrl(request.url)
        return false
      }}
      injectedJavaScript="window.ReactNativeWebView.postMessage(String(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)));true;"
      onMessage={(event) => {
        const next = Number(event.nativeEvent.data)
        if (Number.isFinite(next))
          setHeight(Math.min(Math.max(next, 160), 5000))
      }}
      scrollEnabled={false}
      style={{ height, backgroundColor: t.surface }}
    />
  )
}
