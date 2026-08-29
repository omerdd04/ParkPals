// Rotating one-tap questions about a park's condition. After every 3rd visit
// to the same park the user is asked ONE of these (cycling), so it never
// feels heavy. The full survey sheet shows all of them at once.
export interface ParkQuestion {
  key: string
  text: string
  emoji: string
}

export const PARK_QUESTIONS: ParkQuestion[] = [
  { key: 'maintained', text: 'הפארק מתוחזק היטב?', emoji: '🛠️' },
  { key: 'water_ok', text: 'הברזייה תקינה ויש מים?', emoji: '💧' },
  { key: 'clean', text: 'הפארק נקי ומסודר?', emoji: '🧹' },
  { key: 'lighting', text: 'התאורה טובה בשעות החושך?', emoji: '💡' },
  { key: 'shade', text: 'יש מספיק צל?', emoji: '🌳' },
  { key: 'safe', text: 'מרגישים בטוחים בפארק?', emoji: '🛟' },
]
