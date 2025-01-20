import { GoogleStrategy } from "remix-auth-google";
import { roles, users, usersToRoles } from "server/db/schema";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";

export let googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/login/google",
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
        console.log(profile);
        console.log("===============");
        try {
            const user = await db.select().from(users).where(eq(users.googleId, profile.id!)).innerJoin(usersToRoles, eq(users.id, usersToRoles.userId)).innerJoin(roles, eq(usersToRoles.roleId, roles.id!));


            console.log(user);
            console.log("----------------");
            if (user == undefined) {
                const newUser = await db.insert(users).values({
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    googleId: profile.id,
                }).returning();
                return newUser;
            } else {
                return user;
            }
        } catch (error) {
            console.error("Error: ", error);
        }
    }
);
