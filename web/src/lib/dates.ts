const formatter = new Intl.DateTimeFormat('es-CR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatSessionDate(iso: string): string {
  return formatter.format(new Date(iso));
}
