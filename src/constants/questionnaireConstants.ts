// Define question types and interfaces
export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionItem {
  id: string;
  text: string;
  type: "text" | "number" | "select";
  options?: QuestionOption[];
  required?: boolean;
  conditionalOptions?: {
    parentValue: string;
    options: QuestionOption[];
  };
}

// Define yes/no/na options for family history
export const familyHistoryOptions: QuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_available", label: "Not Available" }
];

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

// Define specific options for clinical measurements
export const iopOptions: QuestionOption[] = [
  { value: "22_and_above", label: "22 and above" },
  { value: "21_and_under", label: "21 and under" },
  { value: "not_available", label: "Not Available" }
];

// Group questions by pages
export const QUESTIONNAIRE_PAGES: QuestionItem[][] = [
  // Page 1: Basic Patient Information
  [
    {
      id: "firstName",
      text: "Patient First Name",
      type: "text",
      required: true
    },
    {
      id: "lastName",
      text: "Patient Last Name",
      type: "text",
      required: true
    },
    {
      id: "age",
      text: "Age",
      type: "select",
      options: ageRangeOptions,
      required: true
    },
    {
      id: "race",
      text: "Race",
      type: "select",
      options: raceOptions,
      required: true
    }
  ],
  
  // Page 2: Family and Medication History
  [
    {
      id: "familyGlaucoma",
      text: "Has anyone in your immediate family been diagnosed with open-angle glaucoma?",
      type: "select",
      options: familyHistoryOptions,
      required: true
    },
    {
      id: "ocularSteroid",
      text: "Are you taking and have you ever taken any ophthalmic topical steroids?",
      type: "select",
      options: yesNoOptions,
      required: true
    },
    {
      id: "steroidType",
      text: "Which ophthalmic topical steroid are you taking or have taken?",
      type: "select",
      options: steroidTypeOptions,
      required: true,
      conditionalOptions: {
        parentValue: "ocularSteroid:yes",
        options: steroidTypeOptions
      }
    },
    {
      id: "intravitreal",
      text: "Are you Taking and have you ever taken any Intravitreal Steroids?",
      type: "select",
      options: yesNoOptions,
      required: true
    },
    {
      id: "intravitealType",
      text: "Which intravitreal steroid are you taking or have taken?",
      type: "select",
      options: intravitealSteroidOptions,
      required: true,
      conditionalOptions: {
        parentValue: "intravitreal:yes",
        options: intravitealSteroidOptions
      }
    },
    {
      id: "systemicSteroid",
      text: "Are you taking and have you ever taken any systemic steroids?",
      type: "select",
      options: yesNoOptions,
      required: true
    },
    {
      id: "systemicSteroidType",
      text: "Which systemic steroid are you taking or have taken?",
      type: "select",
      options: systemicSteroidOptions,
      required: true,
      conditionalOptions: {
        parentValue: "systemicSteroid:yes",
        options: systemicSteroidOptions
      }
    }
  ],
  
  // Page 3: Clinical Measurements
  [
    {
      id: "iopBaseline",
      text: "IOP Baseline is >22 \\ Handheld Tonometer",
      type: "select",
      options: clinicalMeasurementOptions,
      required: true
    },
    {
      id: "verticalAsymmetry",
      text: "Vertical C:D disc asymmetry (>0.2) \\ Fundoscope",
      type: "select",
      options: asymmetryOptions,
      required: true
    },
    {
      id: "verticalRatio",
      text: "Vertical C:D ratio (>0.6)",
      type: "select",
      options: cdRatioOptions,
      required: true
    }
  ]
];
