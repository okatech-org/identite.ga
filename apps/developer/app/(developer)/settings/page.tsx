"use client"

import * as React from "react"
import { PaletteIcon, UserRoundIcon } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs"

import { fr } from "../../_content/fr"
import { OpHeader } from "../../_components/op-header"
import { AccountTab } from "./_components/account-tab"
import { PreferencesTab } from "./_components/preferences-tab"

export default function DeveloperSettingsPage() {
  return (
    <>
      <OpHeader sub={fr.settings.sub} title={fr.settings.title} />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit-narrow">
          <Tabs defaultValue="account">
            <TabsList className="h-auto rounded-xl border border-idn-border bg-idn-surface p-1">
              <TabsTrigger
                value="account"
                className="min-w-36 rounded-lg px-4 py-2"
              >
                <UserRoundIcon className="size-4" />
                {fr.settings.tabs.account}
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="min-w-36 rounded-lg px-4 py-2"
              >
                <PaletteIcon className="size-4" />
                {fr.settings.tabs.preferences}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-4">
              <AccountTab />
            </TabsContent>
            <TabsContent value="preferences" className="mt-4">
              <PreferencesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
