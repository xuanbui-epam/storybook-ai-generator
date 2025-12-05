import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { env } from "../core/config";

// Define the expected output structure with Zod schema
const LLMOutputSchema = z.object({
  ComponentName: z.string(),
  Summary: z.string(),
  PropsDefinition: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      defaultValue: z.any().nullable(),
      description: z.string(),
      mockValue: z.any(),
    })
  ),
  StoriesScenarios: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      props: z.record(z.string(), z.any()),
    })
  ),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;

const SYSTEM_PROMPT = "You are a Senior Frontend Architect specializing in React and Storybook.";
const TEMPERATURE = 0.2;
const MAX_TOKENS = 4096;

/**
 * Validates that required environment variables are set
 */
function validateEnv(provider: string): void {
  if (!env.llmApiKey) {
    throw new Error(`LLM_API_KEY is missing for ${provider} provider.`);
  }
  if (!env.llmModel) {
    throw new Error(`LLM_MODEL is missing for ${provider} provider.`);
  }
}

/**
 * Extracts JSON from text that may be wrapped in markdown code blocks
 */
function extractJSON(text: string): string {
  let jsonText = text.trim();
  
  // Remove markdown code blocks
  if (jsonText.startsWith("```")) {
    const lines = jsonText.split("\n");
    lines.shift(); // Remove first line (```json or ```)
    if (lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop(); // Remove last line (```)
    }
    jsonText = lines.join("\n").trim();
  }
  
  // Extract JSON object
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }
  
  return jsonText;
}

/**
 * Attempts to parse and validate LLM response as JSON
 */
async function parseJSONResponse(rawText: string, provider: string): Promise<LLMOutput> {
  try {
    const jsonText = extractJSON(rawText);
    const parsed = JSON.parse(jsonText);
    const result = LLMOutputSchema.parse(parsed) as LLMOutput;
    console.log(`[4.2] ${provider} responded successfully after manual JSON extraction`);
    return result;
  } catch (fallbackError: any) {
    console.error("[4.1] Error in fallback JSON extraction:", fallbackError.message);
    console.error("[4.1] Raw response (first 1000 chars):", rawText.substring(0, 1000));
    throw fallbackError;
  }
}


export async function callLLM(prompt: string): Promise<LLMOutput> {
  if (!env.llmModel) {
    throw new Error("LLM_MODEL is not set");
  }
  if (env.llmProvider === "gemini") {
    console.log("[4.0] Calling Gemini with model:", env.llmModel);
    return callGemini(prompt);
  }
  // default: openai
  console.log("[4.0] Calling OpenAI with model:", env.llmModel);
  return callOpenAI(prompt);
}

async function callOpenAI(prompt: string): Promise<LLMOutput> {
  validateEnv("OpenAI");

  const model = new ChatOpenAI({
    modelName: env.llmModel,
    apiKey: env.llmApiKey,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  });

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["user", "{input}"],
  ]);

  try {
    // Try structured output with proper chain
    if (typeof model.withStructuredOutput === "function") {
      console.log("[4.1] Trying withStructuredOutput (jsonMode)...");
      const structuredModel = model.withStructuredOutput(LLMOutputSchema, {
        method: "jsonMode",
      });
      const chain = chatPrompt.pipe(structuredModel);
      const result = await chain.invoke({ input: prompt });
      console.log("[4.2] OpenAI responded successfully with structured output");
      return result as LLMOutput;
    }
    
    // Fallback to JSON parser
    console.log("[4.1] Trying JsonOutputParser...");
    const parser = new JsonOutputParser<LLMOutput>();
    const chain = chatPrompt.pipe(model).pipe(parser);
    const result = await chain.invoke({ input: prompt });
    console.log("[4.2] OpenAI responded successfully with JSON parser");
    return result as LLMOutput;
  } catch (error: any) {
    // Final fallback: manual extraction
    if (error.message?.includes("JSON") || error.message?.includes("parse")) {
      console.log("[4.1.1] JSON parsing failed, attempting manual extraction...");
      const rawResponse = await chatPrompt.pipe(model).invoke({ input: prompt });
      const text = rawResponse.content as string;
      return parseJSONResponse(text, "OpenAI");
    }
    console.error("[4.1] Error calling OpenAI:", error);
    throw error;
  }
}

async function callGemini(prompt: string): Promise<LLMOutput> {
  validateEnv("Gemini");

  const model = new ChatGoogleGenerativeAI({
    model: env.llmModel as string,
    apiKey: env.llmApiKey,
    temperature: TEMPERATURE,
    maxOutputTokens: MAX_TOKENS,
  });

  // Gemini may not support system messages the same way, so include it in user message
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}`;

  try {
    // Try JSON parser directly (Gemini works better with this approach)
    console.log("[4.1] Trying JsonOutputParser with Gemini...");
    const parser = new JsonOutputParser<LLMOutput>();
    const chain = model.pipe(parser);
    const result = await chain.invoke(fullPrompt);
    console.log("[4.2] Gemini responded successfully with JSON parser");
    return result as LLMOutput;
  } catch (error: any) {
    // Fallback: manual extraction
    if (error.message?.includes("JSON") || error.message?.includes("parse")) {
      console.log("[4.1.1] JSON parsing failed, attempting manual extraction...");
      const rawResponse = await model.invoke(fullPrompt);
      const text = rawResponse.content as string;
      return parseJSONResponse(text, "Gemini");
    }
    console.error("[4.1] Error calling Gemini:", error);
    throw error;
  }
}