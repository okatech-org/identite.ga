/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _dev_listRoles from "../_dev/listRoles.js";
import type * as account from "../account.js";
import type * as activity from "../activity.js";
import type * as admin_auditLogs from "../admin/auditLogs.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_oauthApps from "../admin/oauthApps.js";
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
import type * as developer_apps from "../developer/apps.js";
import type * as documents from "../documents.js";
import type * as email_provider from "../email/provider.js";
import type * as email_templates_otpEmail from "../email/templates/otpEmail.js";
import type * as http from "../http.js";
import type * as kyc from "../kyc.js";
import type * as kyc_actions from "../kyc/actions.js";
import type * as kyc_mutations from "../kyc/mutations.js";
import type * as kyc_workflow from "../kyc/workflow.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_idnId from "../lib/idnId.js";
import type * as lib_password from "../lib/password.js";
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
import type * as sessions from "../sessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_dev/listRoles": typeof _dev_listRoles;
  account: typeof account;
  activity: typeof activity;
  "admin/auditLogs": typeof admin_auditLogs;
  "admin/dashboard": typeof admin_dashboard;
  "admin/oauthApps": typeof admin_oauthApps;
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
  "developer/apps": typeof developer_apps;
  documents: typeof documents;
  "email/provider": typeof email_provider;
  "email/templates/otpEmail": typeof email_templates_otpEmail;
  http: typeof http;
  kyc: typeof kyc;
  "kyc/actions": typeof kyc_actions;
  "kyc/mutations": typeof kyc_mutations;
  "kyc/workflow": typeof kyc_workflow;
  "lib/auth": typeof lib_auth;
  "lib/idnId": typeof lib_idnId;
  "lib/password": typeof lib_password;
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
  sessions: typeof sessions;
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
