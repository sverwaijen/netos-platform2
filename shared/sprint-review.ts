/**
 * NETOS PLATFORM — Sprint Review & Feedback System
 *
 * Types en helpers voor het sprint review proces.
 * Na elke sprint kunnen stakeholders per module feedback geven.
 */

import type { UserRole, ModuleStatus } from "./feature-registry";

// ─── Feedback Types ──────────────────────────────────────────────────

export type FeedbackRating = "works" | "partial" | "broken" | "not_tested";
export type FeedbackPriority = "critical" | "high" | "medium" | "low";

export interface ModuleFeedback {
  id: string;
  moduleId: string;
  sprintId: string;
  /** Wie geeft de feedback */
  reviewerRole: UserRole;
  reviewerName: string;
  /** Werkt de module? */
  rating: FeedbackRating;
  /** Wat werkt wel */
  whatWorks: string;
  /** Wat werkt niet of mist */
  whatsMissing: string;
  /** Hoe zou je dit in de praktijk gebruiken? */
  practicalUseCase: string;
  /** Prioriteit van de feedback */
  priority: FeedbackPriority;
  /** Suggesties voor verbetering */
  suggestions: string[];
  createdAt: Date;
}

export interface SprintReview {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  /** Modules die in deze sprint zijn bijgewerkt */
  updatedModules: string[];
  /** Modules die van status zijn veranderd */
  statusChanges: { moduleId: string; from: ModuleStatus; to: ModuleStatus }[];
  /** Alle feedback van reviewers */
  feedback: ModuleFeedback[];
  /** Samenvatting na de review */
  summary?: string;
  /** Action items voor de volgende sprint */
  actionItems: SprintActionItem[];
}

export interface SprintActionItem {
  id: string;
  moduleId: string;
  description: string;
  assignedTo: "manus" | "claude" | "cursor" | "human";
  priority: FeedbackPriority;
  status: "todo" | "in_progress" | "done";
  fromFeedbackId?: string;
  githubIssueUrl?: string;
}

// ─── Sprint Review Template ─────────────────────────────────────────

export function generateSprintReviewTemplate(sprintId: string, modules: { id: string; name: string; status: ModuleStatus }[]): string {
  const lines: string[] = [
    `# Sprint Review: ${sprintId}`,
    `**Datum:** ${new Date().toISOString().split("T")[0]}`,
    "",
    "## Module Status Overzicht",
    "",
    "| Module | Status | Review |",
    "|--------|--------|--------|",
  ];

  for (const mod of modules) {
    const emoji =
      mod.status === "production" ? "🟢" :
      mod.status === "beta" ? "🟡" :
      mod.status === "demo" ? "🔴" : "⚫";
    lines.push(`| ${mod.name} | ${emoji} ${mod.status} | ⬜ Niet getest |`);
  }

  lines.push(
    "",
    "## Feedback per Module",
    "",
    "### Template (kopieer per module):",
    "",
    "**Module:** [naam]",
    "**Getest door:** [naam + rol]",
    "**Werkt het?** ⬜ Ja / ⬜ Deels / ⬜ Nee / ⬜ Niet getest",
    "**Wat werkt:** ...",
    "**Wat mist:** ...",
    "**Praktijkgebruik:** Hoe zou je dit dagelijks gebruiken?",
    "**Prioriteit:** ⬜ Kritiek / ⬜ Hoog / ⬜ Medium / ⬜ Laag",
    "**Suggesties:** ...",
    "",
    "---",
    "",
    "## Action Items",
    "",
    "| # | Module | Actie | Toegewezen aan | Prioriteit |",
    "|---|--------|-------|----------------|------------|",
    "| 1 | | | | |",
    "",
    "## Volgende Sprint Focus",
    "",
    "1. ...",
    "2. ...",
    "3. ...",
  );

  return lines.join("\n");
}

// ─── Review Rollen met beschrijving ─────────────────────────────────

export const reviewerRoles: Record<UserRole, { label: string; focus: string }> = {
  administrator: {
    label: "Administrator",
    focus: "Alles: beveiliging, gebruikersbeheer, financiën, integraties",
  },
  host: {
    label: "Receptionist / Community Host",
    focus: "Dagelijkse operatie: bezoekers, kiosk, signing, ticketing",
  },
  teamadmin: {
    label: "Boss / Bedrijfsleider",
    focus: "Boekingen, wallet, contracten, teamleden beheren",
  },
  member: {
    label: "Lid / Huurder",
    focus: "Boeken, betalen, app gebruiken, support aanvragen",
  },
  guest: {
    label: "Bezoeker",
    focus: "Incheck-flow, signing display, WiFi toegang",
  },
  facility: {
    label: "Facility Manager",
    focus: "Room control, sensoren, parkeren, onderhoud, energie",
  },
  developer: {
    label: "Developer / AI Agent",
    focus: "API endpoints, tests, performance, foutafhandeling",
  },
};
