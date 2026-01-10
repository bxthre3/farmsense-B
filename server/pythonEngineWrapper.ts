import { spawn } from "child_process";
import path from "path";
import { z } from "zod";

/**
 * Python Engine Wrapper
 * Provides a TypeScript interface to the Python FarmSense deterministic engine
 * Handles subprocess communication and error handling
 */

export type DomainType =
  | "planning"
  | "field_prep"
  | "planting"
  | "irrigation"
  | "nutrient"
  | "pest_weed"
  | "harvest"
  | "processing"
  | "packaging"
  | "warehousing"
  | "logistics";

export interface RecommendationOutput {
  domain: string;
  issued_at: string;
  valid_until: string;
  remaining_time: string;
  base_recommendation: "NOW" | "SOON" | "LATER" | "WAIT" | "MONITOR";
  urgency_level: "HIGH" | "MEDIUM" | "LOW" | "NONE" | "INFO" | "CRITICAL";
  display_color: "ORANGE" | "YELLOW" | "BLUE" | "GREEN" | "CYAN" | "RED";
  context_flags: string[];
  severity_overlays: string[];
  requires_human_confirmation: boolean;
  confirmed_at: string | null;
  explainability: {
    inputs_used: string[];
    thresholds_crossed: string[];
    thresholds_approaching: string[];
    trends_considered: string[];
    crop_stage: string;
  };
  kpis: Record<string, number>;
  predicted_next_recommendation: string | null;
  audit_log_id: string;
}

class PythonEngineWrapper {
  private pythonEnginePath: string;

  constructor() {
    this.pythonEnginePath = path.join(__dirname, "../../python-engine");
  }

  /**
   * Call Python engine to generate a recommendation for a specific domain
   */
  async getRecommendation(
    domain: DomainType,
    inputs: Record<string, any>
  ): Promise<RecommendationOutput> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonEnginePath, "engine_wrapper.py");

      const python = spawn("python3", [pythonScript], {
        cwd: this.pythonEnginePath,
        env: { ...process.env, PYTHONPATH: this.pythonEnginePath },
      });

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python engine error: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python engine output: ${output}`));
        }
      });

      // Send input data to Python process
      python.stdin.write(
        JSON.stringify({
          domain,
          inputs,
        })
      );
      python.stdin.end();

      // Timeout after 30 seconds
      setTimeout(() => {
        python.kill();
        reject(new Error("Python engine timeout"));
      }, 30000);
    });
  }

  /**
   * Get recommendations for all domains
   */
  async getAllRecommendations(
    allInputs: Record<DomainType, Record<string, any>>
  ): Promise<Record<DomainType, RecommendationOutput>> {
    const results: Record<DomainType, RecommendationOutput> = {} as any;

    const domains: DomainType[] = [
      "planning",
      "field_prep",
      "planting",
      "irrigation",
      "nutrient",
      "pest_weed",
      "harvest",
      "processing",
      "packaging",
      "warehousing",
      "logistics",
    ];

    for (const domain of domains) {
      try {
        const inputs = allInputs[domain] || {};
        results[domain] = await this.getRecommendation(domain, inputs);
      } catch (error) {
        console.error(`Error getting recommendation for ${domain}:`, error);
        // Return a default WAIT recommendation on error
        results[domain] = {
          domain,
          issued_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          remaining_time: "04:00:00",
          base_recommendation: "WAIT",
          urgency_level: "NONE",
          display_color: "GREEN",
          context_flags: [],
          severity_overlays: [],
          requires_human_confirmation: false,
          confirmed_at: null,
          explainability: {
            inputs_used: [],
            thresholds_crossed: [],
            thresholds_approaching: [],
            trends_considered: [],
            crop_stage: "UNKNOWN",
          },
          kpis: {},
          predicted_next_recommendation: null,
          audit_log_id: "",
        };
      }
    }

    return results;
  }

  /**
   * Confirm an emergency recommendation
   */
  async confirmEmergency(auditLogId: string): Promise<{ status: string; confirmed_at?: string }> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonEnginePath, "confirm_emergency.py");

      const python = spawn("python3", [pythonScript], {
        cwd: this.pythonEnginePath,
        env: { ...process.env, PYTHONPATH: this.pythonEnginePath },
      });

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python engine error: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python engine output: ${output}`));
        }
      });

      python.stdin.write(JSON.stringify({ audit_log_id: auditLogId }));
      python.stdin.end();

      setTimeout(() => {
        python.kill();
        reject(new Error("Python engine timeout"));
      }, 30000);
    });
  }
}

// Export singleton instance
export const pythonEngine = new PythonEngineWrapper();

/**
 * Validation schemas for domain-specific inputs
 */
export const irrigationInputSchema = z.object({
  awc: z.number().min(0).max(100),
  prev_awc: z.number().min(0).max(100).optional(),
  precipitation_forecast: z.number().min(0),
  crop_stage: z.string(),
  equipment_available: z.boolean(),
});

export const plantingInputSchema = z.object({
  soil_temp: z.number().min(-50).max(50),
  prev_soil_temp: z.number().min(-50).max(50).optional(),
  seed_ready: z.boolean(),
  labor_available: z.boolean(),
});

export const pestWeedInputSchema = z.object({
  pest_count: z.number().min(0),
  prev_pest_count: z.number().min(0).optional(),
  humidity: z.number().min(0).max(100),
  equipment_available: z.boolean(),
});

export const harvestInputSchema = z.object({
  skin_set: z.boolean(),
  soil_temp: z.number().min(-50).max(50),
  labor_available: z.boolean(),
  equipment_available: z.boolean(),
});

export const nutrientInputSchema = z.object({
  nitrogen: z.number().min(0),
  prev_nitrogen: z.number().min(0).optional(),
  crop_stage: z.string(),
  materials_available: z.boolean(),
});

export const fieldPrepInputSchema = z.object({
  awc: z.number().min(0).max(100),
  compaction_level: z.number().min(0).max(100),
  precipitation_forecast: z.number().min(0),
  equipment_available: z.boolean(),
});

export const planningInputSchema = z.object({
  plan_finalized: z.boolean(),
  market_data_ready: z.boolean(),
  labor_available: z.boolean(),
});

export const processingInputSchema = z.object({
  queue_size: z.number().min(0),
  capacity_available: z.boolean(),
});

export const packagingInputSchema = z.object({
  inventory_level: z.number().min(0),
  materials_available: z.boolean(),
});

export const warehousingInputSchema = z.object({
  storage_temp: z.number().min(-50).max(50),
  prev_storage_temp: z.number().min(-50).max(50).optional(),
  capacity_available: z.boolean(),
});

export const logisticsInputSchema = z.object({
  orders_pending: z.number().min(0),
  trucks_available: z.boolean(),
});
