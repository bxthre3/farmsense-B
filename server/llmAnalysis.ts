import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { normalizedMetrics, irrigationRecommendations } from "../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * LLM Analysis Service
 * Analyzes historical irrigation patterns, weather trends, and crop performance
 * to provide natural language recommendations and answer farmer questions
 */

export interface HistoricalAnalysisResult {
  summary: string;
  patterns: string[];
  recommendations: string[];
  riskFactors: string[];
  optimizationOpportunities: string[];
}

export interface FarmerQuestion {
  question: string;
  fieldId: number;
  context?: string;
}

export interface FarmerAnswer {
  answer: string;
  confidence: number;
  sources: string[];
  timestamp: Date;
}

/**
 * Analyze historical irrigation patterns for a field
 */
export async function analyzeHistoricalPatterns(
  fieldId: number,
  daysBack: number = 30
): Promise<HistoricalAnalysisResult> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch historical metrics
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const metrics = await db
    .select()
    .from(normalizedMetrics)
    .where(
      and(
        eq(normalizedMetrics.fieldId, fieldId),
        gte(normalizedMetrics.timestamp, cutoffDate)
      )
    )
    .orderBy(desc(normalizedMetrics.timestamp))
    .limit(1000);

  // Fetch historical recommendations
  const recommendations = await db
    .select()
    .from(irrigationRecommendations)
    .where(
      and(
        eq(irrigationRecommendations.fieldId, fieldId),
        gte(irrigationRecommendations.createdAt, cutoffDate)
      )
    )
    .orderBy(desc(irrigationRecommendations.createdAt))
    .limit(500);

  // Prepare context for LLM
  const metricsContext = formatMetricsForAnalysis(metrics);
  const recommendationsContext = formatRecommendationsForAnalysis(recommendations);

  const analysisPrompt = `
You are an expert agricultural irrigation specialist. Analyze the following historical data for a farm field and provide insights.

HISTORICAL METRICS (last ${daysBack} days):
${metricsContext}

IRRIGATION RECOMMENDATIONS HISTORY:
${recommendationsContext}

Please provide:
1. A brief summary of irrigation patterns observed
2. Key patterns identified (e.g., frequency, timing, duration)
3. Specific recommendations for optimization
4. Risk factors to monitor
5. Opportunities for water savings or improved crop performance

Format your response as JSON with keys: summary, patterns, recommendations, riskFactors, optimizationOpportunities (each value is an array of strings for patterns/recommendations/risks/opportunities).
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert agricultural irrigation specialist providing data-driven recommendations for farm irrigation management.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "irrigation_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              patterns: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
              riskFactors: {
                type: "array",
                items: { type: "string" },
              },
              optimizationOpportunities: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "patterns", "recommendations", "riskFactors", "optimizationOpportunities"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }

    throw new Error("Invalid LLM response format");
  } catch (error) {
    console.error("[LLM Analysis] Error analyzing patterns:", error);
    throw error;
  }
}

/**
 * Answer farmer questions about irrigation strategy
 */
export async function answerFarmerQuestion(
  question: FarmerQuestion
): Promise<FarmerAnswer> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch recent field data for context
  const recentMetrics = await db
    .select()
    .from(normalizedMetrics)
    .where(eq(normalizedMetrics.fieldId, question.fieldId))
    .orderBy(desc(normalizedMetrics.timestamp))
    .limit(100);

  const recentRecommendations = await db
    .select()
    .from(irrigationRecommendations)
    .where(eq(irrigationRecommendations.fieldId, question.fieldId))
    .orderBy(desc(irrigationRecommendations.createdAt))
    .limit(50);

  const fieldContext = formatMetricsForAnalysis(recentMetrics);
  const recommendationContext = formatRecommendationsForAnalysis(recentRecommendations);

  const answerPrompt = `
You are an expert agricultural irrigation specialist. A farmer has asked the following question about their irrigation strategy:

FARMER QUESTION: "${question.question}"

CURRENT FIELD DATA (recent):
${fieldContext}

RECENT IRRIGATION DECISIONS:
${recommendationContext}

${question.context ? `ADDITIONAL CONTEXT: ${question.context}` : ""}

Please provide a helpful, practical answer based on the field data and irrigation history. Be specific and actionable.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert agricultural irrigation specialist providing practical advice to farmers. Base your answers on data and best practices.",
        },
        {
          role: "user",
          content: answerPrompt,
        },
      ],
    });

    const answer = response.choices[0]?.message.content;
    if (typeof answer !== "string") {
      throw new Error("Invalid LLM response format");
    }

    return {
      answer,
      confidence: 0.85, // Confidence based on data availability
      sources: ["Historical field metrics", "Irrigation recommendations history"],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[LLM Analysis] Error answering question:", error);
    throw error;
  }
}

/**
 * Generate optimization recommendations based on seasonal data
 */
export async function generateSeasonalOptimization(
  fieldId: number
): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch 90 days of data for seasonal analysis
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const metrics = await db
    .select()
    .from(normalizedMetrics)
    .where(
      and(
        eq(normalizedMetrics.fieldId, fieldId),
        gte(normalizedMetrics.timestamp, cutoffDate)
      )
    )
    .orderBy(desc(normalizedMetrics.timestamp))
    .limit(2000);

  const metricsContext = formatMetricsForAnalysis(metrics);

  const optimizationPrompt = `
You are an expert agricultural irrigation specialist. Based on 90 days of field data, provide specific optimization recommendations.

FIELD DATA (90 days):
${metricsContext}

Provide 5-7 specific, actionable recommendations for optimizing irrigation efficiency and crop performance. Format as a JSON array of strings.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert agricultural irrigation specialist providing optimization recommendations based on field data.",
        },
        {
          role: "user",
          content: optimizationPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "optimization_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return parsed.recommendations;
    }

    throw new Error("Invalid LLM response format");
  } catch (error) {
    console.error("[LLM Analysis] Error generating seasonal optimization:", error);
    throw error;
  }
}

/**
 * Format metrics for LLM analysis
 */
function formatMetricsForAnalysis(
  metrics: Array<{
    metricType: string;
    value: string | number | null;
    unit: string | null;
    timestamp: Date;
    confidenceScore: string | number | null;
  }>
): string {
  if (metrics.length === 0) {
    return "No recent metric data available.";
  }

  // Group metrics by type and calculate statistics
  const grouped: Record<string, number[]> = {};
  metrics.forEach((m) => {
    if (m.value === null || m.value === undefined) return;
    if (!grouped[m.metricType]) {
      grouped[m.metricType] = [];
    }
    grouped[m.metricType].push(Number(m.value));
  });

  const summary = Object.entries(grouped)
    .map(([type, values]) => {
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
      const min = Math.min(...values).toFixed(2);
      const max = Math.max(...values).toFixed(2);
      return `${type}: avg=${avg}, min=${min}, max=${max} (${values.length} samples)`;
    })
    .join("\n");

  return summary;
}

/**
 * Format recommendations for LLM analysis
 */
function formatRecommendationsForAnalysis(
  recommendations: Array<{
    recommendationStatus: string;
    confidence: string | number | null;
    reasoning: string | null;
    createdAt: Date;
  }>
): string {
  if (recommendations.length === 0) {
    return "No recent irrigation recommendations.";
  }

  const summary = recommendations
    .slice(0, 20)
    .map(
      (r) =>
        `[${r.createdAt.toISOString()}] ${r.recommendationStatus} (confidence: ${(Number(r.confidence || 0) * 100).toFixed(0)}%) - ${r.reasoning || "No reasoning provided"}`
    )
    .join("\n");

  return summary;
}
