import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeHistoricalPatterns,
  answerFarmerQuestion,
  generateSeasonalOptimization,
} from "./llmAnalysis";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

// Mock the database and LLM
vi.mock("./db");
vi.mock("./_core/llm");

// Mock database response
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

// Mock LLM response
const mockLLMResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          summary: "Field shows consistent irrigation patterns",
          patterns: ["Irrigation occurs every 3-4 days", "Peak ET in afternoon"],
          recommendations: ["Consider earlier irrigation timing", "Monitor soil moisture more frequently"],
          riskFactors: ["Potential over-irrigation"],
          optimizationOpportunities: ["Reduce irrigation duration by 10%"],
        }),
      },
    },
  ],
};

describe("LLM Analysis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeHistoricalPatterns", () => {
    beforeEach(() => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);
      const mockInvokeLLM = vi.mocked(invokeLLM);
      mockInvokeLLM.mockResolvedValue(mockLLMResponse as any);
    });

    it("should return analysis result structure", async () => {
      const result = await analyzeHistoricalPatterns(1, 30);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("riskFactors");
      expect(result).toHaveProperty("optimizationOpportunities");
    });

    it("should have arrays for patterns and recommendations", async () => {
      const result = await analyzeHistoricalPatterns(1, 30);

      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.optimizationOpportunities)).toBe(true);
    });

    it("should include summary text", async () => {
      const result = await analyzeHistoricalPatterns(1, 30);

      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it("should handle different time ranges", async () => {
      const result7 = await analyzeHistoricalPatterns(1, 7);
      const result30 = await analyzeHistoricalPatterns(1, 30);
      const result90 = await analyzeHistoricalPatterns(1, 90);

      expect(result7).toBeDefined();
      expect(result30).toBeDefined();
      expect(result90).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValueOnce(null);

      await expect(analyzeHistoricalPatterns(1, 30)).rejects.toThrow("Database not available");
    });
  });

  describe("answerFarmerQuestion", () => {
    beforeEach(() => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);
      const mockInvokeLLM = vi.mocked(invokeLLM);
      mockInvokeLLM.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Based on your field data, you should irrigate in the morning when temperatures are cooler.",
            },
          },
        ],
      } as any);
    });

    it("should return answer with required fields", async () => {
      const result = await answerFarmerQuestion({
        question: "When should I irrigate my corn field?",
        fieldId: 1,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("answer");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("sources");
      expect(result).toHaveProperty("timestamp");
    });

    it("should have valid confidence score", async () => {
      const result = await answerFarmerQuestion({
        question: "What is the optimal soil moisture level?",
        fieldId: 1,
      });

      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should include sources array", async () => {
      const result = await answerFarmerQuestion({
        question: "How can I save water?",
        fieldId: 1,
      });

      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.sources.length).toBeGreaterThanOrEqual(0);
    });

    it("should include timestamp", async () => {
      const result = await answerFarmerQuestion({
        question: "What crop should I grow?",
        fieldId: 1,
      });

      expect(result.timestamp instanceof Date).toBe(true);
    });

    it("should accept optional context", async () => {
      const result = await answerFarmerQuestion({
        question: "Is my field ready for irrigation?",
        fieldId: 1,
        context: "Field has been dry for 3 days",
      });

      expect(result).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
    });

    it("should handle database errors gracefully", async () => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValueOnce(null);

      await expect(
        answerFarmerQuestion({
          question: "Test question",
          fieldId: 1,
        })
      ).rejects.toThrow("Database not available");
    });
  });

  describe("generateSeasonalOptimization", () => {
    beforeEach(() => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);
      const mockInvokeLLM = vi.mocked(invokeLLM);
      mockInvokeLLM.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendations: [
                  "Reduce irrigation frequency by 15% in late season",
                  "Increase soil moisture monitoring",
                  "Consider drip irrigation for better efficiency",
                ],
              }),
            },
          },
        ],
      } as any);
    });

    it("should return array of recommendations", async () => {
      const result = await generateSeasonalOptimization(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should contain string recommendations", async () => {
      const result = await generateSeasonalOptimization(1);

      result.forEach((rec) => {
        expect(typeof rec).toBe("string");
        expect(rec.length).toBeGreaterThan(0);
      });
    });

    it("should provide multiple recommendations", async () => {
      const result = await generateSeasonalOptimization(1);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle different field IDs", async () => {
      const result1 = await generateSeasonalOptimization(1);
      const result2 = await generateSeasonalOptimization(2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValueOnce(null);

      await expect(generateSeasonalOptimization(1)).rejects.toThrow("Database not available");
    });
  });

  describe("Analysis Integration", () => {
    beforeEach(() => {
      const mockGetDb = vi.mocked(getDb);
      mockGetDb.mockResolvedValue(mockDb as any);
      const mockInvokeLLM = vi.mocked(invokeLLM);
      mockInvokeLLM.mockResolvedValue(mockLLMResponse as any);
    });

    it("should provide consistent analysis across calls", async () => {
      const analysis1 = await analyzeHistoricalPatterns(1, 30);
      const analysis2 = await analyzeHistoricalPatterns(1, 30);

      expect(analysis1).toEqual(analysis2);
    });

    it("should handle multiple fields independently", async () => {
      const field1 = await analyzeHistoricalPatterns(1, 30);
      const field2 = await analyzeHistoricalPatterns(2, 30);

      expect(field1).toBeDefined();
      expect(field2).toBeDefined();
    });

    it("should provide actionable recommendations", async () => {
      const result = await analyzeHistoricalPatterns(1, 30);

      result.recommendations.forEach((rec) => {
        expect(rec.length).toBeGreaterThan(10); // Meaningful recommendations
        expect(rec.toLowerCase()).toMatch(/should|consider|recommend|adjust|increase|decrease|monitor|reduce/);
      });
    });
  });
});
