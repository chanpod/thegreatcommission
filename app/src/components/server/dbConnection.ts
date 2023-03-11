import { PrismaClient } from "@prisma/client";

const DBN_NAME = "main";
export const prismaClient = new PrismaClient();
