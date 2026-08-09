import { describe, expect, test } from "vitest";

import {
  safeEqual,
  signWebhookPayload,
  verifyWebhookSignature,
} from "./webhookSignature";

describe("signature des webhooks partenaires", () => {
  const secret = "un-secret-partage-suffisamment-long";
  const payload = JSON.stringify({ event: "updated", verification: { id: "v1" } });

  test("produit une signature stable et préfixée", async () => {
    const a = await signWebhookPayload(secret, payload);
    const b = await signWebhookPayload(secret, payload);
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  test("change dès que le corps change d'un octet", async () => {
    // C'est toute la valeur de la signature : elle authentifie le CONTENU,
    // pas seulement l'expéditeur. Sans cela, un intermédiaire pourrait
    // modifier le LoA d'un citoyen en transit.
    const original = await signWebhookPayload(secret, payload);
    const tampered = await signWebhookPayload(secret, payload + " ");
    expect(tampered).not.toBe(original);
  });

  test("change avec le secret", async () => {
    const mine = await signWebhookPayload(secret, payload);
    const other = await signWebhookPayload(secret + "x", payload);
    expect(other).not.toBe(mine);
  });

  test("vérifie une signature légitime et rejette le reste", async () => {
    const signature = await signWebhookPayload(secret, payload);
    expect(await verifyWebhookSignature(secret, payload, signature)).toBe(true);
    expect(await verifyWebhookSignature(secret, payload, null)).toBe(false);
    expect(await verifyWebhookSignature(secret, payload, "sha256=00")).toBe(false);
    expect(
      await verifyWebhookSignature("mauvais-secret", payload, signature),
    ).toBe(false);
    expect(
      await verifyWebhookSignature(secret, payload + "!", signature),
    ).toBe(false);
  });

  test("la comparaison ne court-circuite pas sur le premier octet", () => {
    // Une comparaison qui s'arrête au premier écart révèle, par son temps
    // d'exécution, combien de préfixe est correct — de quoi reconstruire une
    // signature valide octet par octet. On vérifie ici au moins la
    // correction ; la propriété de temps constant tient à l'absence de
    // sortie anticipée dans l'implémentation.
    expect(safeEqual("abcdef", "abcdef")).toBe(true);
    expect(safeEqual("abcdef", "abcdeg")).toBe(false);
    expect(safeEqual("abcdef", "zbcdef")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
