export function detectSeriesId(setId: string, seriesIds: string[]): string | null {
  const sorted = seriesIds.sort((a, b) => b.length - a.length)

  for (const seriesId of sorted) {
    if (setId.startsWith(seriesId)) {
      return seriesId
    }
  }

  return null
}
