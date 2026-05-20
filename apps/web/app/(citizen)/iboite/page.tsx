"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { ArrowLeftIcon, PlusIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { AccountSelector } from "./_components/account-selector"
import { AddressSetupModal } from "./_components/address-setup-modal"
import { ColisPanel } from "./_components/colis-panel"
import { ComposeModal } from "./_components/compose-modal"
import {
  CourrierActionsBar,
  CourrierActionsPanel,
} from "./_components/courrier-actions"
import { CourrierDetail } from "./_components/courrier-detail"
import { CourrierFolderList } from "./_components/courrier-folder-list"
import { CourrierList } from "./_components/courrier-list"
import {
  EmailActionsBar,
  EmailActionsPanel,
} from "./_components/email-actions"
import { EmailDetail } from "./_components/email-detail"
import { EmailFolderList } from "./_components/email-folder-list"
import { EmailList } from "./_components/email-list"
import { SectionTabs } from "./_components/section-tabs"
import { iboite } from "./_content/fr"
import { useIBoiteState } from "./_hooks/use-iboite-state"

export default function IBoitePage() {
  const accounts = useQuery(api.iboite.accounts.listMine, {})
  const [accountId, setAccountId] = React.useState<Id<"iboiteAccount"> | null>(
    null,
  )

  React.useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) {
      const first = accounts[0]
      if (first) setAccountId(first._id)
    }
  }, [accounts, accountId])

  const state = useIBoiteState()
  const [addressModalOpen, setAddressModalOpen] = React.useState(false)

  if (accounts === undefined) {
    return (
      <section
        className="flex flex-1 items-center justify-center px-5 py-10"
        aria-busy="true"
      >
        <p className="text-sm text-muted-foreground">{iboite.loading}</p>
      </section>
    )
  }

  const firstAccount = accounts[0]
  if (!firstAccount || !accountId) {
    return (
      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {iboite.noAccount}
        </p>
      </section>
    )
  }

  const account = accounts.find((a) => a._id === accountId) ?? firstAccount
  const itemOpen = Boolean(state.selectedId)

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-3 px-3 py-4 md:flex-row md:px-4 md:py-5 lg:px-6">
        {/* ─── Panneau gauche : navigation ──────────────────────────── */}
        <aside
          aria-label="Navigation iBoîte"
          className={
            // Sur mobile : caché quand un item est ouvert. Sur md+ : toujours visible.
            (itemOpen ? "hidden " : "flex ") +
            "w-full flex-col gap-3 md:flex md:w-72 md:shrink-0"
          }
        >
          <AccountSelector
            accounts={accounts}
            current={account}
            onSelect={(id) => {
              setAccountId(id)
              state.selectItem(null)
            }}
            onConfigureAddress={() => setAddressModalOpen(true)}
          />

          <SectionTabs
            active={state.section}
            counters={account.counters}
            onChange={state.setSection}
          />

          {state.section === "courriers" ? (
            <>
              <CourrierFolderList
                active={state.courrierFolder}
                counters={account.counters}
                onChange={state.setCourrierFolder}
              />
              {state.selectedId ? (
                <CourrierActionsPanel
                  letterId={state.selectedId as Id<"iboiteLetter">}
                  currentFolder={state.courrierFolder}
                  onBack={() => state.selectItem(null)}
                />
              ) : null}
            </>
          ) : null}

          {state.section === "emails" ? (
            <>
              <EmailFolderList
                active={state.emailFolder}
                counters={account.counters}
                onChange={state.setEmailFolder}
                onCompose={state.openCompose}
              />
              {state.selectedId ? (
                <EmailActionsPanel
                  messageId={state.selectedId as Id<"iboiteMessage">}
                  onBack={() => state.selectItem(null)}
                  onCompose={state.openCompose}
                />
              ) : null}
            </>
          ) : null}
        </aside>

        {/* ─── Panneau droit : contenu ──────────────────────────────── */}
        <section
          aria-label="Contenu iBoîte"
          className="relative flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card"
        >
          {/* Header mobile sticky avec back quand item ouvert */}
          {itemOpen ? (
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-3 py-2 md:hidden">
              <button
                type="button"
                onClick={() => state.selectItem(null)}
                aria-label={iboite.courriers.backToList}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground/80 hover:bg-secondary"
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-semibold">
                {state.section === "courriers"
                  ? iboite.sections.courriers.replace(/s$/, "")
                  : "Message"}
              </p>
            </header>
          ) : null}

          {state.section === "courriers" ? (
            <>
              {state.selectedId ? (
                <CourrierDetail
                  letterId={state.selectedId as Id<"iboiteLetter">}
                />
              ) : (
                <CourrierList
                  accountId={account._id}
                  folder={state.courrierFolder}
                  onOpen={(id) => state.selectItem(id)}
                />
              )}
              {state.selectedId ? (
                <CourrierActionsBar
                  letterId={state.selectedId as Id<"iboiteLetter">}
                  currentFolder={state.courrierFolder}
                  onBack={() => state.selectItem(null)}
                />
              ) : null}
            </>
          ) : null}

          {state.section === "colis" ? (
            <ColisPanel accountId={account._id} qrCode={account.qrCode} />
          ) : null}

          {state.section === "emails" ? (
            <>
              {state.selectedId ? (
                <EmailDetail
                  messageId={state.selectedId as Id<"iboiteMessage">}
                />
              ) : (
                <EmailList
                  accountId={account._id}
                  folder={state.emailFolder}
                  onOpen={(id) => state.selectItem(id)}
                />
              )}
              {state.selectedId ? (
                <EmailActionsBar
                  messageId={state.selectedId as Id<"iboiteMessage">}
                  onBack={() => state.selectItem(null)}
                  onCompose={state.openCompose}
                />
              ) : null}
            </>
          ) : null}

          {/* FAB mobile : Nouveau message (emails) — caché si item ouvert ou desktop */}
          {state.section === "emails" && !itemOpen ? (
            <button
              type="button"
              onClick={state.openCompose}
              aria-label={iboite.emails.newMessage}
              className="absolute bottom-4 right-4 inline-flex h-13 w-13 items-center justify-center rounded-full bg-idn-green text-white shadow-lg shadow-idn-green/40 hover:bg-idn-green/90 md:hidden"
              style={{ height: 52, width: 52 }}
            >
              <SendIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          {state.section === "courriers" && !itemOpen ? (
            <button
              type="button"
              onClick={() => toast.info(iboite.toasts.soonAvailable)}
              aria-label={iboite.courriers.newLetter}
              className="absolute bottom-4 right-4 inline-flex items-center justify-center rounded-full bg-idn-green text-white shadow-lg shadow-idn-green/40 hover:bg-idn-green/90 md:hidden"
              style={{ height: 52, width: 52 }}
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </section>
      </div>

      {state.composeOpen ? (
        <ComposeModal
          accountId={account._id}
          onClose={state.closeCompose}
        />
      ) : null}

      {addressModalOpen ? (
        <AddressSetupModal
          accountId={account._id}
          onClose={() => setAddressModalOpen(false)}
        />
      ) : null}
    </>
  )
}
