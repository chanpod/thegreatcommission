import { PrismaClient } from "@prisma/client";

let prismaClient: PrismaClient;

declare global {
  var __prismaClient: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the prismaClient with every change either.
if (process.env.NODE_ENV === "production") {
  prismaClient = new PrismaClient();
} else {
  if (!global.__prismaClient) {
    global.__prismaClient = new PrismaClient();
  }
  prismaClient = global.__prismaClient;
}

export { prismaClient }; 