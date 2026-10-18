export function at<T>(items: T[], index: number): T {
  const item = items[index]

  if (item === undefined) {
    throw new Error(`Expected an element at index ${index}, received ${items.length} elements`)
  }

  return item
}

export function sorted<T>(values: T[]) {
  return [...values].sort()
}
