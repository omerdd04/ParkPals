// Chip-picker option groups for the onboarding questionnaire, modeled after the
// reference designs (categorized, tappable, some with an "add your own" field).

export interface OptionGroup {
  key: string
  title: string
  emoji: string
  options: string[]
}

export const TREAT_GROUPS: OptionGroup[] = [
  { key: 'premium', title: 'חטיפים חזקים', emoji: '🥩', options: ['גבינה צהובה', 'חזה עוף', 'חזה ברווז', 'דג', 'נקניקיה', 'כבד מיובש', 'סטייק'] },
  { key: 'healthy', title: 'בריא', emoji: '🥕', options: ['גזר', 'תפוח', 'בטטה', 'במבה כלבים', 'חמאת בוטנים', 'קרח', 'בננה'] },
  { key: 'store', title: 'חנות', emoji: '🦴', options: ['עצם לעיסה', 'חטיף אילוף', 'ביסקוויט', 'סטיק לעיסה'] },
]

export const TOY_GROUPS: OptionGroup[] = [
  { key: 'noisy', title: 'מרעישים', emoji: '🔊', options: ['צעצוע חורק', 'ברווז מצפצף', 'עצם מצפצפת'] },
  { key: 'balls', title: 'כדורים', emoji: '⚽', options: ['כדור טניס', 'כדורגל', 'כדור גומי', 'כדור זורק'] },
  { key: 'tug', title: 'משיכה ולעיסה', emoji: '🪢', options: ['חבל משיכה', 'מקל', 'קונג', 'בובת בד', 'פריזבי'] },
]

export const FAVORITE_GROUPS: OptionGroup[] = [
  { key: 'activities', title: 'פעילויות', emoji: '🏃', options: ['ריצות מטורפות', 'שחייה', 'חפירה', 'נסיעות ברכב', 'טיולים', 'רדיפה אחרי חתולים', 'התגלגלות בדשא', 'שיזוף'] },
  { key: 'affection', title: 'חיבה', emoji: '❤️', options: ['גירודי בטן', 'גירודי אוזניים', 'חיבוקים', 'לשבת על הברכיים', 'להיות הכפית הקטנה'] },
  { key: 'social', title: 'חברתי', emoji: '🐾', options: ['כלבים גדולים', 'כלבים קטנים', 'לשחק עם גורים', 'לפגוש אנשים חדשים'] },
]

export const TRAIT_GROUPS: OptionGroup[] = [
  { key: 'energy', title: 'אנרגיה ואופי', emoji: '⚡', options: ['היפראקטיבי', 'רגוע וזן', 'אוהב את כולם', 'חכם מדי', 'עצמאי', 'נשמת המסיבה', 'מגונן', 'קנאי לחיות אחרות', 'בררן עם חברים'] },
  { key: 'smarts', title: 'חוכמה ושובבות', emoji: '🧠', options: ['גנב אוכל ערמומי', 'אמן בריחה', 'לומד מהר', 'גאון עקשן', 'מוסח בקלות', 'פותר בעיות', 'שמיעה סלקטיבית'] },
  { key: 'quirks', title: 'קטעים משלו', emoji: '🎭', options: ['דרמה קווין', 'מדבר בחזרה', 'מפחד מדברים אקראיים', 'אובססיה לצעצוע אחד', 'שונא אמבטיות', 'אוהב נסיעות', 'ישן בתנוחות מוזרות'] },
]

// A compact popular-first breed list for the searchable picker.
export const POPULAR_BREEDS = [
  'מעורב', 'לברדור', 'גולדן רטריבר', 'רועה גרמני', 'פרנץ׳ בולדוג', 'פודל',
  'גולדנדודל', 'בולדוג', 'רוטווילר', 'ביגל', 'האסקי', 'קורגי',
]
// Broad breed list. Anyone whose breed is missing can still type it freely in
// the picker (custom entry), so no one gets stuck.
export const ALL_BREEDS = [
  ...POPULAR_BREEDS,
  // Spitz / Asian
  'שיבה אינו', 'אקיטה', 'אקיטה אינו', 'צ׳או צ׳או', 'שאר פיי', 'סמויד',
  'מלמוט', 'פומרניאן', 'ספיץ יפני', 'קיסהונד',
  // Terriers
  'ג׳ק ראסל', 'בול טרייר', 'יורקשייר טרייר', 'סטאפי', 'אמסטאף', 'פיטבול',
  'ווסט הייילנד', 'קרן טרייר', 'סקוטי טרייר', 'איירדייל',
  // Herding
  'בורדר קולי', 'קולי', 'שלטי', 'רועה אוסטרלי', 'רועה אוסטרלי מיני',
  'רועה בלגי', 'מלינואה', 'ולש קורגי',
  // Working / guard
  'דוברמן', 'בוקסר', 'קיין קורסו', 'בול מסטיף', 'מסטיף', 'דוג ארגנטינאי',
  'רועה קווקזי', 'רועה אנטולי', 'סנט ברנרד', 'ברנזמאונטן', 'ניופאונדלנד',
  'גרייט דיין',
  // Retrievers / gundogs / hounds
  'קוקר ספניאל', 'ספרינגר ספניאל', 'ויזלה', 'וויימרנר', 'פוינטר',
  'סטר אירי', 'בסט האונד', 'בלדהאונד', 'גרייהאונד', 'וויפט', 'בורזוי',
  'סאלוקי', "רודזיאני רידג'בק", 'דאשונד (תחש)',
  // Companion / toy
  'צ׳יוואווה', 'פאג', 'שיצו', 'מלטז', 'בישון פריזה', 'האבנזי', 'לאסה אפסו',
  'פקינז', 'פפילון', 'קינג צ׳ארלס', 'קוקרפו', 'מלטיפו', 'לברדודל',
  'שנאוצר', 'פינצ׳ר ננסי', 'פינצ׳ר', 'דלמטי', 'אפגני', 'ברנזאי',
  // Local
  'כלב כנעני',
]
