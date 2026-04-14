export function toDateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}

export function toDateKey(date: Date) {
  return date.toLocaleDateString("en-CA");
}
