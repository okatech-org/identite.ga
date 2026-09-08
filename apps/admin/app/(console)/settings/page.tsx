"use client"

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

/**
 * Paramètres super-admin — onglets Compte et Préférences.
 * Pattern : apps/controller/(private)/settings/page.tsx.
 */
export default function AdminSettingsPage() {
  return (
    <>
      <OpHeader sub={fr.settings.sub} title={fr.settings.title} />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit-narrow">
          <Tabs defaultValue="account">
            <TabsList variant="line" className="w-full justify-start gap-1">
              <TabsTrigger value="account">
                {fr.settings.tabs.account}
              </TabsTrigger>
              <TabsTrigger value="preferences">
                {fr.settings.tabs.preferences}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-6">
              <AccountTab />
            </TabsContent>
            <TabsContent value="preferences" className="mt-6">
              <PreferencesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
