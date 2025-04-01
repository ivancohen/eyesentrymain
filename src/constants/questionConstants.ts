import { Field } from "@/components/DataForm";

export const QUESTION_COLUMNS = [
  { key: "question", label: "Question" },
  { key: "page_category", label: "Page/Category" },
  { key: "question_type", label: "Type" },
  { key: "created_at", label: "Created At" }
];

// Define page categories based on questionnaireConstants
const PAGE_CATEGORIES = [
  { value: "patient_info", label: "Patient Information" },
  { value: "family_medication", label: "Family & Medication History" },
  { value: "clinical_measurements", label: "Clinical Measurements" },
  { value: "uncategorized", label: "Uncategorized" }
];

export const QUESTION_FORM_FIELDS: Field[] = [
  {
    key: "question",
    label: "Question",
    type: "text" as const,
    required: true,
    helpText: "The question text"
  },
  {
    key: "tooltip",
    label: "Tooltip",
    type: "text" as const,
    required: false,
    helpText: "Additional information shown when hovering over the question"
  },
  {
    key: "question_type",
    label: "Question Type",
    type: "select" as const,
    required: true,
    options: [
      { value: "text", label: "Text Input" },
      { value: "dropdown", label: "Dropdown Menu" }
    ],
    helpText: "Select the type of question"
  },
  {
    key: "page_category",
    label: "Question Page/Category",
    type: "select" as const,
    required: true,
    options: PAGE_CATEGORIES,
    helpText: "Select which page this question belongs to in the questionnaire"
  },
  {
    key: "status",
    label: "Status",
    type: "select" as const,
    required: true,
    options: [
      { value: "Active", label: "Active" },
      { value: "Draft", label: "Draft" },
      { value: "Inactive", label: "Inactive" }
    ],
    helpText: "Set the status (Active questions appear in questionnaires)"
  }
];

export const CONDITIONAL_ITEM_FIELDS: Field[] = [
  {
    key: "condition_value",
    label: "If Answer Contains",
    type: "text" as const,
    required: true,
    helpText: "When user input contains this value"
  },
  {
    key: "response_message",
    label: "Response Message",
    type: "text" as const,
    required: true,
    helpText: "Message to show when condition is met"
  },
  {
    key: "tooltip",
    label: "Tooltip",
    type: "text" as const,
    required: false,
    helpText: "Additional information shown when hovering over the conditional item"
  },
  {
    key: "condition_type",
    label: "Condition Type",
    type: "select" as const,
    required: true,
    options: [
      { value: "contains", label: "Contains" },
      { value: "equals", label: "Equals" },
      { value: "starts_with", label: "Starts With" },
      { value: "ends_with", label: "Ends With" }
    ]
  },
  {
    key: "score",
    label: "Score Value",
    type: "number" as const,
    required: false,
    helpText: "Points to award when this condition is met (increments by 2)"
  }
];

export const generateScoreOptions = (maxScore: number = 10) => {
  const options = [];
  for (let i = 0; i <= maxScore; i += 2) {
    options.push({
      value: i.toString(),
      label: i.toString()
    });
  }
  return options;
};

export const DROPDOWN_OPTION_FIELDS: Field[] = [
  {
    key: "option_text",
    label: "Option Text",
    type: "text" as const,
    required: true,
    helpText: "Text displayed to the user for this option"
  },
  {
    key: "option_value",
    label: "Option Value",
    type: "text" as const,
    required: true,
    helpText: "Internal value for this option"
  },
  {
    key: "score",
    label: "Score Value",
    type: "select" as const,
    required: true,
    options: generateScoreOptions(),
    helpText: "Points to award when this option is selected"
  }
];
