import { describe, it, expect } from "vitest";
import {
  makeDecision,
  assessResolution,
  validateControlAction,
  DecisionInput,
} from "./decisionEngine";
import { NormalizedMetric, Field, Crop, SoilType } from "../drizzle/schema";

describe("Decision Engine", () => {
  // Mock data
  const mockField: Field = {
    id: 1,
    farmId: 1,
    name: "Test Field",
    cropId: 1,
    soilTypeId: 1,
    acres: 10,
    latitude: 38.5,
    longitude: -104.5,
    irrigationEquipmentId: 1,
    description: "Test field for irrigation",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCrop: Crop = {
    id: 1,
    name: "Corn",
    cropType: "corn",
    waterRequirementMmPerDay: 5,
    rootDepthCm: 60,
    growthStage: "V6",
    description: "Corn crop",
    createdAt: new Date(),
  };

  const mockSoilType: SoilType = {
    id: 1,
    name: "Loam",
    texture: "loam",
    fieldCapacityPercent: 30,
    wiltingPointPercent: 12,
    bulkDensityGPerCm3: 1.3,
    description: "Loamy soil",
    createdAt: new Date(),
  };

  const createMockMetric = (
    metricType: string,
    value: number,
    confidence: number = 0.85
  ): NormalizedMetric => ({
    id: 1,
    fieldId: 1,
    metricType,
    value,
    unit: metricType === "soil_moisture" ? "%" : "°C",
    temporalResolutionMinutes: 60,
    spatialResolutionMeters: 1,
    confidenceScore: confidence,
    sourceResolution: "60min/1m",
    aggregationMethod: "direct",
    timestamp: new Date(),
    recordedAt: new Date(),
    createdAt: new Date(),
  });

  describe("assessResolution", () => {
    it("should assess high confidence when all data is available", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 25, 0.9),
        soilTemperature: createMockMetric("soil_temperature", 18, 0.85),
        precipitation: createMockMetric("precipitation", 0, 0.8),
        evapotranspiration: createMockMetric("evapotranspiration", 4, 0.75),
        recentPrecipitation: 0,
      };

      const assessment = assessResolution(input);

      expect(assessment.overallConfidence).toBeGreaterThan(0.7);
      expect(assessment.isSafeForActuation).toBe(true);
      expect(assessment.dataQualityIssues.length).toBe(0);
    });

    it("should flag low confidence when soil moisture is missing", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: null,
        soilTemperature: createMockMetric("soil_temperature", 18, 0.85),
        precipitation: createMockMetric("precipitation", 0, 0.8),
        evapotranspiration: createMockMetric("evapotranspiration", 4, 0.75),
        recentPrecipitation: 0,
      };

      const assessment = assessResolution(input);

      expect(assessment.dataQualityIssues).toContain("No soil moisture data available");
      expect(assessment.isSafeForActuation).toBe(false);
    });

    it("should flag low confidence when metric confidence is below threshold", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 25, 0.4),
        soilTemperature: createMockMetric("soil_temperature", 18, 0.85),
        precipitation: createMockMetric("precipitation", 0, 0.8),
        evapotranspiration: createMockMetric("evapotranspiration", 4, 0.75),
        recentPrecipitation: 0,
      };

      const assessment = assessResolution(input);

      expect(assessment.dataQualityIssues).toContain("Low soil moisture confidence");
      expect(assessment.isSafeForActuation).toBe(false);
    });
  });

  describe("makeDecision", () => {
    it("should recommend HOLD when insufficient data", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: null,
        soilTemperature: null,
        precipitation: null,
        evapotranspiration: null,
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("HOLD");
      expect(decision.confidence).toBeLessThan(0.5);
    });

    it("should recommend DELAY when recent precipitation is sufficient", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 25),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 15),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 15,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("DELAY");
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it("should recommend IRRIGATE when soil moisture is critically low", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 10),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("IRRIGATE");
      expect(decision.confidence).toBeGreaterThan(0.9);
      expect(decision.recommendedDurationMinutes).toBeGreaterThan(0);
    });

    it("should recommend IRRIGATE when soil moisture is below threshold with high ET", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 16),
        soilTemperature: createMockMetric("soil_temperature", 22),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 6),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("IRRIGATE");
      expect(decision.confidence).toBeGreaterThan(0.7);
    });

    it("should recommend DELAY when soil moisture is below threshold but ET is low", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 16),
        soilTemperature: createMockMetric("soil_temperature", 15),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 2),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("DELAY");
      expect(decision.confidence).toBeGreaterThan(0.6);
    });

    it("should recommend HOLD when soil moisture is adequate", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 26),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("HOLD");
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it("should recommend HOLD when soil temperature is too low", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 18),
        soilTemperature: createMockMetric("soil_temperature", 8),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.recommendation).toBe("HOLD");
      expect(decision.reasoning).toContain("temperature");
    });
  });

  describe("validateControlAction", () => {
    it("should validate successfully with high confidence recommendation", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 10),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      const validation = validateControlAction(decision, "operational", []);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it("should reject control action when equipment is not operational", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 10),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      const validation = validateControlAction(decision, "maintenance", []);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Equipment status is maintenance, not operational");
    });

    it("should warn when confidence is low", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 25, 0.4),
        soilTemperature: createMockMetric("soil_temperature", 18, 0.4),
        precipitation: createMockMetric("precipitation", 0, 0.4),
        evapotranspiration: createMockMetric("evapotranspiration", 4, 0.4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      const validation = validateControlAction(decision, "operational", []);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Rule Evaluations", () => {
    it("should evaluate all rules and include them in decision result", () => {
      const input: DecisionInput = {
        field: mockField,
        crop: mockCrop,
        soilType: mockSoilType,
        soilMoisture: createMockMetric("soil_moisture", 25),
        soilTemperature: createMockMetric("soil_temperature", 18),
        precipitation: createMockMetric("precipitation", 0),
        evapotranspiration: createMockMetric("evapotranspiration", 4),
        recentPrecipitation: 0,
      };

      const decision = makeDecision(input);

      expect(decision.ruleEvaluations).toBeDefined();
      expect(Object.keys(decision.ruleEvaluations).length).toBeGreaterThan(0);
    });
  });
});
