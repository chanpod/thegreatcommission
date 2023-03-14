import { User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "../session.server";
import { googleStrategy } from "./googleStrategy";


export let authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(googleStrategy);
