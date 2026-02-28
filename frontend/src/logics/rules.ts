/**
 * Toxicity Scoring Rules Engine v2
 *
 * Rule-based scoring system that complements Gemini AI analysis.
 * Used for:
 *   1. Pre-screening before AI (quick filter)
 *   2. Post-validation after AI (sanity check)
 *   3. Fallback when AI is unavailable
 *
 * v2 changes:
 *   - Fixed MOCKERY false positives (ㅋ{5,} → ㅋ{10,} + negative context)
 *   - Fixed THREAT false positives (idiomatic expressions excluded)
 *   - Fixed HATE_SPEECH false positives (한남동, 한남자 excluded)
 *   - Added BELITTLING patterns (한심, 멍청, 바보, 노답)
 *   - Added GENERATION_HATE patterns (꼰대, 틀딱, 잼민이)
 *   - Added POLITICAL_SLUR patterns (빨갱이, 수꼴, 좌좀)
 *   - Added CONSUMER_ATTACK patterns (호구, 흑우)
 *   - Added relation-aware scoring via getCombinedSeverityModifier
 */

import type { ToxicCategory } from './ontology';
import { getCombinedSeverityModifier } from './ontology';

// ─── Rule Definition ───────────────────────────────────────────────

export interface DetectionRule {
  id: string;
  category: ToxicCategory;
  description: string;
  patterns: RegExp[];
  negativePatterns?: RegExp[];  // v2: patterns that cancel detection (false positive guard)
  scoreModifier: number;
  confidence: 'high' | 'medium' | 'low';
}

// ─── Korean Profanity Patterns ─────────────────────────────────────

const CHOSUNG_SWEAR_PATTERNS = [
  /[ㅅㅆ][ㅂ]/,
  /ㅈㄹ/,
  /ㄱㅅㄲ/,
  /[ㅂ][ㅅ]/,
  /ㅁㅊ/,
  /ㄲㅈ/,
  /ㅈㄴ/,
];

const MORPHED_SWEAR_PATTERNS = [
  /시[1!i]발/i,
  /씨[빠바]/,
  /지[1!i]랄/i,
  /ㅂ[rR]보/i,
  /[sS]발/,
  /병[시씬]|병1/,
];

const DIRECT_SWEAR_PATTERNS = [
  /시발|씨발|씨팔/,
  /개새끼|개세끼|개색/,
  /병신/,
  /지랄/,
  /꺼져|닥쳐|꺼지/,
];

// ─── Mockery / Sarcasm Patterns (v2: tightened) ──────────────────

const SARCASM_PATTERNS = [
  /와\s*진짜\s*잘.+[~ㅋ]/,
  /대단하시네\s*[ㅋㅎ]/,
  /ㅋ{10,}/,                         // v2: raised from 5 to 10
  /실화\?{2,}/,
  /이걸?\s*왜\s*올[리림].*\?/,
];

// ─── Consumer Attack Patterns (v2: new) ──────────────────────────

const CONSUMER_ATTACK_PATTERNS = [
  /호구/,
  /흑우/,
  /봉이네|봉이다/,
  /호갱/,
];

// ─── Threat Patterns (v2: false positive guards added) ───────────

const THREAT_PATTERNS = [
  /죽어|뒤져|뒤질/,
  /찾아간다|찾아갈/,
  /패[버]린다|패줄까/,
  /신상\s*(까|턴|공개)/,
  /자살\s*(해|하|좀)/,
];

const THREAT_NEGATIVE_PATTERNS = [
  /죽어도\s*(안|못|싫)/,              // "죽어도 안 해" = idiom, not threat
  /별점\s*테러/,                       // "별점테러" = review bombing, not terror
  /리뷰\s*테러/,
  /테러\s*방지/,
  /테러리스트/,                        // discussing terrorism, not threatening
];

// ─── Personal Attack Patterns ──────────────────────────────────────

const PERSONAL_ATTACK_PATTERNS = [
  /못생[겼긴김]/,
  /관종/,
  /찐따/,
  /인성\s*(쓰레기|문제|봐)/,
  /재능\s*(없|이\s*없)/,
];

// ─── Belittling Patterns (v2: new) ─────────────────────────────────

const BELITTLING_PATTERNS = [
  /한심하[다네]/,
  /멍청/,
  /바보/,
  /무식/,
  /노답/,
  /저능/,
  /무뇌/,
  /답답하[다네]/,
];

// ─── Blame Patterns ────────────────────────────────────────────────

const BLAME_PATTERNS = [
  /.+해서\s*망한/,
  /그러니까\s*.+하지/,
  /이래서\s*(안|못)\s*되는/,
  /구독자가\s*그것밖에/,
  /당연하지\s*뭐/,
];

// ─── Fan War Patterns ──────────────────────────────────────────────

const FAN_WAR_PATTERNS = [
  /.+팬들?은?\s*다\s*이래/,
  /빠순이/,
  /사생팬|사생/,
  /탈덕/,
  /안티/,
  /조작/,
];

// ─── Hate Speech Patterns (v2: false positive guards) ──────────────

const HATE_SPEECH_PATTERNS = [
  /한남|한녀/,
  /김치녀|된장녀/,
  /.+충$/,
  /페미|꼴페미/,
];

const HATE_SPEECH_NEGATIVE_PATTERNS = [
  /한남동/,                            // Hannam-dong (place name)
  /한남[자대역교오]/,                   // 한남자, 한남대, 한남역, etc.
  /따뜻한남/,                          // 따뜻한 남자
];

// ─── Political Slur Patterns (v2: new) ─────────────────────────────

const POLITICAL_SLUR_PATTERNS = [
  /빨갱이/,
  /수꼴/,
  /꼴통/,
  /좌좀|우좀/,
  /국짐/,
  /민주짱/,
  /찍소/,
];

// ─── Discrimination Patterns ──────────────────────────────────────

const DISCRIMINATION_PATTERNS = [
  /촌놈/,
  /늙은이/,
  /.+학교\s*나온\s*게/,
  /전라도|경상도/,
];

// ─── Generation Hate Patterns (v2: new) ────────────────────────────

const GENERATION_HATE_PATTERNS = [
  /꼰대/,
  /틀딱/,
  /잼민이/,
  /급식충/,
  /요즘\s*것들/,
  /노인네/,
];

// ─── Spam Patterns ─────────────────────────────────────────────────

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /구독.*해\s*주/,
  /홍보|이벤트|당첨/,
];

// ─── Rule Definitions ──────────────────────────────────────────────

export const DETECTION_RULES: DetectionRule[] = [
  // PROFANITY rules
  {
    id: 'PROF_CHOSUNG',
    category: 'PROFANITY',
    description: 'Chosung (initial consonant) abbreviation swear words',
    patterns: CHOSUNG_SWEAR_PATTERNS,
    scoreModifier: 35,
    confidence: 'high',
  },
  {
    id: 'PROF_MORPHED',
    category: 'PROFANITY',
    description: 'Morphed/disguised swear words using number/letter substitution',
    patterns: MORPHED_SWEAR_PATTERNS,
    scoreModifier: 40,
    confidence: 'high',
  },
  {
    id: 'PROF_DIRECT',
    category: 'PROFANITY',
    description: 'Direct explicit swear words',
    patterns: DIRECT_SWEAR_PATTERNS,
    scoreModifier: 50,
    confidence: 'high',
  },

  // MOCKERY rules (v2: tightened ㅋ threshold)
  {
    id: 'MOCK_SARCASM',
    category: 'MOCKERY',
    description: 'Sarcastic expressions using positive words with mocking tone markers',
    patterns: SARCASM_PATTERNS,
    scoreModifier: 30,
    confidence: 'medium',
  },

  // CONSUMER_ATTACK (v2: new)
  {
    id: 'MOCK_CONSUMER',
    category: 'MOCKERY',
    description: 'Consumer-targeted mockery (호구, 흑우)',
    patterns: CONSUMER_ATTACK_PATTERNS,
    scoreModifier: 30,
    confidence: 'medium',
  },

  // THREAT rules (v2: negative patterns added)
  {
    id: 'THREAT_VIOLENCE',
    category: 'THREAT',
    description: 'Direct violence threats or harm wishes',
    patterns: THREAT_PATTERNS,
    negativePatterns: THREAT_NEGATIVE_PATTERNS,
    scoreModifier: 65,
    confidence: 'high',
  },

  // PERSONAL_ATTACK rules
  {
    id: 'PA_DIRECT',
    category: 'PERSONAL_ATTACK',
    description: 'Direct personal attacks on appearance, ability, or character',
    patterns: PERSONAL_ATTACK_PATTERNS,
    scoreModifier: 50,
    confidence: 'high',
  },

  // BELITTLING (v2: new)
  {
    id: 'PA_BELITTLE',
    category: 'PERSONAL_ATTACK',
    description: 'Belittling/dismissive language (한심, 멍청, 바보, 노답)',
    patterns: BELITTLING_PATTERNS,
    scoreModifier: 35,
    confidence: 'medium',
  },

  // BLAME rules
  {
    id: 'BLAME_PATTERN',
    category: 'BLAME',
    description: 'Baseless criticism, defamation, or content bashing',
    patterns: BLAME_PATTERNS,
    scoreModifier: 30,
    confidence: 'medium',
  },

  // FAN_WAR rules
  {
    id: 'FW_PATTERN',
    category: 'FAN_WAR',
    description: 'Fandom conflict, anti-fan activity, or comparison attacks',
    patterns: FAN_WAR_PATTERNS,
    scoreModifier: 35,
    confidence: 'medium',
  },

  // HATE_SPEECH rules (v2: negative patterns added)
  {
    id: 'HS_GENDER',
    category: 'HATE_SPEECH',
    description: 'Gender-based hate speech including Korean-specific slurs',
    patterns: HATE_SPEECH_PATTERNS,
    negativePatterns: HATE_SPEECH_NEGATIVE_PATTERNS,
    scoreModifier: 55,
    confidence: 'high',
  },

  // POLITICAL_SLUR (v2: new)
  {
    id: 'HS_POLITICAL',
    category: 'HATE_SPEECH',
    description: 'Political slurs and partisan hate speech',
    patterns: POLITICAL_SLUR_PATTERNS,
    scoreModifier: 45,
    confidence: 'high',
  },

  // DISCRIMINATION rules
  {
    id: 'DISCRIM_PATTERN',
    category: 'DISCRIMINATION',
    description: 'Regional, age, education, or appearance discrimination',
    patterns: DISCRIMINATION_PATTERNS,
    scoreModifier: 45,
    confidence: 'medium',
  },

  // GENERATION_HATE (v2: new)
  {
    id: 'DISCRIM_GENERATION',
    category: 'DISCRIMINATION',
    description: 'Generational hate speech (꼰대, 틀딱, 잼민이)',
    patterns: GENERATION_HATE_PATTERNS,
    scoreModifier: 40,
    confidence: 'medium',
  },

  // SPAM rules
  {
    id: 'SPAM_LINK',
    category: 'SPAM',
    description: 'Spam comments with promotional links or repetitive content',
    patterns: SPAM_PATTERNS,
    scoreModifier: 20,
    confidence: 'medium',
  },
];

// ─── Rule Engine ───────────────────────────────────────────────────

export interface RuleMatchResult {
  ruleId: string;
  category: ToxicCategory;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  scoreModifier: number;
  matchedPattern: string;
}

/**
 * Run all detection rules against a comment text.
 * Returns matched rules with their score contributions.
 * v2: respects negativePatterns to avoid false positives.
 */
export function evaluateRules(text: string): RuleMatchResult[] {
  const results: RuleMatchResult[] = [];

  for (const rule of DETECTION_RULES) {
    // v2: check negative patterns first
    if (rule.negativePatterns) {
      const isNegative = rule.negativePatterns.some((np) => np.test(text));
      if (isNegative) continue;
    }

    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
      if (match) {
        results.push({
          ruleId: rule.id,
          category: rule.category,
          description: rule.description,
          confidence: rule.confidence,
          scoreModifier: rule.scoreModifier,
          matchedPattern: match[0],
        });
        break; // One match per rule is enough
      }
    }
  }

  return results;
}

/**
 * Quick pre-screen: estimate toxicity score from rules alone.
 * v2: applies category relation modifiers for multi-category hits.
 */
export function preScreenScore(text: string): {
  estimatedScore: number;
  categories: ToxicCategory[];
  isLikelyToxic: boolean;
} {
  const matches = evaluateRules(text);

  if (matches.length === 0) {
    return { estimatedScore: 0, categories: [], isLikelyToxic: false };
  }

  const maxScore = Math.max(...matches.map((m) => m.scoreModifier));
  const uniqueCategories = [...new Set(matches.map((m) => m.category))];

  // v2: use relation-based modifier instead of flat bonus
  const relationBonus = getCombinedSeverityModifier(uniqueCategories);
  const categoryBonus = Math.min((uniqueCategories.length - 1) * 5, 15);
  const bonus = Math.max(relationBonus, categoryBonus);

  const estimatedScore = Math.min(maxScore + bonus, 100);

  return {
    estimatedScore,
    categories: uniqueCategories,
    isLikelyToxic: estimatedScore >= 30,
  };
}
