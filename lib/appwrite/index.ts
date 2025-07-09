"use server";

import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";
import { cookies } from "next/headers";

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  // const session = (await cookies()).get("appwrite-session")?.value;
  // if (!session) throw new Error("No session");

  const sessionCookie = (await cookies()).get("appwrite-session");
  if (sessionCookie?.value) {
    client.setSession(sessionCookie.value);
  } else {
    console.log("No Session Cookie Found");
  }

  // client.setSession(session);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
};

export const createAdminClient = async () => {
  const client = new Client();

  client
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    client,
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatar() {
      return new Avatars(client);
    },
  };
};
