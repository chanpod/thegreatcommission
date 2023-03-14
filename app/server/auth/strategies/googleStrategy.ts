import { GoogleStrategy } from "remix-auth-google";
import { prismaClient } from "~/server/dbConnection";

export let googleStrategy = new GoogleStrategy(
    {
        clientID: "1034070132753-gv1tbh0sop6rr0sqlst0e6rcp8ajdv0n.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "http://localhost:3000/login/google",
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
            }
        } catch (error) {
            console.error("Error: ", error);
        }
    }
);
