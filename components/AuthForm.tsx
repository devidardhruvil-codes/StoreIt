"use client";

import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { createAccount } from "@/lib/actions/user.actions";
import OTPModal from "./OTPModal";

type FormType = "sign-up" | "sign-in";

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullName:
      formType == "sign-up" ? z.string().min(2).max(50) : z.string().optional(),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, seterrorMessage] = useState("");
  const [accountId, setaccountId] = useState(null);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    seterrorMessage("");

    try {
      const user = await createAccount({
        fullName: values.fullName || "",
        email: values.email,
      });

      setaccountId(user.accountId);
    } catch (error) {
      seterrorMessage("Failed to create account. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title h1">
            {type == "sign-in" ? "Sign In" : "Sign Up"}
          </h1>
          {type == "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="shad-form-label body-2">
                      Full Name
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        className="shad-input body-2 shad-no-focus"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message body-2" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label body-2">
                    Email
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      className="shad-input body-2 shad-no-focus"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message body-2" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="form-submit-button primary-btn"
            disabled={isLoading}
          >
            {type == "sign-in" ? "Sign In" : "Sign Up"}

            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>

          {errorMessage && (
            <p className="error-message body-2">*{errorMessage}</p>
          )}

          <div className="body-2 flex justify-center">
            <p className="text-gray-700">
              {type == "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type == "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-red-400"
            >
              {type == "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </form>
      </Form>

      {/* OTP Verification */}

      {accountId && (
        <OTPModal email={form.getValues("email")} accountId={accountId} />
      )}
    </>
  );
};

export default AuthForm;
