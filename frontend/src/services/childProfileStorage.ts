const CHILD_ID_KEY = "childId";

export function setChildId(childId: string): void {
  localStorage.setItem(CHILD_ID_KEY, childId);
}

export function getChildId(): string | null {
  return localStorage.getItem(CHILD_ID_KEY);
}

export function clearChildId(): void {
  localStorage.removeItem(CHILD_ID_KEY);
}

export function hasChildProfile(): boolean {
  return Boolean(getChildId());
}
