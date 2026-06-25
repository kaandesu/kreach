import OpenAI from "openai";
import type { GeneratedTemplate } from "@/types";

export const DEFAULT_MODEL = "gpt-4o-mini";

/** Distinct stylistic angles so a batch of N templates feels varied rather than
 *  N near-identical drafts. Indexed by position in the batch. */
const STYLE_ANGLES = [
  "clean and minimal, lots of whitespace, single clear call-to-action",
  "bold and punchy with a strong headline and a prominent button",
  "warm and personal, conversational tone, feels hand-written",
  "professional and structured with a short bulleted value list",
  "modern editorial look with a subtle accent color and a tidy footer",
];

export interface GenerateParams {
  apiKey: string;
  projectName: string;
  brandingNotes?: string;
  /** Number of distinct templates to generate (1–5). */
  count: number;
  model?: string;
}

const SYSTEM_PROMPT = `You are an expert email designer who writes high-converting cold outreach emails as production-ready, email-client-safe HTML.

Rules:
- Output a SINGLE self-contained HTML document for the email body.
- Use INLINE styles only (no <style> blocks, no external CSS, no <script>).
- Use a table-based, responsive-friendly layout that renders well in Gmail/Outlook/Apple Mail.
- Max width ~600px, centered. Use web-safe fonts.
- Include a clear subject line, a compelling opening, a concise body, one call-to-action, and a simple footer with an unsubscribe placeholder.
- Use merge tags like {{firstName}} and {{company}} where personalization helps.
- Do NOT include markdown fences or commentary.
Respond ONLY with minified JSON: {"subject": string, "name": string, "html": string}. "name" is a short 2-4 word label for this variant.`;

function localId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

/** Generate a single template variant. Used for the initial batch and for
 *  per-card regeneration. `angleIndex` nudges the style for variety. */
export async function generateTemplate(
  params: Omit<GenerateParams, "count">,
  angleIndex = 0,
): Promise<GeneratedTemplate> {
  const model = params.model ?? DEFAULT_MODEL;
  const client = buildClient(params.apiKey);
  const angle = STYLE_ANGLES[angleIndex % STYLE_ANGLES.length];

  const userPrompt = [
    `Project / campaign: ${params.projectName}`,
    params.brandingNotes
      ? `Branding & context notes:\n${params.brandingNotes}`
      : "No specific branding notes were provided — keep it tasteful and neutral.",
    `Design angle for this variant: ${angle}.`,
  ].join("\n\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { subject?: string; name?: string; html?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned malformed JSON. Try regenerating.");
  }

  if (!parsed.html) {
    throw new Error("OpenAI response did not include HTML. Try regenerating.");
  }

  return {
    localId: localId(),
    name: parsed.name?.trim() || `Variant ${angleIndex + 1}`,
    subject: parsed.subject?.trim() || "Quick question",
    html: parsed.html,
    model,
    prompt: userPrompt,
  };
}

/** Generate a batch of `count` distinct templates in parallel. */
export async function generateTemplates(
  params: GenerateParams,
): Promise<GeneratedTemplate[]> {
  const count = Math.min(5, Math.max(1, params.count));
  const { count: _omit, ...single } = params;
  void _omit;
  return Promise.all(
    Array.from({ length: count }, (_, i) => generateTemplate(single, i)),
  );
}
