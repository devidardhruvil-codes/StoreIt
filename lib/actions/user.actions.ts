"use server";

import { Account, ID, Query, Users } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );
  return result.total > 0 ? result.documents[0] : null;
};

//Error handler
const handleError = (error: unknown, message: string) => {
  throw error;
};

// Check if user exists in Appwrite Users service and send OTP
export const sendEmailOTP = async ({ email }: { email: string }) => {
  const adminClient = await createAdminClient();
  const { account } = adminClient;
  const users = new Users(adminClient.client); // Initialize Users service
  try {
    // Check if user exists by listing users with the email
    const existingUsers = await users.list([Query.equal("email", [email])]);
    let userId: string;

    if (existingUsers.total > 0) {
      // User exists, use their ID
      userId = existingUsers.users[0].$id;
    } else {
      // Create new user
      const tempPassword = "TempPass123!";
      const user = await account.create(ID.unique(), email, tempPassword);
      userId = user.$id;
    }

    // Send OTP
    await account.createEmailToken(userId, email);
    return userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
    return null;
  }
};

//Create account and send OTP.
export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const adminClient = await createAdminClient();
  const { databases } = adminClient;
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send email OTP");

  // Check if user exists in database
  const existingUser = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );

  if (existingUser.total === 0) {
    // Create new document
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://cdn1.iconfinder.com/data/icons/user-pictures/100/male3-512.png",
        accountId,
      }
    );
  } else {
    // Update existing document if accountId differs
    const userDoc = existingUser.documents[0];
    if (userDoc.accountId !== accountId) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        userDoc.$id,
        { accountId }
      );
    }
  }

  return parseStringify({ accountId });
};

//Verify OTP and create session.
export const verifySecret = async ({
  accountId,
  password, //This should be the OTP
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    //Create session with OTP
    const session = await account.createSession(accountId, password);
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
    return null;
  }
};

//Get Current User
export const getCurrentUser = async () => {
  try {
    const { databases, account } = await createSessionClient();
    const sessionCookie = (await cookies()).get("appwrite-session")?.value;
    const result = await account.get();
    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", result.$id)]
    );
    return user.total > 0 ? parseStringify(user.documents[0]) : null;
  } catch (error) {
    console.error("GetCurrentUser Error:", error);
    return null; // Return null instead of throwing, let caller handle
  }
};

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};
