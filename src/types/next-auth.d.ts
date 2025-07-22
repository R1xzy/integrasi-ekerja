import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      roleId: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    roleId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    roleId: number;
  }
}
