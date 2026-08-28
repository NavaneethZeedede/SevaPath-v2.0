/**
 * Single source of truth for the category → department mapping.
 *
 * The filing API (POST /api/cases) MUST derive the owning department from the
 * submitted category through this module — never hardcode a department. Both
 * citizen-facing UI and officer routing depend on this mapping being correct,
 * so any new category added to the form must be added here too.
 */

export const DEPARTMENT = {
  WATER: "Water Dept",
  ELECTRICITY: "Electricity Dept",
  ROADS: "Roads & Infrastructure Dept",
  SANITATION: "Sanitation Dept",
  REVENUE: "Revenue & Property Tax Dept",
  GENERAL: "General Administration Dept",
} as const;

const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  "Water Supply": DEPARTMENT.WATER,
  "Electricity": DEPARTMENT.ELECTRICITY,
  "Roads": DEPARTMENT.ROADS,
  "Sanitation": DEPARTMENT.SANITATION,
  "Property/Tax": DEPARTMENT.REVENUE,
  "Other": DEPARTMENT.GENERAL,
};

/** Resolve the owning department for a grievance category. Unknown/missing categories route to General Administration. */
export function departmentForCategory(category: string | null | undefined): string {
  if (!category) return DEPARTMENT.GENERAL;
  return CATEGORY_TO_DEPARTMENT[category.trim()] ?? DEPARTMENT.GENERAL;
}

/** Every department that can own a case (derived from the mapping, so always in sync). */
export const ALL_DEPARTMENTS: string[] = Array.from(
  new Set(Object.values(CATEGORY_TO_DEPARTMENT))
);