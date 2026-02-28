"""
Korean Profanity & Toxicity Pattern Detection

Ported from frontend/src/logics/rules.ts and ontology.ts.
Detects toxic patterns in Korean YouTube comments using regex-based rules.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ─── Types ─────────────────────────────────────────────────────────

ToxicCategory = str  # One of the 10 categories below

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


# ─── Korean Profanity Patterns ─────────────────────────────────────

CHOSUNG_SWEAR_PATTERNS = [
    re.compile(r"[ㅅㅆ][ㅂ]"),          # ㅅㅂ, ㅆㅂ
    re.compile(r"ㅈㄹ"),                 # ㅈㄹ
    re.compile(r"ㄱㅅㄲ"),               # ㄱㅅㄲ
    re.compile(r"[ㅂ][ㅅ]"),             # ㅂㅅ
    re.compile(r"ㅁㅊ"),                 # ㅁㅊ
    re.compile(r"ㄲㅈ"),                 # ㄲㅈ
    re.compile(r"ㅈㄴ"),                 # ㅈㄴ
]

MORPHED_SWEAR_PATTERNS = [
    re.compile(r"시[1!i]발", re.IGNORECASE),    # 시1발, 시!발, 시i발
    re.compile(r"씨[빠바]"),                      # 씨빠, 씨바
    re.compile(r"지[1!i]랄", re.IGNORECASE),     # 지1랄
    re.compile(r"ㅂ[rR]보", re.IGNORECASE),      # ㅂr보
    re.compile(r"[sS]발"),                        # s발
    re.compile(r"병[시씬]|병1"),                   # 병시, 병씬, 병1
]

DIRECT_SWEAR_PATTERNS = [
    re.compile(r"시발|씨발|씨팔"),
    re.compile(r"개새끼|개세끼|개색"),
    re.compile(r"병신"),
    re.compile(r"지랄"),
    re.compile(r"꺼져|닥쳐|꺼지"),
]

# ─── Mockery / Sarcasm Patterns ────────────────────────────────────

SARCASM_PATTERNS = [
    re.compile(r"와\s*진짜\s*잘.+[~ㅋ]"),       # "와 진짜 잘하신다~ / ㅋ"
    re.compile(r"대단하시네\s*[ㅋㅎ]"),           # "대단하시네 ㅋ"
    re.compile(r"ㅋ{5,}"),                        # excessive ㅋㅋㅋㅋㅋ (5+)
    re.compile(r"실화\?{2,}"),                    # "실화??"
    re.compile(r"이걸?\s*왜\s*올[리림].*\?"),     # "이걸 왜 올림?"
]

# ─── Threat Patterns ───────────────────────────────────────────────

THREAT_PATTERNS = [
    re.compile(r"죽어|뒤져|뒤질"),
    re.compile(r"찾아간다|찾아갈"),
    re.compile(r"패[버]린다|패줄까"),
    re.compile(r"신상\s*(까|턴|공개)"),
    re.compile(r"테러"),
    re.compile(r"자살\s*(해|하|좀)"),
]

# ─── Personal Attack Patterns ──────────────────────────────────────

PERSONAL_ATTACK_PATTERNS = [
    re.compile(r"못생[겼긴김]"),
    re.compile(r"관종"),
    re.compile(r"찐따"),
    re.compile(r"인성\s*(쓰레기|문제|봐)"),
    re.compile(r"재능\s*(없|이\s*없)"),
    re.compile(r"그만\s*(둬|해|하)"),
]

# ─── Blame Patterns ───────────────────────────────────────────────

BLAME_PATTERNS = [
    re.compile(r".+해서\s*망한"),                  # ~해서 망한 거야
    re.compile(r"그러니까\s*.+하지"),               # 그러니까 ~하지
    re.compile(r"이래서\s*(안|못)\s*되는"),          # 이래서 안 되는 거야
    re.compile(r"구독자가\s*그것밖에"),              # 구독자가 그것밖에
    re.compile(r"당연하지\s*뭐"),                   # 당연하지 뭐
]

# ─── Fan War Patterns ──────────────────────────────────────────────

FAN_WAR_PATTERNS = [
    re.compile(r".+팬들?은?\s*다\s*이래"),          # "XX팬들은 다 이래"
    re.compile(r"빠순이"),
    re.compile(r"사생팬|사생"),
    re.compile(r"탈덕"),
    re.compile(r"안티"),
    re.compile(r"조작"),
]

# ─── Hate Speech Patterns ─────────────────────────────────────────

HATE_SPEECH_PATTERNS = [
    re.compile(r"한남|한녀"),
    re.compile(r"김치녀|된장녀"),
    re.compile(r".+충$"),                          # ~충
    re.compile(r"페미|꼴페미"),
]

# ─── Discrimination Patterns ──────────────────────────────────────

DISCRIMINATION_PATTERNS = [
    re.compile(r"촌놈"),
    re.compile(r"늙은이"),
    re.compile(r".+학교\s*나온\s*게"),              # ~학교 나온 게 티난다
    re.compile(r"전라도|경상도"),
]

# ─── Spam Patterns ─────────────────────────────────────────────────

SPAM_PATTERNS = [
    re.compile(r"https?://", re.IGNORECASE),       # URLs
    re.compile(r"구독.*해\s*주"),                    # "구독해주세요"
    re.compile(r"홍보|이벤트|당첨"),
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
        id="THREAT_VIOLENCE",
        category="THREAT",
        description="Direct violence threats or harm wishes",
        patterns=THREAT_PATTERNS,
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
        score_modifier=55,
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
    """Run all detection rules against a comment text."""
    results: list[RuleMatch] = []

    for rule in DETECTION_RULES:
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
    """Analyze a single comment and return toxicity result."""
    matches = evaluate_rules(text)

    if not matches:
        return AnalysisResult()

    max_score = max(m.score_modifier for m in matches)
    unique_categories = list(dict.fromkeys(m.category for m in matches))
    bonus = min((len(unique_categories) - 1) * 5, 15)
    score = min(max_score + bonus, 100)

    return AnalysisResult(
        toxicity_score=score,
        matched_categories=unique_categories,
        matched_patterns=list(dict.fromkeys(m.matched_pattern for m in matches)),
        matched_rules=list(dict.fromkeys(m.rule_id for m in matches)),
        is_toxic=score >= 30,
    )
