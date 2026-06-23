import { User } from '../models';

export interface UserDisplay {
  username: string;
  firstName: string;
  lastName: string;
}

/**
 * Resolves usernames to display objects {username, firstName, lastName}.
 * Used to show full names on screens whose records now store only the username.
 */
export async function userMap(usernames: Array<string | undefined | null>): Promise<Map<string, UserDisplay>> {
  const unique = [...new Set(usernames.filter((u): u is string => !!u))];
  const map = new Map<string, UserDisplay>();
  if (!unique.length) return map;
  const users = await User.find({ username: { $in: unique } })
    .select('username firstName lastName')
    .lean();
  for (const u of users) {
    map.set(u.username, { username: u.username, firstName: u.firstName, lastName: u.lastName });
  }
  return map;
}

/** Returns the display object for a username (falls back to just the username). */
export function display(map: Map<string, UserDisplay>, username: string): UserDisplay {
  return map.get(username) || { username, firstName: username, lastName: '' };
}
