import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import type { RegisterPayload, RegisterResponse } from "@/types/auth";
import { http } from "./http";
import { failWithToast } from "./toast";

/** Create an account, then sign the user in. Used by the signup page. */
export async function registerAndSignIn(payload: RegisterPayload, callbackUrl = "/portal") {
  try {
    const created = await http.post<RegisterResponse>("/api/auth/register", payload);

    const result = await nextAuthSignIn("credentials", {
      email:    payload.email,
      password: payload.password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error("Account created — please sign in manually.");
    }

    return { user: created, callbackUrl };
  } catch (err) {
    failWithToast(err, "Could not create your account");
  }
}

/** Sign in with email + password. Returns the next URL or throws. */
export async function signInWithCredentials(
  email: string,
  password: string,
  callbackUrl = "/portal",
) {
  try {
    const result = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error("Invalid email or password.");
    }
    return callbackUrl;
  } catch (err) {
    failWithToast(err, "Sign-in failed");
  }
}

/** Sign out and redirect to /auth/login. */
export async function signOut() {
  try {
    await nextAuthSignOut({ callbackUrl: "/auth/login" });
  } catch (err) {
    failWithToast(err, "Sign-out failed");
  }
}
