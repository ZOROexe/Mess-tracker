import { getServerSession } from "next-auth";
import { authConfig } from "./auth-config";

export async function auth() {
  return getServerSession(authConfig);
}