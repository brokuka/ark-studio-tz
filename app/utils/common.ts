export function formatTimeRange(s: string) {
  // Handle both ISO format and simple time format
  if (s.includes('T')) {
    return s.match(/T(\d{2}:\d{2})/g)?.map(t => t.slice(1)).join('-') || ''
  }
  // If it's already in HH:MM-HH:MM format
  return s
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()

  const formatted = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === new Date(today.setDate(today.getDate() + 1)).toDateString()
  const label = isToday ? 'сегодня' : isTomorrow ? 'завтра' : new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date)

  return { formatted, label }
}
