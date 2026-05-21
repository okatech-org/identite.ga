/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _dev_listLatestLogs from "../_dev/listLatestLogs.js";
import type * as _dev_listRoles from "../_dev/listRoles.js";
import type * as _dev_rebuildAggregates from "../_dev/rebuildAggregates.js";
import type * as _dev_resetIboiteAddresses from "../_dev/resetIboiteAddresses.js";
import type * as account from "../account.js";
import type * as activity from "../activity.js";
import type * as admin_auditLogs from "../admin/auditLogs.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_oauthApps from "../admin/oauthApps.js";
import type * as admin_operators from "../admin/operators.js";
import type * as admin_providers from "../admin/providers.js";
import type * as admin_roles from "../admin/roles.js";
import type * as admin_users from "../admin/users.js";
import type * as aggregates from "../aggregates.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as controller_history from "../controller/history.js";
import type * as controller_me from "../controller/me.js";
import type * as controller_queue from "../controller/queue.js";
import type * as crons from "../crons.js";
import type * as crossDevice from "../crossDevice.js";
import type * as cv_ai from "../cv/ai.js";
import type * as cv_aiJobs from "../cv/aiJobs.js";
import type * as cv_cvs from "../cv/cvs.js";
import type * as cv_education from "../cv/education.js";
import type * as cv_experiences from "../cv/experiences.js";
import type * as cv_export from "../cv/export.js";
import type * as cv_exportInternal from "../cv/exportInternal.js";
import type * as cv_import from "../cv/import.js";
import type * as cv_importInternal from "../cv/importInternal.js";
import type * as cv_languages from "../cv/languages.js";
import type * as cv_pdfThemes_index from "../cv/pdfThemes/index.js";
import type * as cv_pdfThemes_modern from "../cv/pdfThemes/modern.js";
import type * as cv_profile from "../cv/profile.js";
import type * as cv_score from "../cv/score.js";
import type * as cv_shared from "../cv/shared.js";
import type * as cv_skills from "../cv/skills.js";
import type * as developer_apps from "../developer/apps.js";
import type * as documents from "../documents.js";
import type * as email_provider from "../email/provider.js";
import type * as email_templates_genericEmail from "../email/templates/genericEmail.js";
import type * as email_templates_kycEmail from "../email/templates/kycEmail.js";
import type * as email_templates_otpEmail from "../email/templates/otpEmail.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as iboite_accounts from "../iboite/accounts.js";
import type * as iboite_admin from "../iboite/admin.js";
import type * as iboite_letters from "../iboite/letters.js";
import type * as iboite_messages from "../iboite/messages.js";
import type * as iboite_packages from "../iboite/packages.js";
import type * as idoc from "../idoc.js";
import type * as kyc from "../kyc.js";
import type * as kyc_actions from "../kyc/actions.js";
import type * as kyc_mutations from "../kyc/mutations.js";
import type * as kyc_workflow from "../kyc/workflow.js";
import type * as lib_ai_providers_anthropic from "../lib/ai/providers/anthropic.js";
import type * as lib_ai_providers_gemini from "../lib/ai/providers/gemini.js";
import type * as lib_ai_providers_mock from "../lib/ai/providers/mock.js";
import type * as lib_ai_providers_ollama from "../lib/ai/providers/ollama.js";
import type * as lib_ai_providers_openai from "../lib/ai/providers/openai.js";
import type * as lib_ai_providers_vllm from "../lib/ai/providers/vllm.js";
import type * as lib_ai_registry from "../lib/ai/registry.js";
import type * as lib_ai_types from "../lib/ai/types.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_iboiteId from "../lib/iboiteId.js";
import type * as lib_idnId from "../lib/idnId.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_pinSignInPlugin from "../lib/pinSignInPlugin.js";
import type * as notifications from "../notifications.js";
import type * as oauthAuthorize from "../oauthAuthorize.js";
import type * as oauthConsents from "../oauthConsents.js";
import type * as onboarding from "../onboarding.js";
import type * as preferences from "../preferences.js";
import type * as privacy from "../privacy.js";
import type * as profile from "../profile.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as scripts_createAdminUser from "../scripts/createAdminUser.js";
import type * as scripts_createControllerUser from "../scripts/createControllerUser.js";
import type * as services from "../services.js";
import type * as sessions from "../sessions.js";
import type * as vault_cron from "../vault/cron.js";
import type * as vault_folders from "../vault/folders.js";
import type * as vault_items from "../vault/items.js";
import type * as vault_keys from "../vault/keys.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_dev/listLatestLogs": typeof _dev_listLatestLogs;
  "_dev/listRoles": typeof _dev_listRoles;
  "_dev/rebuildAggregates": typeof _dev_rebuildAggregates;
  "_dev/resetIboiteAddresses": typeof _dev_resetIboiteAddresses;
  account: typeof account;
  activity: typeof activity;
  "admin/auditLogs": typeof admin_auditLogs;
  "admin/dashboard": typeof admin_dashboard;
  "admin/oauthApps": typeof admin_oauthApps;
  "admin/operators": typeof admin_operators;
  "admin/providers": typeof admin_providers;
  "admin/roles": typeof admin_roles;
  "admin/users": typeof admin_users;
  aggregates: typeof aggregates;
  audit: typeof audit;
  auth: typeof auth;
  contact: typeof contact;
  "controller/history": typeof controller_history;
  "controller/me": typeof controller_me;
  "controller/queue": typeof controller_queue;
  crons: typeof crons;
  crossDevice: typeof crossDevice;
  "cv/ai": typeof cv_ai;
  "cv/aiJobs": typeof cv_aiJobs;
  "cv/cvs": typeof cv_cvs;
  "cv/education": typeof cv_education;
  "cv/experiences": typeof cv_experiences;
  "cv/export": typeof cv_export;
  "cv/exportInternal": typeof cv_exportInternal;
  "cv/import": typeof cv_import;
  "cv/importInternal": typeof cv_importInternal;
  "cv/languages": typeof cv_languages;
  "cv/pdfThemes/index": typeof cv_pdfThemes_index;
  "cv/pdfThemes/modern": typeof cv_pdfThemes_modern;
  "cv/profile": typeof cv_profile;
  "cv/score": typeof cv_score;
  "cv/shared": typeof cv_shared;
  "cv/skills": typeof cv_skills;
  "developer/apps": typeof developer_apps;
  documents: typeof documents;
  "email/provider": typeof email_provider;
  "email/templates/genericEmail": typeof email_templates_genericEmail;
  "email/templates/kycEmail": typeof email_templates_kycEmail;
  "email/templates/otpEmail": typeof email_templates_otpEmail;
  functions: typeof functions;
  http: typeof http;
  "iboite/accounts": typeof iboite_accounts;
  "iboite/admin": typeof iboite_admin;
  "iboite/letters": typeof iboite_letters;
  "iboite/messages": typeof iboite_messages;
  "iboite/packages": typeof iboite_packages;
  idoc: typeof idoc;
  kyc: typeof kyc;
  "kyc/actions": typeof kyc_actions;
  "kyc/mutations": typeof kyc_mutations;
  "kyc/workflow": typeof kyc_workflow;
  "lib/ai/providers/anthropic": typeof lib_ai_providers_anthropic;
  "lib/ai/providers/gemini": typeof lib_ai_providers_gemini;
  "lib/ai/providers/mock": typeof lib_ai_providers_mock;
  "lib/ai/providers/ollama": typeof lib_ai_providers_ollama;
  "lib/ai/providers/openai": typeof lib_ai_providers_openai;
  "lib/ai/providers/vllm": typeof lib_ai_providers_vllm;
  "lib/ai/registry": typeof lib_ai_registry;
  "lib/ai/types": typeof lib_ai_types;
  "lib/auth": typeof lib_auth;
  "lib/iboiteId": typeof lib_iboiteId;
  "lib/idnId": typeof lib_idnId;
  "lib/password": typeof lib_password;
  "lib/pinSignInPlugin": typeof lib_pinSignInPlugin;
  notifications: typeof notifications;
  oauthAuthorize: typeof oauthAuthorize;
  oauthConsents: typeof oauthConsents;
  onboarding: typeof onboarding;
  preferences: typeof preferences;
  privacy: typeof privacy;
  profile: typeof profile;
  rateLimiter: typeof rateLimiter;
  "scripts/createAdminUser": typeof scripts_createAdminUser;
  "scripts/createControllerUser": typeof scripts_createControllerUser;
  services: typeof services;
  sessions: typeof sessions;
  "vault/cron": typeof vault_cron;
  "vault/folders": typeof vault_folders;
  "vault/items": typeof vault_items;
  "vault/keys": typeof vault_keys;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  usersByLoa: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"usersByLoa">;
  usersByProfile: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"usersByProfile">;
  kycByStatus: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"kycByStatus">;
  auditByCategory: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"auditByCategory">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
