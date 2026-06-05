import { Theme, Level } from "./types";

// Question statique classique
export interface StaticQuestion {
  id: number;
  type: "static";
  theme: Theme;
  level: Level;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

// Template paramétrique avec variantes
export interface ParametricTemplate {
  id: string;           // ex: "alg-linear-1"
  type: "parametric";
  theme: Theme;
  level: Level;
  template: string;     // ex: "Résoudre : {a}x + {b} = {c}"
  explanation_template: string; // ex: "{a}x = {c} - {b} = {result_b} → x = {result_b}/{a} = {x}"
  variants: ParametricVariant[];
}

export interface ParametricVariant {
  params: Record<string, number | string>;
  choices: string[];
  answer: number;
  // explanation peut être générée depuis explanation_template + params
}

export type AnyQuestion = StaticQuestion | ParametricTemplate;

// Convertit un template + variante en question jouable
export function expandVariant(
  template: ParametricTemplate,
  variant: ParametricVariant,
  variantIndex: number
): StaticQuestion {
  let question = template.template;
  let explanation = template.explanation_template;

  for (const [key, value] of Object.entries(variant.params)) {
    question = question.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    explanation = explanation.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }

  return {
    id: parseInt(`${template.id.replace(/\D/g, "").slice(0, 4)}${variantIndex + 1}`),
    type: "static",
    theme: template.theme,
    level: template.level,
    question,
    choices: variant.choices,
    answer: variant.answer,
    explanation,
  };
}

// Explose tous les templates en questions jouables
export function expandAllTemplates(templates: ParametricTemplate[]): StaticQuestion[] {
  return templates.flatMap((t) =>
    t.variants.map((v, i) => expandVariant(t, v, i))
  );
}
