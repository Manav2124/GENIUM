'use client';

import React from 'react';
import { FaGithub, FaGoogle } from "react-icons/fa";
import { signIn } from 'next-auth/react';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
interface Signup1Props {
  heading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  signupText?: string;
  googleText?: string;
  githubText?: string;
  loginText?: string;
  loginUrl?: string;
}

const Signup1 = ({
  heading = "Sign Up",
  logo = {
    url: "#",
    src: "", // Will be replaced by text
    alt: "logo",
    title: "Genium",
  },
  googleText = "Continue with Google",
  githubText = "Continue with GitHub",
  signupText = "Create an account",
  loginText = "Already have an account?",
  loginUrl = "#",
}: Signup1Props) => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-md flex-col items-center gap-y-8 rounded-xl bg-neutral-900 p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-y-2">
          {/* Logo */}
          <div className="flex items-center gap-1 lg:justify-start">
            <a href={logo.url}>
              <p className="text-2xl font-bold text-white">Genium</p>
            </a>
          </div>
          {heading && <h1 className="text-3xl font-semibold text-white">{heading}</h1>}
          <p className="text-muted-foreground text-sm">Create your account</p>
        </div>
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Name"
                required
                className="w-full px-4 py-2 text-white bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-2 text-white bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Input
                type="password"
                placeholder="Password"
                required
                className="w-full px-4 py-2 text-white bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors duration-200">
              {signupText}
            </Button>
            <div className="relative flex items-center justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-neutral-900 px-2">Or continue with</span>
            </div>
            <Button variant="outline" className="w-full bg-neutral-800 text-white border-neutral-700 rounded-lg py-2 hover:bg-neutral-700 transition-colors duration-200" onClick={() => signIn('google')}>
              <FaGoogle className="mr-2 size-5" />
              {googleText}
            </Button>
            <Button variant="outline" className="w-full bg-neutral-800 text-white border-neutral-700 rounded-lg py-2 hover:bg-neutral-700 transition-colors duration-200" onClick={() => signIn('github')}>
              <FaGithub className="mr-2 size-5" />
              {githubText}
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground flex justify-center gap-1 text-sm">
          <p>
            {loginText}{" "}
            <span className="text-blue-500 font-medium hover:underline">
              <a href={loginUrl}>Login</a>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export { Signup1 };