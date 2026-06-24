//Import the generated Prisma client class 
import {PrismaClient} from "@prisma/client";

//Reuse a single client across hot reloads in development to avoid connection spam 
const globalForPrisma = global as unknown as {prisma?: PrismaClient};

//use the existing client if present, otherwise make a new one 
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

//In development, store the client on the global object so reloads reuse it 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
