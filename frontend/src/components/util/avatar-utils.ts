/**
 * Gets the initials from a name or email
 * @param name Name or email to get initials from
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  // If it's an email, use the first character
  if (name.includes('@')) {
    return name.charAt(0).toUpperCase();
  }

  // Otherwise, get initials from name parts
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
