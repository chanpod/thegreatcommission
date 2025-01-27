import { createContext } from "react";
import type { users, roles } from "server/db/schema";

export interface IUserContext {
  user: typeof users.$inferSelect | undefined;
  roles: typeof roles.$inferSelect | undefined;
}

export const UserContext = createContext<IUserContext>({ user: undefined, roles: undefined });
export const UserProvider = ({ children, user, roles }: { children: React.ReactNode, user: typeof users.$inferSelect, roles: typeof roles.$inferSelect }) => {

  return <UserContext value={{ user: user, roles: roles }}>{children}</UserContext>;
};
