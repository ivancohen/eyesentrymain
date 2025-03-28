// Define question types and interfaces
export interface QuestionOption {
  value: string;
  label: string;
  tooltip?: string;
}

export interface QuestionItem {
  id: string;
  question: string; // Changed from 'text'
  type: "text" | "number" | "select";
  options?: QuestionOption[];
  required?: boolean;
  tooltip?: string;
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
      question: "Patient First Name", // Changed from 'text'
      type: "text",
      required: true,
      tooltip: "Enter the patient's legal first name"
    },
    {
      id: "lastName",
      question: "Patient Last Name", // Changed from 'text'
      type: "text",
      required: true,
      tooltip: "Enter the patient's legal last name"
    },
    {
      id: "age",
      question: "Age", // Changed from 'text'
      type: "select",
      options: ageRangeOptions,
      required: true,
      tooltip: "Select the patient's age range"
    },
    {
      id: "race",
      question: "Race", // Changed from 'text'
      type: "select",
      options: raceOptions,
      required: true,
      tooltip: "Select the patient's race/ethnicity"
    }
  ],

  // Page 2: Family and Medication History
  [
    {
      id: "familyGlaucoma",
      question: "Has anyone in your immediate family (i.e. parent, sibling, or child) been diagnosed with glaucoma (i.e. POAG or open angle glaucoma)?", // Changed from 'text'
      type: "select",
      options: familyHistoryOptions,
      required: true,
      tooltip: "Include immediate family members (parents, siblings, children) who have been diagnosed with open-angle glaucoma"
    },
    {
      id: "ocularSteroid",
      question: "Are you taking and have you ever taken any ophthalmic topical steroids?", // Changed from 'text'
      type: "select",
      options: yesNoOptions,
      required: true,
      tooltip: "Include any eye drops or ointments containing steroids that have been prescribed"
    },
    {
      id: "steroidType",
      question: "Which ophthalmic topical steroid are you taking or have taken?", // Changed from 'text'
      type: "select",
      options: steroidTypeOptions,
      required: true,
      tooltip: "Select the specific type of ophthalmic steroid medication",
      conditionalOptions: {
        parentValue: "ocularSteroid:yes",
        options: steroidTypeOptions
      }
    },
    {
      id: "intravitreal",
      question: "Are you Taking and have you ever taken any Intravitreal Steroids?", // Changed from 'text'
      type: "select",
      options: yesNoOptions,
      required: true,
      tooltip: "Include any steroid injections directly into the eye"
    },
    {
      id: "intravitealType",
      question: "Which intravitreal steroid are you taking or have taken?", // Changed from 'text'
      type: "select",
      options: intravitealSteroidOptions,
      required: true,
      tooltip: "Select the specific type of intravitreal steroid medication",
      conditionalOptions: {
        parentValue: "intravitreal:yes",
        options: intravitealSteroidOptions
      }
    },
    {
      id: "systemicSteroid",
      question: "Are you taking and have you ever taken any systemic steroids?", // Changed from 'text'
      type: "select",
      options: yesNoOptions,
      required: true,
      tooltip: "Include any oral or injected steroids taken for any condition"
    },
    {
      id: "systemicSteroidType",
      question: "Which systemic steroid are you taking or have taken?", // Changed from 'text'
      type: "select",
      options: systemicSteroidOptions,
      required: true,
      tooltip: "Select the specific type of systemic steroid medication",
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
      question: "IOP Baseline is >22 \\ Handheld Tonometer", // Changed from 'text'
      type: "select",
      options: clinicalMeasurementOptions, // Assuming this is correct, was iopOptions before? Check consistency
      required: true,
      tooltip: "Intraocular pressure measurement using a handheld tonometer"
    },
    {
      id: "verticalAsymmetry",
      question: "Vertical C:D disc asymmetry (>0.2) \\ Fundoscope", // Changed from 'text'
      type: "select",
      options: asymmetryOptions,
      required: true,
      tooltip: "Difference in vertical cup-to-disc ratio between eyes"
    },
    {
      id: "verticalRatio",
      question: "Vertical C:D ratio (>0.6)", // Changed from 'text'
      type: "select",
      options: cdRatioOptions,
      required: true,
      tooltip: "Vertical cup-to-disc ratio measurement"
    }
  ]
];