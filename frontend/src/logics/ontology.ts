/**
 * Malicious Comment Ontology v2
 *
 * Hierarchical taxonomy of toxic comment types in Korean internet culture,
 * with special focus on K-POP / entertainment content.
 *
 * Structure:
 *   Domain → Category → SubType → Indicators
 *
 * v2 additions:
 *   - Tag relationships: relatedCategories, escalatesTo, contextModifiers
 *   - New subtypes: BELITTLING, GENERATION_HATE, POLITICAL_SLUR, CONSUMER_ATTACK
 *   - Improved indicators based on 16,000+ real comment analysis
 */

// ─── Domain: Top-level classification ──────────────────────────────
export type ToxicDomain =
  | 'VERBAL_ABUSE'        // Language-based toxicity (profanity, slurs)
  | 'PERSONAL_TARGETING'  // Targeting specific individuals
  | 'GROUP_TARGETING'     // Targeting groups / identities
  | 'BEHAVIORAL'          // Threatening / harmful behavior
  | 'CONTENT_ABUSE';      // Spam, manipulation, off-topic

// ─── Category: 10 core categories ──────────────────────────────────
export type ToxicCategory =
  | 'PROFANITY'
  | 'BLAME'
  | 'MOCKERY'
  | 'PERSONAL_ATTACK'
  | 'HATE_SPEECH'
  | 'THREAT'
  | 'SEXUAL'
  | 'DISCRIMINATION'
  | 'FAN_WAR'
  | 'SPAM';

// ─── SubType: Fine-grained sub-classifications ─────────────────────
export type ToxicSubType =
  // PROFANITY subtypes
  | 'DIRECT_SWEAR'       // 직접 욕설
  | 'CHOSUNG_SWEAR'      // 초성 욕설 (ㅅㅂ, ㅈㄹ)
  | 'MORPHED_SWEAR'      // 변형 욕설 (시1발, ㅂr보)
  | 'SLANG_SWEAR'        // 은어 욕설
  // BLAME subtypes
  | 'BASELESS_CRITICISM'  // 근거 없는 비판
  | 'DEFAMATION'          // 명예훼손성 비방
  | 'CONTENT_BASHING'     // 콘텐츠 폄하
  // MOCKERY subtypes
  | 'SARCASM'             // 비꼬기/반어법
  | 'RIDICULE'            // 직접적 조롱
  | 'CYNICAL_EMOJI'       // 경멸적 이모지 사용
  | 'CONSUMER_ATTACK'     // 소비자 비하 (호구, 흑우)  [v2]
  // PERSONAL_ATTACK subtypes
  | 'APPEARANCE_ATTACK'   // 외모 공격
  | 'ABILITY_ATTACK'      // 능력/재능 비하
  | 'CHARACTER_ATTACK'    // 인격/성격 공격
  | 'PRIVACY_INVASION'    // 사생활 언급
  | 'BELITTLING'          // 비하/폄하 (한심, 멍청, 노답)  [v2]
  // HATE_SPEECH subtypes
  | 'GENDER_HATE'         // 성별 혐오
  | 'RACIAL_HATE'         // 인종/민족 혐오
  | 'SEXUALITY_HATE'      // 성소수자 혐오
  | 'RELIGION_HATE'       // 종교 혐오
  | 'POLITICAL_SLUR'      // 정치 비하 (빨갱이, 수꼴)  [v2]
  // THREAT subtypes
  | 'VIOLENCE_THREAT'     // 폭력 위협
  | 'DOXXING_THREAT'      // 신상 유출 위협
  | 'SELF_HARM_INCITE'    // 자해 유도
  // SEXUAL subtypes
  | 'SEXUAL_OBJECTIFY'    // 성적 대상화
  | 'SEXUAL_HARASS'       // 성희롱
  // DISCRIMINATION subtypes
  | 'REGION_DISCRIM'      // 지역 차별
  | 'AGE_DISCRIM'         // 나이 차별
  | 'EDUCATION_DISCRIM'   // 학력 차별
  | 'APPEARANCE_DISCRIM'  // 외모 차별
  | 'GENERATION_HATE'     // 세대 혐오 (꼰대, 틀딱, 잼민이)  [v2]
  // FAN_WAR subtypes
  | 'FANDOM_VS_FANDOM'   // 팬덤 간 갈등
  | 'ORGANIZED_ANTI'      // 조직적 안티
  | 'COMPARISON_ATTACK'   // 비교를 통한 공격
  | 'DEFECTION_INCITE'    // 탈덕 유도
  // SPAM subtypes
  | 'AD_SPAM'             // 광고 스팸
  | 'REPETITIVE_SPAM'     // 반복 댓글
  | 'CLICKBAIT';          // 낚시성 댓글

// ─── Category Relationship Types ──────────────────────────────────
export type RelationType =
  | 'AMPLIFIES'           // A가 B를 강화 (e.g. PROFANITY + PERSONAL_ATTACK)
  | 'CO_OCCURS'           // 자주 함께 나타남
  | 'ESCALATES_TO'        // A가 심해지면 B로 발전
  | 'MITIGATED_BY';       // B가 있으면 A의 심각도 낮아짐

export interface CategoryRelation {
  from: ToxicCategory;
  to: ToxicCategory;
  type: RelationType;
  severityModifier: number;   // +/- score adjustment when relation is active
  description: string;
}

// ─── Ontology Node (v2) ──────────────────────────────────────────
export interface OntologyNode {
  category: ToxicCategory;
  domain: ToxicDomain;
  subTypes: ToxicSubType[];
  severity: {
    min: number;
    max: number;
  };
  koreanIndicators: string[];
  examples: {
    ko: string;
    en: string;
  }[];
}

// ─── Category Relations Graph ────────────────────────────────────
export const CATEGORY_RELATIONS: CategoryRelation[] = [
  // AMPLIFIES: 조합 시 심각도 증가
  {
    from: 'PROFANITY', to: 'PERSONAL_ATTACK', type: 'AMPLIFIES',
    severityModifier: +15,
    description: '욕설 + 인신공격 = 고의적 악의. 단순 욕설보다 심각',
  },
  {
    from: 'PROFANITY', to: 'THREAT', type: 'AMPLIFIES',
    severityModifier: +20,
    description: '욕설 + 위협 = 실행 의지가 높은 위협으로 판단',
  },
  {
    from: 'MOCKERY', to: 'PERSONAL_ATTACK', type: 'AMPLIFIES',
    severityModifier: +10,
    description: '조롱 + 인신공격 = 수치심 유발 의도',
  },
  {
    from: 'HATE_SPEECH', to: 'DISCRIMINATION', type: 'AMPLIFIES',
    severityModifier: +15,
    description: '혐오발언 + 차별 = 집단 타겟팅 고의성',
  },

  // CO_OCCURS: 자주 함께 나타남
  {
    from: 'MOCKERY', to: 'BLAME', type: 'CO_OCCURS',
    severityModifier: +5,
    description: '조롱과 비난은 자주 함께 출현 (비꼬며 깎아내리기)',
  },
  {
    from: 'PERSONAL_ATTACK', to: 'HATE_SPEECH', type: 'CO_OCCURS',
    severityModifier: +10,
    description: '인신공격이 특정 집단 혐오와 결합',
  },
  {
    from: 'FAN_WAR', to: 'MOCKERY', type: 'CO_OCCURS',
    severityModifier: +5,
    description: '팬덤 갈등에서 조롱이 함께 나타남',
  },
  {
    from: 'FAN_WAR', to: 'PERSONAL_ATTACK', type: 'CO_OCCURS',
    severityModifier: +10,
    description: '팬덤 전쟁이 아이돌 인신공격으로 확장',
  },

  // ESCALATES_TO: 문맥상 발전 경로
  {
    from: 'MOCKERY', to: 'PERSONAL_ATTACK', type: 'ESCALATES_TO',
    severityModifier: +10,
    description: '조롱이 반복되면 직접적 인신공격으로 발전',
  },
  {
    from: 'BLAME', to: 'THREAT', type: 'ESCALATES_TO',
    severityModifier: +15,
    description: '비난이 격해지면 위협으로 발전',
  },
  {
    from: 'DISCRIMINATION', to: 'HATE_SPEECH', type: 'ESCALATES_TO',
    severityModifier: +10,
    description: '차별적 발언이 노골적 혐오로 발전',
  },
  {
    from: 'FAN_WAR', to: 'THREAT', type: 'ESCALATES_TO',
    severityModifier: +20,
    description: '팬덤 갈등이 신상 유출/위협으로 발전',
  },
];

// ─── Full Ontology Definition ──────────────────────────────────────
export const TOXICITY_ONTOLOGY: OntologyNode[] = [
  {
    category: 'PROFANITY',
    domain: 'VERBAL_ABUSE',
    subTypes: ['DIRECT_SWEAR', 'CHOSUNG_SWEAR', 'MORPHED_SWEAR', 'SLANG_SWEAR'],
    severity: { min: 20, max: 70 },
    koreanIndicators: [
      'ㅅㅂ', 'ㅆㅂ', 'ㅈㄹ', 'ㄱㅅㄲ', 'ㅂㅅ', 'ㄲㅈ', 'ㅁㅊ',
      '시1발', '씨빠', '지1랄', 'ㅂr보', 's발',
      'ㄹㅇ ㅂㅅ', 'ㅈ같은',
    ],
    examples: [
      { ko: 'ㅅㅂ 이게 뭐야', en: 'WTF is this (using chosung abbreviation)' },
      { ko: '진짜 ㅈ같네', en: 'This is really f***ed up (slang swear)' },
    ],
  },
  {
    category: 'BLAME',
    domain: 'PERSONAL_TARGETING',
    subTypes: ['BASELESS_CRITICISM', 'DEFAMATION', 'CONTENT_BASHING'],
    severity: { min: 20, max: 65 },
    koreanIndicators: [
      '~해서 망한 거야', '그러니까 ~하지', '역시 ~다운', '당연하지 뭐',
      '이래서 안 되는 거야', '구독자가 그것밖에',
    ],
    examples: [
      { ko: '이래서 망한 거지', en: "That's why you failed" },
      { ko: '구독자가 그것밖에 안 되는 이유가 있네', en: 'There is a reason your subscriber count is so low' },
    ],
  },
  {
    category: 'MOCKERY',
    domain: 'PERSONAL_TARGETING',
    subTypes: ['SARCASM', 'RIDICULE', 'CYNICAL_EMOJI', 'CONSUMER_ATTACK'],
    severity: { min: 20, max: 65 },
    koreanIndicators: [
      '와 진짜 잘하신다~', '대단하시네 ㅋㅋ',
      '실화???', '🤡', '🤮', '이걸 왜 올림??',
      '호구', '흑우', '봉이네',
    ],
    examples: [
      { ko: '와 진짜 잘하신다~ ㅋㅋㅋ', en: 'Wow you are so talented~ lol (sarcastic)' },
      { ko: '이게 실력이라고? ㅋㅋㅋㅋㅋ', en: 'You call this skill? lololol (mocking)' },
      { ko: '이 가격에 사는 사람은 호구지', en: 'Anyone buying at this price is a sucker' },
    ],
  },
  {
    category: 'PERSONAL_ATTACK',
    domain: 'PERSONAL_TARGETING',
    subTypes: ['APPEARANCE_ATTACK', 'ABILITY_ATTACK', 'CHARACTER_ATTACK', 'PRIVACY_INVASION', 'BELITTLING'],
    severity: { min: 40, max: 90 },
    koreanIndicators: [
      '못생겼다', '관종', '찐따', '~꼴', '~대가리',
      '재능 없다', '인성 쓰레기', '~꼴통',
      '한심', '멍청', '바보', '무식', '노답', '저능',
    ],
    examples: [
      { ko: '성형 좀 해라 못생긴게', en: 'Get plastic surgery, you ugly person' },
      { ko: '관종이네 ㄹㅇ', en: 'Such an attention seeker for real' },
      { ko: '진짜 한심하다', en: 'So pathetic (belittling)' },
    ],
  },
  {
    category: 'HATE_SPEECH',
    domain: 'GROUP_TARGETING',
    subTypes: ['GENDER_HATE', 'RACIAL_HATE', 'SEXUALITY_HATE', 'RELIGION_HATE', 'POLITICAL_SLUR'],
    severity: { min: 40, max: 95 },
    koreanIndicators: [
      '~충', '~놈들', '~년들', '한남', '한녀', '김치녀', '된장녀',
      '빨갱이', '수꼴', '꼴통', '좌좀', '우좀',
    ],
    examples: [
      { ko: '이래서 ~충이라고 하는 거야', en: 'This is why [group] are called [slur]' },
      { ko: '빨갱이들이 나라를 망친다', en: 'The commies are ruining the country (political slur)' },
    ],
  },
  {
    category: 'THREAT',
    domain: 'BEHAVIORAL',
    subTypes: ['VIOLENCE_THREAT', 'DOXXING_THREAT', 'SELF_HARM_INCITE'],
    severity: { min: 50, max: 100 },
    koreanIndicators: [
      '죽어', '뒤질', '찾아간다', '패버린다',
      '신상 턴다', '자살해',
    ],
    examples: [
      { ko: '찾아가서 패버린다', en: 'I will find you and beat you up' },
      { ko: '신상 까발려야겠다', en: 'I should doxx your personal info' },
    ],
  },
  {
    category: 'SEXUAL',
    domain: 'BEHAVIORAL',
    subTypes: ['SEXUAL_OBJECTIFY', 'SEXUAL_HARASS'],
    severity: { min: 35, max: 90 },
    koreanIndicators: [],
    examples: [
      { ko: '(성적 대상화 표현)', en: '(sexual objectification expression)' },
    ],
  },
  {
    category: 'DISCRIMINATION',
    domain: 'GROUP_TARGETING',
    subTypes: ['REGION_DISCRIM', 'AGE_DISCRIM', 'EDUCATION_DISCRIM', 'APPEARANCE_DISCRIM', 'GENERATION_HATE'],
    severity: { min: 25, max: 75 },
    koreanIndicators: [
      '촌놈', '늙은이', '~학교 나온 게 티난다', '전라도', '경상도',
      '꼰대', '틀딱', '잼민이', '급식충',
    ],
    examples: [
      { ko: '촌놈이 뭘 알아', en: 'What would a country bumpkin know' },
      { ko: '나이가 몇인데 아직도', en: "How old are you and you're still..." },
      { ko: '틀딱들은 답이 없다', en: 'Boomers are hopeless (generational hate)' },
    ],
  },
  {
    category: 'FAN_WAR',
    domain: 'GROUP_TARGETING',
    subTypes: ['FANDOM_VS_FANDOM', 'ORGANIZED_ANTI', 'COMPARISON_ATTACK', 'DEFECTION_INCITE'],
    severity: { min: 20, max: 75 },
    koreanIndicators: [
      '~팬들은 다 이래', '우리 애들이 훨씬', '조작', '빠순이', '사생팬',
      '이런 애를 왜 좋아함', '탈덕',
    ],
    examples: [
      { ko: 'XX팬들은 다 이래서 ㅋㅋ', en: 'XX fans are always like this lol' },
      { ko: '이런 애를 왜 좋아하는지 이해불가', en: "Can't understand why anyone likes this person" },
    ],
  },
  {
    category: 'SPAM',
    domain: 'CONTENT_ABUSE',
    subTypes: ['AD_SPAM', 'REPETITIVE_SPAM', 'CLICKBAIT'],
    severity: { min: 10, max: 40 },
    koreanIndicators: [
      '구독', '링크', '클릭', '홍보', '이벤트',
    ],
    examples: [
      { ko: '제 채널도 구독해주세요~', en: 'Please subscribe to my channel too~' },
    ],
  },
];

// ─── Helper: Get ontology node by category ─────────────────────────
export function getOntologyNode(category: ToxicCategory): OntologyNode | undefined {
  return TOXICITY_ONTOLOGY.find((n) => n.category === category);
}

// ─── Helper: Get all categories in a domain ────────────────────────
export function getCategoriesByDomain(domain: ToxicDomain): OntologyNode[] {
  return TOXICITY_ONTOLOGY.filter((n) => n.domain === domain);
}

// ─── Helper: Get relations for a category ──────────────────────────
export function getRelationsFor(category: ToxicCategory): CategoryRelation[] {
  return CATEGORY_RELATIONS.filter(
    (r) => r.from === category || r.to === category,
  );
}

// ─── Helper: Calculate combined severity modifier ──────────────────
export function getCombinedSeverityModifier(categories: ToxicCategory[]): number {
  if (categories.length < 2) return 0;

  let modifier = 0;
  for (const relation of CATEGORY_RELATIONS) {
    if (categories.includes(relation.from) && categories.includes(relation.to)) {
      modifier += relation.severityModifier;
    }
  }
  return modifier;
}
