import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';
import { domainRegistry } from '../domains/index.js';
import { DomainType, DomainEngineInput } from '../../shared/types.js';
import { farms, fields, metrics } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const appRouter = router({
  // Domain procedures
  domains: router({
    listAll: publicProcedure.query(async () => {
      const domains = domainRegistry.getAvailableDomains();
      return domains.map(d => ({
        domain: d,
        available: true
      }));
    }),

    listAllRecommendations: publicProcedure
      .input(z.object({ fieldId: z.string() }))
      .query(async ({ input }) => {
        const domains = domainRegistry.getAvailableDomains();
        const recommendations = await Promise.all(
          domains.map(async (domain) => {
            const engine = domainRegistry.getEngine(domain);
            if (!engine) return null;

            const engineInput: DomainEngineInput = {
              fieldId: input.fieldId,
              currentMetrics: {
                'soil_moisture': { value: 18, unit: '%', timestamp: new Date(), confidenceScore: 0.9, metricType: 'soil_moisture' },
                'evapotranspiration': { value: 5.2, unit: 'mm', timestamp: new Date(), confidenceScore: 0.85, metricType: 'evapotranspiration' },
                'precipitation_24h': { value: 0, unit: 'mm', timestamp: new Date(), confidenceScore: 0.95, metricType: 'precipitation_24h' },
                'market_data_ready': { value: 1, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'market_data_ready' },
                'budget_approved': { value: 1, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'budget_approved' },
                'labor_available': { value: 1, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'labor_available' }
              },
              soilData: {
                fieldCapacityPercent: 30,
                wiltingPointPercent: 12
              }
            };

            try {
              return await engine.generateRecommendation(engineInput);
            } catch (e) {
              console.error(`Error generating recommendation for ${domain}:`, e);
              return null;
            }
          })
        );
        return recommendations.filter(r => r !== null);
      }),
    
    getRecommendation: publicProcedure
      .input(z.object({
        domain: z.nativeEnum(DomainType),
        fieldId: z.string(),
        manualOverrides: z.record(z.any()).optional()
      }))
      .query(async ({ input }) => {
        const engine = domainRegistry.getEngine(input.domain);
        if (!engine) {
          throw new Error(`Domain ${input.domain} not available`);
        }
        
        const engineInput: DomainEngineInput = {
          fieldId: input.fieldId,
          currentMetrics: {
            soil_moisture: { value: 15, unit: '%', timestamp: new Date(), confidenceScore: 0.9, metricType: 'soil_moisture' },
            soil_temperature: { value: 18, unit: '°C', timestamp: new Date(), confidenceScore: 0.9, metricType: 'soil_temperature' },
            precipitation: { value: 0, unit: 'mm', timestamp: new Date(), confidenceScore: 0.9, metricType: 'precipitation' },
            evapotranspiration: { value: 4.5, unit: 'mm', timestamp: new Date(), confidenceScore: 0.9, metricType: 'evapotranspiration' },
            plan_finalized: { value: 0, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'plan_finalized' },
            market_data_ready: { value: 1, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'market_data_ready' },
            labor_available: { value: 1, unit: 'bool', timestamp: new Date(), confidenceScore: 1.0, metricType: 'labor_available' }
          },
          soilData: { wiltingPointPercent: 12, fieldCapacityPercent: 30 } as any,
          rawInputs: input.manualOverrides ?? {}
        };
        
        return await engine.generateRecommendation(engineInput);
      }),
  }),
  
  // Farm procedures
  farms: publicProcedure.query(async ({ ctx }) => {
    const farmList = await ctx.db.select().from(farms);
    if (farmList.length === 0) {
      return [{
        id: 'demo-farm-1',
        name: 'FarmSense Demo Farm',
        region: 'Idaho, USA',
        totalAcres: '500.00',
        latitude: '43.6150',
        longitude: '-116.2023'
      }];
    }
    return farmList;
  }),

  // Metrics procedures
  metrics: router({
    getLatest: publicProcedure
      .input(z.object({ fieldId: z.string() }))
      .query(async ({ input, ctx }) => {
        const latestMetrics = await ctx.db.select()
          .from(metrics)
          .where(eq(metrics.fieldId, input.fieldId))
          .orderBy(desc(metrics.timestamp))
          .limit(10);
          
        if (latestMetrics.length === 0) {
          return [
            { metricType: 'soil_moisture', value: '15.5', unit: '%', timestamp: new Date() },
            { metricType: 'soil_temperature', value: '18.2', unit: '°C', timestamp: new Date() },
            { metricType: 'precipitation', value: '0.0', unit: 'mm', timestamp: new Date() }
          ];
        }
        return latestMetrics;
      }),
  }),
});

export type AppRouter = typeof appRouter;
