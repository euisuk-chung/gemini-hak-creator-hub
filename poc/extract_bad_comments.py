import re
from typing import Dict, List, Tuple

# 1) 정규화 강화
RE_KEEP = re.compile(r"[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ!?]+")
RE_REPEAT = re.compile(r"(.)\1{2,}")  # ㅋㅋㅋㅋ, ㅠㅠㅠ, ㅎㅎㅎㅎ, ㅅㅂㅂㅂ

CHOSUNG_MAP = {
    r"ㅂ\s*ㅅ": "병신",
    r"ㅅ\s*ㄲ": "새끼",
    r"ㅁ\s*ㅊ": "미친",
    r"ㅈ\s*ㄹ": "지랄",
    r"ㅅ\s*ㅂ": "시발",
}

def normalize_ko(text: str) -> str:
    t = text.strip()
    t = RE_REPEAT.sub(r"\1\1", t)        # 과도 반복 축약
    t = RE_KEEP.sub("", t)              # 특수문자 대부분 제거
    t = t.replace(" ", "")              # 공백 제거

    for pat, repl in CHOSUNG_MAP.items():
        t = re.sub(pat, repl, t)
    return t.lower()

# 2) 카테고리별 regex 룰
RULE_PATTERNS: Dict[str, List[Tuple[str, re.Pattern]]] = {
    "Threat": [
        ("kill_or_harm", re.compile(r"(죽여|죽인다|패버|패죽|찢어|불질러|테러)")),
        ("approach", re.compile(r"(찾아간다|주소알아|기다려|두고봐|가만안둬|조심해)")),
    ],
    "HateSpeech": [
        ("slur_chung", re.compile(r"[가-힣]{1,6}충")),   # OO충
        ("gender_general", re.compile(r"(여자는원래|남자는원래|한남|김치녀|맘충|틀딱)")),
        ("all_group", re.compile(r"([가-힣]{1,6}들은다|[가-힣]{1,6}은다똑같)")),
    ],
    "PersonalInsult": [
        ("direct_insult", re.compile(r"(병신|시발|새끼|좆|멍청|한심|쓰레기|또라이|역겹|토나|찐따)")),
        ("labeling", re.compile(r"(인성|수준|관종|정신병|뇌가없)")),
        ("you_are", re.compile(r"(너는|너가|쟤는|저새끼|저년|저놈).{0,8}(병신|멍청|한심|쓰레기)")),
    ],
    "Sarcasm": [
        ("sarcasm_phrases", re.compile(r"(대단하|참잘|수준이참|고맙다참|역시기대)")),
        ("laughing", re.compile(r"(ㅋㅋ|ㅎㅎ|^^)")),
    ],
    "Overgeneralization": [
        ("always", re.compile(r"(항상|맨날|늘|절대|또시작|또그러네)")),
        ("stereotype", re.compile(r"(역시|원래그렇지)")),
    ],
    "Dismissal": [
        ("minimize", re.compile(r"(별거아니|오바|유난|그게뭔데|신경안써|그만해)")),
    ],
    "Spam": [
        ("ads", re.compile(r"(코인|투자|돈벌|dm|카톡|링크|홍보|구독맞|이벤트)")),
        ("url", re.compile(r"(https?://|www\.)")),
    ],
}

def rule_match(text: str) -> Dict[str, List[str]]:
    """
    returns: {category: [trigger_name, ...]}
    """
    hits: Dict[str, List[str]] = {k: [] for k in RULE_PATTERNS.keys()}
    for cat, patterns in RULE_PATTERNS.items():
        for name, pat in patterns:
            if pat.search(text):
                hits[cat].append(name)
    return hits