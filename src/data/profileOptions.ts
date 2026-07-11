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
  { key: 'activities', title: 'פעילויות', emoji: '🏃', options: ['ריצות מטורפות', 'הבאה', 'שחייה', 'חפירה', 'נסיעות ברכב', 'טיולים', 'רדיפה אחרי סנאים', 'התגלגלות בדשא', 'שיזוף'] },
  { key: 'affection', title: 'חיבה', emoji: '❤️', options: ['גירודי בטן', 'גירודי אוזניים', 'חיבוקים', 'לשבת על הברכיים', 'להיות הכפית הקטנה'] },
  { key: 'social', title: 'חברתי', emoji: '🐾', options: ['כלבים גדולים', 'כלבים קטנים', 'לשחק עם גורים', 'לפגוש אנשים חדשים'] },
]

export const TRAIT_GROUPS: OptionGroup[] = [
  { key: 'energy', title: 'אנרגיה ואופי', emoji: '⚡', options: ['היפראקטיבי', 'רגוע וזן', 'אוהב את כולם', 'חכם מדי', 'עצמאי', 'נשמת המסיבה', 'מגונן', 'קנאי לחיות אחרות', 'בררן עם חברים'] },
  { key: 'smarts', title: 'חוכמה ושובבות', emoji: '🧠', options: ['גנב אוכל ערמומי', 'אמן בריחה', 'לומד מהר', 'גאון עקשן', 'מוסח בקלות', 'פותר בעיות', 'שמיעה סלקטיבית'] },
  { key: 'quirks', title: 'קטעים משלו', emoji: '🎭', options: ['דרמה קווין', 'מדבר בחזרה', 'מפחד מדברים אקראיים', 'אובססיה לצעצוע אחד', 'שונא אמבטיות', 'אוהב נסיעות', 'ישן בתנוחות מוזרות', 'חושב שהוא כלב-חיק'] },
]

// A compact popular-first breed list for the searchable picker.
export const POPULAR_BREEDS = [
  'מעורב', 'לברדור', 'גולדן רטריבר', 'רועה גרמני', 'פרנץ׳ בולדוג', 'פודל',
  'גולדנדודל', 'בולדוג', 'רוטווילר', 'ביגל', 'האסקי', 'קורגי',
]
export const ALL_BREEDS = [
  ...POPULAR_BREEDS,
  'אפגני', 'אקיטה', 'מלמוט', 'בול טרייר', 'בוקסר', 'צ׳יוואווה', 'צ׳או צ׳או',
  'דוברמן', 'דלמטי', 'קוקר ספניאל', 'דאשונד (תחש)', 'גרייהאונד', 'ג׳ק ראסל',
  'מלטז', 'פאג', 'פפילון', 'פינצ׳ר', 'שיצו', 'ספרינגר ספניאל', 'ויזלה',
  'וויפט', 'כלב כנעני', 'פומרניאן', 'שנאוצר', 'סמויד', 'ברנזאי',
]
