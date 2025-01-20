
import { Authenticator } from "remix-auth";
import { sessionStorage } from "../session.server";
import { googleStrategy } from "./googleStrategy";
import type { users } from "server/db/schema";


export let authenticator = new Authenticator<typeof users>(sessionStorage);
authenticator.use(googleStrategy);
