"use client"

import * as React from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs"

import { OpHeader } from "../../_components/op-header"
import { settings } from "../../_content/fr"
import { AccountTab } from "./_components/account-tab"
import { PreferencesTab } from "./_components/preferences-tab"

/**
 * Paramètres du contrôleur — onglets Compte et Préférences.
 * Le rôle est déjà vérifié par `(private)/layout.tsx`.
 */
export default function ControllerSettingsPage() {
  return (
    <>
      <OpHeader sub={settings.sub} title={settings.title} />
      <div className="flex-1 overflow-auto p-7">
        <div className="mx-auto w-full max-w-[820px]">
          <Tabs defaultValue="account">
            <TabsList variant="line" className="w-full justify-start gap-1">
              <TabsTrigger value="account">
                {settings.tabs.account}
              </TabsTrigger>
              <TabsTrigger value="preferences">
                {settings.tabs.preferences}
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
