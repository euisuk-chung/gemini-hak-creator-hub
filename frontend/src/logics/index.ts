/**
 * logics/ — Backend Logic & Algorithm Layer
 *
 * This folder contains the core analysis logic, separated from UI concerns.
 * Designed for co-work: backend team reviews this folder independently.
 *
 * Structure:
 *   ontology.ts  — Malicious comment taxonomy (Domain → Category → SubType)
 *   rules.ts     — Rule-based detection engine (regex patterns, scoring)
 *   prompt.ts    — Gemini AI system prompt (English instructions)
 *   index.ts     — Public API exports
 *
 * Architecture:
 *   Comment → [Rule Engine (pre-screen)] → [Gemini AI (deep analysis)] → [Rule Engine (validation)] → Result
 *
 * The Rule Engine and Gemini AI work in tandem:
 *   - Rule Engine: Fast, deterministic, catches obvious patterns
 *   - Gemini AI:   Context-aware, handles sarcasm/irony, nuanced analysis
 */

// Ontology
export {
  TOXICITY_ONTOLOGY,
  getOntologyNode,
  getCategoriesByDomain,
} from './ontology';
export type {
  ToxicDomain,
  ToxicCategory,
  ToxicSubType,
  OntologyNode,
} from './ontology';

// Rules Engine
export {
  DETECTION_RULES,
  evaluateRules,
  preScreenScore,
} from './rules';
export type {
  DetectionRule,
  RuleMatchResult,
} from './rules';

// Gemini Prompt
export { TOXICITY_ANALYSIS_PROMPT } from './prompt';
