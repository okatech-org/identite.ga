"use client"

import * as React from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs"

import { settings } from "../_content/fr"
import { ActivityTab } from "../_components/settings/activity-tab"
import { DocumentsTab } from "../_components/settings/documents-tab"
import { NotificationsTab } from "../_components/settings/notifications-tab"
import { PreferencesTab } from "../_components/settings/preferences-tab"
import { PrivacyTab } from "../_components/settings/privacy-tab"
import { SecurityTab } from "../_components/settings/security-tab"
import { SessionsTab } from "../_components/settings/sessions-tab"

export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 py-6 md:px-7 md:py-8">
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-[26px]">
        {settings.title}
      </h1>

      <Tabs defaultValue="security" className="mt-6">
        <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="security">{settings.tabs.security}</TabsTrigger>
          <TabsTrigger value="sessions">{settings.tabs.sessions}</TabsTrigger>
          <TabsTrigger value="notifications">{settings.tabs.notifications}</TabsTrigger>
          <TabsTrigger value="preferences">{settings.tabs.preferences}</TabsTrigger>
          <TabsTrigger value="documents">{settings.tabs.documents}</TabsTrigger>
          <TabsTrigger value="activity">{settings.tabs.activity}</TabsTrigger>
          <TabsTrigger value="privacy">{settings.tabs.privacy}</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="sessions" className="mt-6">
          <SessionsTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="privacy" className="mt-6">
          <PrivacyTab />
        </TabsContent>
      </Tabs>
    </section>
  )
}
