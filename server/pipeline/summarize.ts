import type { Observation, MedicationStatement } from '../types.js'

export interface SummaryOutput {
  headline: string
  summary_text: string
  key_points: string[]
  abnormal_findings: Array<{
    test: string
    value: string
    status: string
    what_it_means: string
    common_non_serious_causes: string
    ask_your_doctor: string
  }>
  suggested_questions_for_doctor: string[]
  urgency_note?: string
  disclaimer: string
}

export function generatePlainLanguageSummary(
  docType: string,
  labs: Observation[],
  medicines: MedicationStatement[],
  lang: string = 'en'
): SummaryOutput {
  const language = (lang || 'en').toLowerCase()
  const isCritical = labs.some((l) => l.flag.includes('CRITICAL'))
  const abnormalLabs = labs.filter((l) => l.flag !== 'NORMAL')

  if (language === 'te') {
    return {
      headline: isCritical
        ? 'ముఖ్యమైన గమనిక: కొన్ని పరీక్ష ఫలితాలు సాధారణ పరిధికి భిన్నంగా ఉన్నాయి'
        : 'మీ వైద్య పరీక్షలు మరియు మందుల సారాంశం',
      summary_text: `ఈ పత్రంలో ${labs.length} వైద్య పరీక్షలు మరియు ${medicines.length} ప్రిస్క్రిప్షన్ మందులు నమోదు చేయబడ్డాయి.`,
      key_points: [
        labs.length > 0 ? `${labs.length} ల్యాబ్ పరీక్షలు ప్రామాణికంగా ధృవీకరించబడ్డాయి.` : 'ల్యాబ్ పరిశీలనలు ఏవీ లేవు.',
        abnormalLabs.length > 0
          ? `${abnormalLabs.length} పరీక్ష ఫలితాలు సాధారణ పరిధికి భిన్నంగా గుర్తించబడ్డాయి.`
          : 'అన్ని ల్యాబ్ ఫలితాలు సాధారణ పరిధిలో ఉన్నాయి.',
        medicines.length > 0 ? `${medicines.length} మందులు సూచించబడ్డాయి; సూచించిన సమయాల్లో మాత్రమే తీసుకోండి.` : 'నూతన మందులు ఏవీ సూచించబడలేదు.',
      ],
      abnormal_findings: abnormalLabs.map((l) => ({
        test: l.test_name,
        value: `${l.value_text} ${l.unit || ''}`,
        status: l.flag,
        what_it_means: `${l.test_name} సాధారణ పరిధి (${l.standard_reference_range || 'లక్ష్యం'}) కంటే ${l.flag.includes('HIGH') ? 'ఎక్కువగా' : 'తక్కువగా'} ఉంది.`,
        common_non_serious_causes: 'ఆహారపు అలవాట్లు, శరీరంలో నీటిశాతం లేదా తాత్కాలిక ఒత్తిడి కారణం కావచ్చు.',
        ask_your_doctor: `ఈ రీడింగ్ నా చికిత్స ప్రణాళికను ఎలా ప్రభావితం చేస్తుంది?`,
      })),
      suggested_questions_for_doctor: [
        'ఈ మందులను ఎన్ని రోజుల పాటు వాడాలి?',
        'నేను ఆహారంలో ఏవైనా మార్పులు చేసుకోవాలా?',
        'తదుపరి వైద్య పరీక్ష ఎప్పుడు చేయించుకోవాలి?',
      ],
      urgency_note: isCritical ? 'దయచేసి వీలైనంత త్వరగా మీ వైద్యుడిని సంప్రదించండి.' : undefined,
      disclaimer: 'ఇది కేవలం సమాచార సారాంశం మాత్రమే, వైద్య సలహా కాదు. మందులలో ఎలాంటి మార్పులు చేయవద్దు.',
    }
  }

  if (language === 'hi') {
    return {
      headline: isCritical
        ? 'महत्वपूर्ण सूचना: कुछ परीक्षण परिणाम सामान्य सीमा से बाहर हैं'
        : 'आपकी मेडिकल रिपोर्ट और दवाओं का सरल सारांश',
      summary_text: `इस दस्तावेज़ में ${labs.length} प्रयोगशाला परीक्षण और ${medicines.length} दवाएं दर्ज हैं।`,
      key_points: [
        labs.length > 0 ? `${labs.length} लैब टेस्ट परिणामों का सत्यापन किया गया।` : 'कोई लैब परीक्षण नहीं।',
        abnormalLabs.length > 0
          ? `${abnormalLabs.length} जांच परिणाम सामान्य सीमा से भिन्न पाए गए।`
          : 'सभी जांच परिणाम सामान्य सीमा में हैं।',
        medicines.length > 0 ? `${medicines.length} दवाएं निर्धारित हैं; उन्हें निर्देशानुसार लें।` : 'कोई नई दवा नहीं।',
      ],
      abnormal_findings: abnormalLabs.map((l) => ({
        test: l.test_name,
        value: `${l.value_text} ${l.unit || ''}`,
        status: l.flag,
        what_it_means: `${l.test_name} सामान्य सीमा (${l.standard_reference_range || 'लक्ष्य'}) से ${l.flag.includes('HIGH') ? 'अधिक' : 'कम'} है।`,
        common_non_serious_causes: 'हाल का भोजन, पानी की कमी या तनाव एक सामान्य कारक हो सकता है।',
        ask_your_doctor: `क्या इसके लिए दवा की खुराक में बदलाव की आवश्यकता है?`,
      })),
      suggested_questions_for_doctor: [
        'मुझे यह दवाएं कितने समय तक लेनी हैं?',
        'क्या मुझे कोई विशेष परहेज़ करना चाहिए?',
        'अगला चेकअप कब कराना होगा?',
      ],
      urgency_note: isCritical ? 'कृपया शीघ्र अपने चिकित्सक से परामर्श लें।' : undefined,
      disclaimer: 'यह केवल सूचनात्मक सारांश है, चिकित्सकीय परामर्श नहीं। चिकित्सक से चर्चा करें।',
    }
  }

  // Default English
  return {
    headline: isCritical
      ? 'Clinical Attention Recommended: Key Values Outside Target Range'
      : `Summary of ${docType.replace('_', ' ')} Record`,
    summary_text: `This medical record documents ${labs.length} lab investigation(s) and ${medicines.length} prescribed medication(s).`,
    key_points: [
      labs.length > 0
        ? `${labs.length} diagnostic biomarker(s) mapped against age- and sex-stratified LOINC reference standards.`
        : 'No laboratory biomarkers in this record.',
      abnormalLabs.length > 0
        ? `${abnormalLabs.length} observation(s) flagged outside the normal standard range.`
        : 'All reported lab investigations are within the normal reference target.',
      medicines.length > 0
        ? `${medicines.length} medication(s) prescribed with dosage timing instructions.`
        : 'No ongoing pharmaceutical prescriptions found.',
    ],
    abnormal_findings: abnormalLabs.map((l) => ({
      test: l.test_name,
      value: `${l.value_text} ${l.unit || ''}`,
      status: l.flag,
      what_it_means: `${l.test_name} is measured at ${l.value_text} ${l.unit || ''}, outside normal target (${l.standard_reference_range || 'standard'}).`,
      common_non_serious_causes: 'Hydration levels, fasting duration, recent meals, or temporary stress factors.',
      ask_your_doctor: `Does this reading require an adjustment to my current care plan or repeat testing?`,
    })),
    suggested_questions_for_doctor: [
      'What lifestyle or dietary modifications should I follow for these findings?',
      'Should any of these tests be rechecked in 4 to 8 weeks?',
      'Are there any medication side effects or interactions I should monitor?',
    ],
    urgency_note: isCritical
      ? 'One or more observations are marked critical. Please share this report with your physician promptly.'
      : undefined,
    disclaimer:
      'This summary is generated for health literacy and is not formal medical advice. Never change medications without physician consultation.',
  }
}
