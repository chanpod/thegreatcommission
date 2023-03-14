import { GoogleStrategy } from "remix-auth-google";
import { prismaClient } from "~/server/dbConnection";

export let googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/login/google",
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
        console.log(profile);
        console.log("===============");
        try {
            const user = await prismaClient.user.findUnique({
                where: {
                    googleId: profile.id,
                },
            });

            console.log(user);
            console.log("----------------");
            if (user == undefined) {
                const newUser = await prismaClient.user.create({
                    data: {
                        email: profile.emails[0].value,
                        firstName: profile.name.givenName,
                        googleId: profile.id,
                    },
                });
                return newUser;
            } else {
                return user;
            }
        } catch (error) {
            console.error("Error: ", error);
        }
    }
);
