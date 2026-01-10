import { pgTable, uuid, varchar, timestamp, decimal, jsonb, boolean, text, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const recommendationEnum = pgEnum('recommendation_level', ['NOW', 'SOON', 'LATER', 'WAIT', 'MONITOR']);
export const urgencyEnum = pgEnum('urgency_level', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE', 'INFO']);
export const domainEnum = pgEnum('domain_type', [
  'PLANNING', 'FIELD_PREP', 'PLANTING', 'IRRIGATION', 'NUTRIENT', 
  'PEST_WEED', 'HARVEST', 'PROCESSING', 'PACKAGING', 'WAREHOUSING', 'LOGISTICS'
]);

// Farms table
export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  region: varchar('region', { length: 255 }),
  totalAcres: decimal('total_acres', { precision: 10, scale: 2 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Fields table
export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id').references(() => farms.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  acres: decimal('acres', { precision: 10, scale: 2 }),
  cropTypeId: uuid('crop_type_id'),
  soilTypeId: uuid('soil_type_id'),
  boundaries: jsonb('boundaries'), // GeoJSON
  equipmentIds: jsonb('equipment_ids').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Metrics table (Time-series)
export const metrics = pgTable('metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').references(() => fields.id).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  value: decimal('value', { precision: 20, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  resolution: jsonb('resolution'), // ResolutionMetadata
  dataQualityFlags: jsonb('data_quality_flags').$type<string[]>()
});

// Recommendations table
export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: domainEnum('domain').notNull(),
  fieldId: uuid('field_id').references(() => fields.id).notNull(),
  issuedAt: timestamp('issued_at').notNull().defaultNow(),
  validUntil: timestamp('valid_until').notNull(),
  baseRecommendation: recommendationEnum('base_recommendation').notNull(),
  urgencyLevel: urgencyEnum('urgency_level').notNull(),
  displayColor: varchar('display_color', { length: 20 }).notNull(),
  contextFlags: jsonb('context_flags').$type<string[]>(),
  severityOverlays: jsonb('severity_overlays').$type<string[]>(),
  requiresHumanConfirmation: boolean('requires_human_confirmation').default(false),
  confirmedAt: timestamp('confirmed_at'),
  explainability: jsonb('explainability').notNull(),
  kpis: jsonb('kpis').notNull(),
  predictedNextRecommendation: recommendationEnum('predicted_next_recommendation'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
  auditLogId: uuid('audit_log_id').notNull(),
  rawInputs: jsonb('raw_inputs')
});

// Equipment table
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').references(() => fields.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  controlProtocol: varchar('control_protocol', { length: 50 }).notNull(),
  networkConfig: jsonb('network_config'),
  operationalStatus: varchar('operational_status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
