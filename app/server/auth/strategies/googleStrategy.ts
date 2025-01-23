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
        
        try {
            const user = await db.select().from(users).where(eq(users.email, profile.emails[0].value!));

            console.log("Logged In User: ", user);
            
            if (user == undefined || user.length == 0) {
                const newUser = await db.insert(users).values({
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    googleId: profile.id,
                }).returning();
                return newUser[0];
            } else {
                return user[0];
            }
        } catch (error) {
            console.error("Error: ", error);
        }
    }
);
