"""
Korean Profanity & Toxicity Pattern Detection v2

Ported from frontend/src/logics/rules.ts and ontology.ts.
Detects toxic patterns in Korean YouTube comments using regex-based rules.

v2 changes:
  - Fixed MOCKERY false positives (ㅋ{5,} -> ㅋ{10,})
  - Fixed THREAT false positives (idiomatic expressions excluded)
  - Fixed HATE_SPEECH false positives (한남동, 한남자 excluded)
  - Added BELITTLING, GENERATION_HATE, POLITICAL_SLUR, CONSUMER_ATTACK
  - Added category relations for combined severity scoring
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ─── Types ─────────────────────────────────────────────────────────

ToxicCategory = str

CATEGORIES: list[str] = [
    "PROFANITY",
    "BLAME",
    "MOCKERY",
    "PERSONAL_ATTACK",
    "HATE_SPEECH",
    "THREAT",
    "SEXUAL",
    "DISCRIMINATION",
    "FAN_WAR",
    "SPAM",
]


@dataclass
class DetectionRule:
    id: str
    category: ToxicCategory
    description: str
    patterns: list[re.Pattern[str]]
    score_modifier: int
    confidence: str  # "high" | "medium" | "low"
    negative_patterns: list[re.Pattern[str]] = field(default_factory=list)


@dataclass
class RuleMatch:
    rule_id: str
    category: ToxicCategory
    description: str
    confidence: str
    score_modifier: int
    matched_pattern: str


@dataclass
class AnalysisResult:
    toxicity_score: int = 0
    matched_categories: list[str] = field(default_factory=list)
    matched_patterns: list[str] = field(default_factory=list)
    matched_rules: list[str] = field(default_factory=list)
    is_toxic: bool = False


# ─── Category Relations (mirrors ontology.ts CATEGORY_RELATIONS) ──

CATEGORY_RELATIONS: list[dict] = [
    {"from": "PROFANITY", "to": "PERSONAL_ATTACK", "modifier": 15},
    {"from": "PROFANITY", "to": "THREAT", "modifier": 20},
    {"from": "MOCKERY", "to": "PERSONAL_ATTACK", "modifier": 10},
    {"from": "HATE_SPEECH", "to": "DISCRIMINATION", "modifier": 15},
    {"from": "MOCKERY", "to": "BLAME", "modifier": 5},
    {"from": "PERSONAL_ATTACK", "to": "HATE_SPEECH", "modifier": 10},
    {"from": "FAN_WAR", "to": "MOCKERY", "modifier": 5},
    {"from": "FAN_WAR", "to": "PERSONAL_ATTACK", "modifier": 10},
    {"from": "FAN_WAR", "to": "THREAT", "modifier": 20},
]


def get_combined_severity_modifier(categories: list[str]) -> int:
    """Calculate bonus severity when multiple related categories co-occur."""
    if len(categories) < 2:
        return 0
    modifier = 0
    for rel in CATEGORY_RELATIONS:
        if rel["from"] in categories and rel["to"] in categories:
            modifier += rel["modifier"]
    return modifier


# ─── Korean Profanity Patterns ─────────────────────────────────────

CHOSUNG_SWEAR_PATTERNS = [
    re.compile(r"[ㅅㅆ][ㅂ]"),
    re.compile(r"ㅈㄹ"),
    re.compile(r"ㄱㅅㄲ"),
    re.compile(r"[ㅂ][ㅅ]"),
    re.compile(r"ㅁㅊ"),
    re.compile(r"ㄲㅈ"),
    re.compile(r"ㅈㄴ"),
]

MORPHED_SWEAR_PATTERNS = [
    re.compile(r"시[1!i]발", re.IGNORECASE),
    re.compile(r"씨[빠바]"),
    re.compile(r"지[1!i]랄", re.IGNORECASE),
    re.compile(r"ㅂ[rR]보", re.IGNORECASE),
    re.compile(r"[sS]발"),
    re.compile(r"병[시씬]|병1"),
]

DIRECT_SWEAR_PATTERNS = [
    re.compile(r"시발|씨발|씨팔"),
    re.compile(r"개새끼|개세끼|개색"),
    re.compile(r"병신"),
    re.compile(r"지랄"),
    re.compile(r"꺼져|닥쳐|꺼지"),
    re.compile(r"좆"), 
]

# ─── Mockery / Sarcasm Patterns (v2: tightened) ───────────────────

SARCASM_PATTERNS = [
    re.compile(r"와\s*진짜\s*잘.+[~ㅋ]"),
    re.compile(r"대단하시네\s*[ㅋㅎ]"),
    re.compile(r"ㅋ{10,}"),               # v2: raised from 5 to 10
    re.compile(r"실화\?{2,}"),
    re.compile(r"이걸?\s*왜\s*올[리림].*\?"),
    re.compile(r"ㅋㅋ+|ㅎㅎ+|\^\^"),
]

# ─── Consumer Attack Patterns (v2: new) ───────────────────────────

CONSUMER_ATTACK_PATTERNS = [
    re.compile(r"호구"),
    re.compile(r"흑우"),
    re.compile(r"봉이네|봉이다"),
    re.compile(r"호갱"),
]

# ─── Threat Patterns (v2: negative patterns added) ────────────────

THREAT_PATTERNS = [
    re.compile(r"죽어|뒤져|뒤질"),
    re.compile(r"찾아간다|찾아갈"),
    re.compile(r"패[버]린다|패줄까"),
    re.compile(r"패죽"),
    re.compile(r"찢어|불질러"), 
    re.compile(r"신상\s*(까|턴|공개)"),
    re.compile(r"자살\s*(해|하|좀)"),
]

THREAT_NEGATIVE_PATTERNS = [
    re.compile(r"죽어도\s*(안|못|싫)"),     # idiom: "죽어도 안 해"
    re.compile(r"별점\s*테러"),              # review bombing
    re.compile(r"리뷰\s*테러"),
    re.compile(r"테러\s*방지"),
    re.compile(r"테러리스트"),
]

# ─── Personal Attack Patterns ──────────────────────────────────────

PERSONAL_ATTACK_PATTERNS = [
    re.compile(r"못생[겼긴김]"),
    re.compile(r"관종"),
    re.compile(r"찐따"),
    re.compile(r"인성\s*(쓰레기|문제|봐)"),
    re.compile(r"재능\s*(없|이\s*없)"),
    re.compile(r"역겹|토나"), 
    re.compile(r"(너는|너가|쟤는|저새끼|저년|저놈).{0,8}(병신|멍청|한심|쓰레기)")
]

# ─── Belittling Patterns (v2: new) ─────────────────────────────────

BELITTLING_PATTERNS = [
    re.compile(r"한심하[다네]"),
    re.compile(r"멍청"),
    re.compile(r"바보"),
    re.compile(r"무식"),
    re.compile(r"노답"),
    re.compile(r"저능"),
    re.compile(r"무뇌"),
    re.compile(r"또라이"),
    re.compile(r"답답하[다네]"),
]

# ─── Blame Patterns ───────────────────────────────────────────────

BLAME_PATTERNS = [
    re.compile(r".+해서\s*망한"),
    re.compile(r"그러니까\s*.+하지"),
    re.compile(r"이래서\s*(안|못)\s*되는"),
    re.compile(r"구독자가\s*그것밖에"),
    re.compile(r"당연하지\s*뭐"),
]

# ─── Fan War Patterns ──────────────────────────────────────────────

FAN_WAR_PATTERNS = [
    re.compile(r".+팬들?은?\s*다\s*이래"),
    re.compile(r"빠순이"),
    re.compile(r"사생팬|사생"),
    re.compile(r"탈덕"),
    re.compile(r"안티"),
    re.compile(r"조작"),
]

# ─── Hate Speech Patterns (v2: negative patterns added) ───────────

HATE_SPEECH_PATTERNS = [
    re.compile(r"한남|한녀"),
    re.compile(r"김치녀|된장녀"),
    re.compile(r".+충$"),
    re.compile(r"페미|꼴페미"),
    re.compile(r"여자는\s*원래|남자는\s*원래"),
]

HATE_SPEECH_NEGATIVE_PATTERNS = [
    re.compile(r"한남동"),                  # place name
    re.compile(r"한남[자대역교오]"),          # 한남자, 한남대, etc.
    re.compile(r"따뜻한남"),                 # 따뜻한 남자
]

# ─── Political Slur Patterns (v2: new) ────────────────────────────

POLITICAL_SLUR_PATTERNS = [
    re.compile(r"빨갱이"),
    re.compile(r"수꼴"),
    re.compile(r"꼴통"),
    re.compile(r"좌좀|우좀"),
    re.compile(r"국짐"),
    re.compile(r"민주짱"),
    re.compile(r"찍소"),
]

# ─── Discrimination Patterns ──────────────────────────────────────

DISCRIMINATION_PATTERNS = [
    re.compile(r"촌놈"),
    re.compile(r"늙은이"),
    re.compile(r".+학교\s*나온\s*게"),
    re.compile(r"전라도|경상도"),
]

# ─── Generation Hate Patterns (v2: new) ───────────────────────────

GENERATION_HATE_PATTERNS = [
    re.compile(r"꼰대"),
    re.compile(r"틀딱"),
    re.compile(r"잼민이"),
    re.compile(r"급식충"),
    re.compile(r"요즘\s*것들"),
    re.compile(r"노인네"),
]

# ─── Spam Patterns ─────────────────────────────────────────────────

SPAM_PATTERNS = [
    re.compile(r"https?://", re.IGNORECASE),
    re.compile(r"구독.*해\s*주"),
    re.compile(r"홍보|이벤트|당첨|코인|투자|돈벌|www\."),
]

# ─── Rule Definitions ──────────────────────────────────────────────

DETECTION_RULES: list[DetectionRule] = [
    DetectionRule(
        id="PROF_CHOSUNG",
        category="PROFANITY",
        description="Chosung (initial consonant) abbreviation swear words",
        patterns=CHOSUNG_SWEAR_PATTERNS,
        score_modifier=35,
        confidence="high",
    ),
    DetectionRule(
        id="PROF_MORPHED",
        category="PROFANITY",
        description="Morphed/disguised swear words using number/letter substitution",
        patterns=MORPHED_SWEAR_PATTERNS,
        score_modifier=40,
        confidence="high",
    ),
    DetectionRule(
        id="PROF_DIRECT",
        category="PROFANITY",
        description="Direct explicit swear words",
        patterns=DIRECT_SWEAR_PATTERNS,
        score_modifier=50,
        confidence="high",
    ),
    DetectionRule(
        id="MOCK_SARCASM",
        category="MOCKERY",
        description="Sarcastic expressions using positive words with mocking tone markers",
        patterns=SARCASM_PATTERNS,
        score_modifier=30,
        confidence="medium",
    ),
    DetectionRule(
        id="MOCK_CONSUMER",
        category="MOCKERY",
        description="Consumer-targeted mockery (호구, 흑우)",
        patterns=CONSUMER_ATTACK_PATTERNS,
        score_modifier=30,
        confidence="medium",
    ),
    DetectionRule(
        id="THREAT_VIOLENCE",
        category="THREAT",
        description="Direct violence threats or harm wishes",
        patterns=THREAT_PATTERNS,
        negative_patterns=THREAT_NEGATIVE_PATTERNS,
        score_modifier=65,
        confidence="high",
    ),
    DetectionRule(
        id="PA_DIRECT",
        category="PERSONAL_ATTACK",
        description="Direct personal attacks on appearance, ability, or character",
        patterns=PERSONAL_ATTACK_PATTERNS,
        score_modifier=50,
        confidence="high",
    ),
    DetectionRule(
        id="PA_BELITTLE",
        category="PERSONAL_ATTACK",
        description="Belittling/dismissive language (한심, 멍청, 바보, 노답)",
        patterns=BELITTLING_PATTERNS,
        score_modifier=35,
        confidence="medium",
    ),
    DetectionRule(
        id="BLAME_PATTERN",
        category="BLAME",
        description="Baseless criticism, defamation, or content bashing",
        patterns=BLAME_PATTERNS,
        score_modifier=30,
        confidence="medium",
    ),
    DetectionRule(
        id="FW_PATTERN",
        category="FAN_WAR",
        description="Fandom conflict, anti-fan activity, or comparison attacks",
        patterns=FAN_WAR_PATTERNS,
        score_modifier=35,
        confidence="medium",
    ),
    DetectionRule(
        id="HS_GENDER",
        category="HATE_SPEECH",
        description="Gender-based hate speech including Korean-specific slurs",
        patterns=HATE_SPEECH_PATTERNS,
        negative_patterns=HATE_SPEECH_NEGATIVE_PATTERNS,
        score_modifier=55,
        confidence="high",
    ),
    DetectionRule(
        id="HS_POLITICAL",
        category="HATE_SPEECH",
        description="Political slurs and partisan hate speech",
        patterns=POLITICAL_SLUR_PATTERNS,
        score_modifier=45,
        confidence="high",
    ),
    DetectionRule(
        id="DISCRIM_PATTERN",
        category="DISCRIMINATION",
        description="Regional, age, education, or appearance discrimination",
        patterns=DISCRIMINATION_PATTERNS,
        score_modifier=45,
        confidence="medium",
    ),
    DetectionRule(
        id="DISCRIM_GENERATION",
        category="DISCRIMINATION",
        description="Generational hate speech (꼰대, 틀딱, 잼민이)",
        patterns=GENERATION_HATE_PATTERNS,
        score_modifier=40,
        confidence="medium",
    ),
    DetectionRule(
        id="SPAM_LINK",
        category="SPAM",
        description="Spam comments with promotional links or repetitive content",
        patterns=SPAM_PATTERNS,
        score_modifier=20,
        confidence="medium",
    ),
]


# ─── Rule Engine ───────────────────────────────────────────────────

def evaluate_rules(text: str) -> list[RuleMatch]:
    """Run all detection rules against a comment text.
    v2: respects negative_patterns to avoid false positives."""
    results: list[RuleMatch] = []

    for rule in DETECTION_RULES:
        # v2: check negative patterns first
        if rule.negative_patterns:
            is_negative = any(np.search(text) for np in rule.negative_patterns)
            if is_negative:
                continue

        for pattern in rule.patterns:
            match = pattern.search(text)
            if match:
                results.append(
                    RuleMatch(
                        rule_id=rule.id,
                        category=rule.category,
                        description=rule.description,
                        confidence=rule.confidence,
                        score_modifier=rule.score_modifier,
                        matched_pattern=match.group(0),
                    )
                )
                break  # One match per rule is enough

    return results


def analyze_comment(text: str) -> AnalysisResult:
    """Analyze a single comment and return toxicity result.
    v2: applies category relation modifiers for multi-category hits."""
    matches = evaluate_rules(text)

    if not matches:
        return AnalysisResult()

    max_score = max(m.score_modifier for m in matches)
    unique_categories = list(dict.fromkeys(m.category for m in matches))

    # v2: use relation-based modifier
    relation_bonus = get_combined_severity_modifier(unique_categories)
    category_bonus = min((len(unique_categories) - 1) * 5, 15)
    bonus = max(relation_bonus, category_bonus)

    score = min(max_score + bonus, 100)

    return AnalysisResult(
        toxicity_score=score,
        matched_categories=unique_categories,
        matched_patterns=list(dict.fromkeys(m.matched_pattern for m in matches)),
        matched_rules=list(dict.fromkeys(m.rule_id for m in matches)),
        is_toxic=score >= 30,
    )
