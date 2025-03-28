// This file contains hardcoded questions for the medical history page
// and related option definitions needed for the hybrid approach.

// Define question types and interfaces (needed for hardcoded questions)
export interface QuestionOption {
  value: string;
  label: string;
  tooltip?: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  type: "text" | "number" | "select";
  options?: QuestionOption[];
  required?: boolean;
  tooltip?: string;
  conditionalOptions?: {
    parentValue: string; // Format: "parentQuestionId:requiredValue"
    options: QuestionOption[]; // Options to show when condition met (often same as main options)
  };
}

// --- Options needed for Medical History Page ---

// Define yes/no options for reuse
export const yesNoOptions: QuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

// Define steroid type options
export const steroidTypeOptions: QuestionOption[] = [
  { value: "prednisolone", label: "Prednisolone Acetate (Pred Forte, Omnipred)" },
  { value: "dexamethasone", label: "Dexamethasone (Maxidex)" },
  { value: "fluorometholone", label: "Fluorometholone (FML, FML Forte)" },
  { value: "loteprednol", label: "Loteprednol Etabonate (Lotemax, Inveltys)" },
  { value: "rimexolone", label: "Rimexolone (Vexol)" },
  { value: "other", label: "Other not listed" }
];

// Define intravitreal steroid options
export const intravitealSteroidOptions: QuestionOption[] = [
  { value: "triamcinolone", label: "Triamcinolone Acetonide (Triesence, Kenalog)" },
  { value: "dexamethasone", label: "Dexamethasone (Ozurdex)" },
  { value: "fluocinolone", label: "Fluocinolone Acetonide (Iluvien)" },
  { value: "other", label: "Other not listed" }
];

// Define systemic steroid options
export const systemicSteroidOptions: QuestionOption[] = [
  { value: "prednisone", label: "Prednisone (Deltasone, Sterapred)" },
  { value: "dexamethasone", label: "Dexamethasone (Decadron, DexPak)" },
  { value: "hydrocortisone", label: "Hydrocortisone (Cortef, Solu-Cortef)" },
  { value: "methylprednisolone", label: "Methylprednisolone (Medrol, Depo-Medrol)" },
  { value: "betamethasone", label: "Betamethasone (Betasone, Celestone)" },
  { value: "triamcinolone", label: "Triamcinolone (Kenalog, Aromasin)" },
  { value: "fludrocortisone", label: "Fludrocortisone (Florinef)" },
  { value: "cortisone", label: "Cortisone (Cortone)" },
  { value: "fluticasone", label: "Fluticasone (Vermamyst, Flonase, Flovent)" },
  { value: "budesonide", label: "Budesonide (Pulmicort, Symbicort [with formoterol])" },
  { value: "beclomethasone", label: "Beclomethasone (Qvar)" },
  { value: "mometasone", label: "Mometasone (Asmanex, Dulera [with formoterol])" },
  { value: "ciclesonide", label: "Ciclesonide (Alvesco)" },
  { value: "other", label: "Other not listed" }
];

// --- Hardcoded Questions for Medical History Page ---

export const MEDICAL_HISTORY_QUESTIONS: QuestionItem[] = [
  // Note: familyGlaucoma is likely handled by DB now, but kept here for reference if needed
  // {
  //   id: "familyGlaucoma",
  //   question: "Has anyone in your immediate family (i.e. parent, sibling, or child) been diagnosed with glaucoma (i.e. POAG or open angle glaucoma)?",
  //   type: "select",
  //   options: familyHistoryOptions, // Requires familyHistoryOptions definition
  //   required: true,
  //   tooltip: "Include immediate family members (parents, siblings, children) who have been diagnosed with open-angle glaucoma"
  // },
  {
    id: "ocularSteroid",
    question: "Are you taking and have you ever taken any ophthalmic topical steroids?",
    type: "select",
    options: yesNoOptions,
    required: true,
    tooltip: "Include any eye drops or ointments containing steroids that have been prescribed"
  },
  {
    id: "steroidType",
    question: "Which ophthalmic topical steroid are you taking or have taken?",
    type: "select",
    options: steroidTypeOptions,
    required: true, // Required only if parent is 'yes' - handled by validation logic
    tooltip: "Select the specific type of ophthalmic steroid medication",
    conditionalOptions: {
      parentValue: "ocularSteroid:yes", // Depends on ocularSteroid question
      options: steroidTypeOptions // Shows these options when condition met
    }
  },
  {
    id: "intravitreal",
    question: "Are you Taking and have you ever taken any Intravitreal Steroids?",
    type: "select",
    options: yesNoOptions,
    required: true,
    tooltip: "Include any steroid injections directly into the eye"
  },
  {
    id: "intravitealType", // Note: ID typo from original constant was 'intravitealType'
    question: "Which intravitreal steroid are you taking or have taken?",
    type: "select",
    options: intravitealSteroidOptions,
    required: true, // Required only if parent is 'yes'
    tooltip: "Select the specific type of intravitreal steroid medication",
    conditionalOptions: {
      parentValue: "intravitreal:yes", // Depends on intravitreal question
      options: intravitealSteroidOptions
    }
  },
  {
    id: "systemicSteroid",
    question: "Are you taking and have you ever taken any systemic steroids?",
    type: "select",
    options: yesNoOptions,
    required: true,
    tooltip: "Include any oral or injected steroids taken for any condition"
  },
  {
    id: "systemicSteroidType",
    question: "Which systemic steroid are you taking or have taken?",
    type: "select",
    options: systemicSteroidOptions,
    required: true, // Required only if parent is 'yes'
    tooltip: "Select the specific type of systemic steroid medication",
    conditionalOptions: {
      parentValue: "systemicSteroid:yes", // Depends on systemicSteroid question
      options: systemicSteroidOptions
    }
  }
];

// Other option constants (age, race, clinical) might still be needed if DB questions reference them by name
// Or if they are used elsewhere. Keeping them for now.

// Define yes/no/na options for family history (if needed by DB questions)
export const familyHistoryOptions: QuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_available", label: "Not Available" }
];

// Define age range options
export const ageRangeOptions: QuestionOption[] = [
  { value: "0-50", label: "0-50" },
  { value: "51-60", label: "51-60" },
  { value: "61-70", label: "61-70" },
  { value: "71-80", label: "71-80" },
  { value: "81-90", label: "81-90" },
  { value: "91+", label: "91+" }
];

// Define race options
export const raceOptions: QuestionOption[] = [
  { value: "american_indian", label: "American Indian or Alaska Native" },
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black or African American" },
  { value: "hispanic", label: "Hispanic or Latino" },
  { value: "pacific_islander", label: "Native Hawaiian or Pacific Islander" },
  { value: "white", label: "White" },
  { value: "other", label: "Other" }
];

// Define specific options for clinical measurements
export const clinicalMeasurementOptions: QuestionOption[] = [
  { value: "22_and_above", label: "22 and above" },
  { value: "21_and_under", label: "21 and under" },
  { value: "not_available", label: "Not Available" }
];

export const asymmetryOptions: QuestionOption[] = [
  { value: "0.2_and_above", label: "0.2 and above" },
  { value: "under_0.2", label: "Under 0.2" },
  { value: "not_available", label: "Not Available" }
];

export const cdRatioOptions: QuestionOption[] = [
  { value: "0.6_and_above", label: "0.6 and above" },
  { value: "below_0.6", label: "Below 0.6" },
  { value: "not_available", label: "Not Available" }
];
