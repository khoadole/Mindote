/**
 * IELTS Reading Question Types
 *
 * Comprehensive list of all IELTS Reading question types with
 * descriptions and instructions for both learners and AI generation.
 * Supports 10 languages: EN, VI, ES, FR, DE, IT, PT, JA, KO, ZH
 */

interface QuestionTypeTranslations {
  en: string;
  vi: string;
  es: string;
  fr: string;
  de: string;
  it: string;
  pt: string;
  ja: string;
  ko: string;
  zh: string;
}

interface QuestionType {
  value: string;
  labels: QuestionTypeTranslations;
  descriptions: QuestionTypeTranslations;
  icon: string;
  instructions: string;
  aiPrompt: string;
}

export const IELTS_QUESTION_TYPES: QuestionType[] = [
  {
    value: "multiple-choice",
    labels: {
      en: "Multiple Choice",
      vi: "Trắc nghiệm",
      es: "Opción múltiple",
      fr: "Choix multiple",
      de: "Multiple Choice",
      it: "Scelta multipla",
      pt: "Múltipla escolha",
      ja: "多肢選択",
      ko: "객관식",
      zh: "选择题",
    },
    descriptions: {
      en: "Choose the correct answer from options A, B, C, D",
      vi: "Chọn đáp án đúng từ các phương án A, B, C, D",
      es: "Elige la respuesta correcta entre las opciones A, B, C, D",
      fr: "Choisissez la bonne réponse parmi les options A, B, C, D",
      de: "Wählen Sie die richtige Antwort aus den Optionen A, B, C, D",
      it: "Scegli la risposta corretta tra le opzioni A, B, C, D",
      pt: "Escolha a resposta correta entre as opções A, B, C, D",
      ja: "選択肢A、B、C、Dから正しい答えを選択",
      ko: "A, B, C, D 선택지에서 정답 선택",
      zh: "从选项A、B、C、D中选择正确答案",
    },
    icon: "CheckCircle",
    instructions:
      "Select the best answer for each question based on the passage.",
    aiPrompt:
      "Create multiple choice questions with 4 options (A, B, C, D). Each question should test comprehension of specific details, main ideas, or inferences from the passage.",
  },
  {
    value: "true-false-not-given",
    labels: {
      en: "True/False/Not Given",
      vi: "Đúng/Sai/Không đề cập",
      es: "Verdadero/Falso/No se menciona",
      fr: "Vrai/Faux/Non donné",
      de: "Richtig/Falsch/Nicht angegeben",
      it: "Vero/Falso/Non dato",
      pt: "Verdadeiro/Falso/Não informado",
      ja: "正/誤/記載なし",
      ko: "참/거짓/언급 없음",
      zh: "正确/错误/未提及",
    },
    descriptions: {
      en: "Identify if statements are True, False, or Not Given in the passage",
      vi: "Xác định các câu là Đúng, Sai hoặc Không được đề cập trong bài đọc",
      es: "Identifica si las afirmaciones son Verdaderas, Falsas o No se mencionan",
      fr: "Identifiez si les affirmations sont Vraies, Fausses ou Non données",
      de: "Bestimmen Sie, ob Aussagen Richtig, Falsch oder Nicht angegeben sind",
      it: "Identifica se le affermazioni sono Vere, False o Non date",
      pt: "Identifique se as afirmações são Verdadeiras, Falsas ou Não informadas",
      ja: "記述が正しいか、誤りか、記載がないかを判断",
      ko: "진술이 참인지, 거짓인지, 언급되지 않았는지 판단",
      zh: "判断陈述是正确、错误还是未提及",
    },
    icon: "ClipboardCheck",
    instructions:
      "Determine if the statement matches the information in the passage (True), contradicts it (False), or is not mentioned (Not Given).",
    aiPrompt:
      "Generate statements that test factual accuracy. Include clear True statements (directly stated), False statements (contradicted), and Not Given statements (plausible but not mentioned).",
  },
  {
    value: "yes-no-not-given",
    labels: {
      en: "Yes/No/Not Given",
      vi: "Có/Không/Không đề cập",
      es: "Sí/No/No se menciona",
      fr: "Oui/Non/Non donné",
      de: "Ja/Nein/Nicht angegeben",
      it: "Sì/No/Non dato",
      pt: "Sim/Não/Não informado",
      ja: "はい/いいえ/記載なし",
      ko: "예/아니오/언급 없음",
      zh: "是/否/未提及",
    },
    descriptions: {
      en: "Identify if statements match the writer's views/claims",
      vi: "Xác định câu có phù hợp với quan điểm/khẳng định của tác giả",
      es: "Identifica si las afirmaciones coinciden con las opiniones/afirmaciones del autor",
      fr: "Identifiez si les affirmations correspondent aux opinions/affirmations de l'auteur",
      de: "Bestimmen Sie, ob Aussagen mit den Ansichten/Behauptungen des Autors übereinstimmen",
      it: "Identifica se le affermazioni corrispondono alle opinioni/affermazioni dell'autore",
      pt: "Identifique se as afirmações correspondem às opiniões/afirmações do autor",
      ja: "記述が著者の見解や主張と一致するかを判断",
      ko: "진술이 저자의 견해/주장과 일치하는지 판단",
      zh: "判断陈述是否符合作者的观点/主张",
    },
    icon: "MessageSquare",
    instructions:
      "Determine if the statement matches the writer's opinion (Yes), contradicts it (No), or the opinion is not given (Not Given).",
    aiPrompt:
      "Create opinion-based statements that test understanding of the author's views and claims. Include clear opinions (Yes), contradicting views (No), and unstated opinions (Not Given).",
  },
  {
    value: "matching-headings",
    labels: {
      en: "Matching Headings",
      vi: "Nối tiêu đề đoạn văn",
      es: "Emparejar encabezados",
      fr: "Correspondance des titres",
      de: "Überschriften zuordnen",
      it: "Abbinamento titoli",
      pt: "Correspondência de títulos",
      ja: "見出し選択",
      ko: "제목 연결",
      zh: "段落标题配对",
    },
    descriptions: {
      en: "Match the correct heading to each paragraph",
      vi: "Nối tiêu đề phù hợp với từng đoạn văn",
      es: "Empareja el encabezado correcto con cada párrafo",
      fr: "Faites correspondre le bon titre à chaque paragraphe",
      de: "Ordnen Sie jedem Absatz die richtige Überschrift zu",
      it: "Abbina il titolo corretto a ciascun paragrafo",
      pt: "Combine o título correto com cada parágrafo",
      ja: "各段落に正しい見出しを選択",
      ko: "각 단락에 올바른 제목 연결",
      zh: "为每个段落匹配正确的标题",
    },
    icon: "List",
    instructions:
      "Read each paragraph carefully and select the heading that best summarizes its main idea.",
    aiPrompt:
      "Structure the passage with clear paragraphs, each with a distinct main idea. Provide a list of headings where students match each heading to the correct paragraph. Include extra headings as distractors.",
  },
  {
    value: "matching-information",
    labels: {
      en: "Matching Information",
      vi: "Nối thông tin",
      es: "Emparejar información",
      fr: "Correspondance d'informations",
      de: "Informationen zuordnen",
      it: "Abbinamento informazioni",
      pt: "Correspondência de informações",
      ja: "情報照合",
      ko: "정보 연결",
      zh: "信息配对",
    },
    descriptions: {
      en: "Find which paragraph contains specific information",
      vi: "Tìm đoạn văn chứa thông tin cụ thể",
      es: "Encuentra qué párrafo contiene información específica",
      fr: "Trouvez quel paragraphe contient des informations spécifiques",
      de: "Finden Sie heraus, welcher Absatz bestimmte Informationen enthält",
      it: "Trova quale paragrafo contiene informazioni specifiche",
      pt: "Encontre qual parágrafo contém informações específicas",
      ja: "特定の情報を含む段落を見つける",
      ko: "특정 정보가 포함된 단락 찾기",
      zh: "找出包含特定信息的段落",
    },
    icon: "Search",
    instructions:
      "Locate which paragraph contains the specified piece of information.",
    aiPrompt:
      "Create a passage with multiple paragraphs containing distinct information. Provide statements about specific details, and students identify which paragraph contains each piece of information.",
  },
  {
    value: "matching-features",
    labels: {
      en: "Matching Features",
      vi: "Nối đặc điểm",
      es: "Emparejar características",
      fr: "Correspondance des caractéristiques",
      de: "Merkmale zuordnen",
      it: "Abbinamento caratteristiche",
      pt: "Correspondência de características",
      ja: "特徴照合",
      ko: "특징 연결",
      zh: "特征配对",
    },
    descriptions: {
      en: "Match information with corresponding features (people, places, dates, etc.)",
      vi: "Nối thông tin với đặc điểm tương ứng (người, địa điểm, ngày tháng...)",
      es: "Empareja información con características correspondientes (personas, lugares, fechas, etc.)",
      fr: "Faites correspondre les informations avec les caractéristiques correspondantes (personnes, lieux, dates, etc.)",
      de: "Ordnen Sie Informationen entsprechenden Merkmalen zu (Personen, Orte, Daten usw.)",
      it: "Abbina le informazioni con le caratteristiche corrispondenti (persone, luoghi, date, ecc.)",
      pt: "Combine informações com características correspondentes (pessoas, lugares, datas, etc.)",
      ja: "情報を対応する特徴（人物、場所、日付など）と照合",
      ko: "정보를 해당 특징(사람, 장소, 날짜 등)과 연결",
      zh: "将信息与对应特征（人物、地点、日期等）配对",
    },
    icon: "Link",
    instructions:
      "Match each statement or fact with the correct person, place, date, or other feature mentioned in the passage.",
    aiPrompt:
      "Include multiple people, places, dates, or other features in the passage. Provide statements that students must match to the correct feature. Test understanding of who did what, where events occurred, or when things happened.",
  },
  {
    value: "sentence-completion",
    labels: {
      en: "Sentence Completion",
      vi: "Hoàn thành câu",
      es: "Completar oraciones",
      fr: "Compléter les phrases",
      de: "Sätze vervollständigen",
      it: "Completare le frasi",
      pt: "Completar frases",
      ja: "文章完成",
      ko: "문장 완성",
      zh: "完成句子",
    },
    descriptions: {
      en: "Complete sentences using words from the passage (within word limit)",
      vi: "Hoàn thành câu bằng từ trong bài (giới hạn số từ)",
      es: "Completa las oraciones usando palabras del pasaje (dentro del límite de palabras)",
      fr: "Complétez les phrases en utilisant des mots du passage (dans la limite de mots)",
      de: "Vervollständigen Sie Sätze mit Wörtern aus dem Text (innerhalb der Wortgrenze)",
      it: "Completa le frasi usando parole del brano (entro il limite di parole)",
      pt: "Complete as frases usando palavras do texto (dentro do limite de palavras)",
      ja: "本文の語句を使用して文を完成させる（語数制限内）",
      ko: "지문의 단어를 사용하여 문장 완성(단어 수 제한 내)",
      zh: "使用文章中的词语完成句子（字数限制内）",
    },
    icon: "Edit3",
    instructions:
      "Complete each sentence with NO MORE THAN [X] WORDS from the passage. Use the exact words from the text.",
    aiPrompt:
      "Create incomplete sentences that can be completed with words directly from the passage. Specify a word limit (e.g., NO MORE THAN THREE WORDS). Test ability to locate and extract specific information.",
  },
  {
    value: "summary-completion",
    labels: {
      en: "Summary Completion",
      vi: "Hoàn thành tóm tắt",
      es: "Completar resumen",
      fr: "Compléter le résumé",
      de: "Zusammenfassung vervollständigen",
      it: "Completare il riassunto",
      pt: "Completar resumo",
      ja: "要約完成",
      ko: "요약 완성",
      zh: "完成摘要",
    },
    descriptions: {
      en: "Fill gaps in a summary using words from a list or passage",
      vi: "Điền vào chỗ trống trong bản tóm tắt bằng từ trong danh sách hoặc bài đọc",
      es: "Rellena los espacios en un resumen usando palabras de una lista o pasaje",
      fr: "Remplissez les blancs dans un résumé en utilisant des mots d'une liste ou du passage",
      de: "Füllen Sie Lücken in einer Zusammenfassung mit Wörtern aus einer Liste oder dem Text",
      it: "Riempi gli spazi in un riassunto usando parole da un elenco o dal brano",
      pt: "Preencha as lacunas em um resumo usando palavras de uma lista ou do texto",
      ja: "リストまたは本文の語句を使用して要約の空欄を埋める",
      ko: "목록이나 지문의 단어를 사용하여 요약의 빈칸 채우기",
      zh: "使用列表或文章中的词语填写摘要空白",
    },
    icon: "FileText",
    instructions:
      "Read the summary and fill in the gaps with appropriate words from the list or passage.",
    aiPrompt:
      "Provide a summary of part or all of the passage with gaps. Either give a list of words to choose from, or instruct students to use words from the passage (with a word limit). Test overall comprehension and paraphrasing skills.",
  },
  {
    value: "note-completion",
    labels: {
      en: "Note/Table/Flow-chart Completion",
      vi: "Hoàn thành ghi chú/bảng/lưu đồ",
      es: "Completar notas/tabla/diagrama de flujo",
      fr: "Compléter notes/tableau/organigramme",
      de: "Notizen/Tabelle/Flussdiagramm vervollständigen",
      it: "Completare note/tabella/diagramma di flusso",
      pt: "Completar notas/tabela/fluxograma",
      ja: "メモ/表/フローチャート完成",
      ko: "노트/표/순서도 완성",
      zh: "完成笔记/表格/流程图",
    },
    descriptions: {
      en: "Fill in missing information in notes, tables, or diagrams",
      vi: "Điền thông tin còn thiếu vào ghi chú, bảng hoặc sơ đồ",
      es: "Rellena la información faltante en notas, tablas o diagramas",
      fr: "Remplissez les informations manquantes dans les notes, tableaux ou diagrammes",
      de: "Füllen Sie fehlende Informationen in Notizen, Tabellen oder Diagrammen aus",
      it: "Riempi le informazioni mancanti in note, tabelle o diagrammi",
      pt: "Preencha as informações ausentes em notas, tabelas ou diagramas",
      ja: "メモ、表、図の欠けている情報を埋める",
      ko: "노트, 표 또는 다이어그램의 누락된 정보 채우기",
      zh: "填写笔记、表格或图表中的缺失信息",
    },
    icon: "Table",
    instructions:
      "Complete the notes/table/flow-chart with appropriate words from the passage (within the word limit).",
    aiPrompt:
      "Present information in a structured format (notes, table, or flow-chart) with gaps. Students fill in missing information using words from the passage. Test ability to understand organization and relationships between ideas.",
  },
  {
    value: "short-answer",
    labels: {
      en: "Short Answer Questions",
      vi: "Câu hỏi trả lời ngắn",
      es: "Preguntas de respuesta corta",
      fr: "Questions à réponse courte",
      de: "Kurzantwortfragen",
      it: "Domande a risposta breve",
      pt: "Perguntas de resposta curta",
      ja: "短答式問題",
      ko: "단답형 질문",
      zh: "简答题",
    },
    descriptions: {
      en: "Answer questions with short responses from the passage (word limit)",
      vi: "Trả lời câu hỏi ngắn gọn bằng thông tin trong bài (giới hạn số từ)",
      es: "Responde preguntas con respuestas cortas del pasaje (límite de palabras)",
      fr: "Répondez aux questions avec de courtes réponses du passage (limite de mots)",
      de: "Beantworten Sie Fragen mit kurzen Antworten aus dem Text (Wortgrenze)",
      it: "Rispondi alle domande con risposte brevi dal brano (limite di parole)",
      pt: "Responda às perguntas com respostas curtas do texto (limite de palavras)",
      ja: "本文の情報を使用して質問に短く答える（語数制限）",
      ko: "지문의 정보를 사용하여 질문에 짧게 답하기（단어 수 제한）",
      zh: "使用文章信息简短回答问题（字数限制）",
    },
    icon: "HelpCircle",
    instructions:
      "Answer each question using NO MORE THAN [X] WORDS from the passage.",
    aiPrompt:
      "Create factual questions that can be answered with short responses (typically 1-3 words) taken directly from the passage. Specify a word limit. Test ability to locate and extract specific factual information.",
  },
];

/**
 * Helper function to get question type label by locale
 */
export function getQuestionTypeLabel(
  typeValue: string,
  locale: string = "en",
): string {
  const type = IELTS_QUESTION_TYPES.find((t) => t.value === typeValue);
  if (!type) return typeValue;

  const validLocale = locale as keyof QuestionTypeTranslations;
  return type.labels[validLocale] || type.labels.en;
}

/**
 * Helper function to get question type description by locale
 */
export function getQuestionTypeDescription(
  typeValue: string,
  locale: string = "en",
): string {
  const type = IELTS_QUESTION_TYPES.find((t) => t.value === typeValue);
  if (!type) return "";

  const validLocale = locale as keyof QuestionTypeTranslations;
  return type.descriptions[validLocale] || type.descriptions.en;
}

/**
 * Helper function to get all question type details
 */
export function getQuestionTypeDetails(typeValue: string) {
  return IELTS_QUESTION_TYPES.find((t) => t.value === typeValue);
}
