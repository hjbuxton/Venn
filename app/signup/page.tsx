"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  function buildEmailRedirectTo() {
    return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
      redirect || "/dashboard"
    )}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: buildEmailRedirectTo(),
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setEmailTaken(true);
      return;
    }

    if (data.session) {
      router.push(redirect || "/dashboard");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    setResendError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: buildEmailRedirectTo() },
    });

    setResending(false);

    if (error) {
      setResendError(error.message);
    } else {
      setResendMessage("Email resent — check your inbox.");
    }
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your inbox">
        <div className="text-center">
          <p className="text-sm text-ink-2 leading-relaxed">
            We&apos;ve sent a verification email to{" "}
            <strong className="font-semibold text-ink">{email}</strong>. Click the
            link in the email to verify your account and get started.
          </p>

          <Button
            type="button"
            variant="secondary"
            className="w-full mt-6"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Resending..." : "Resend email"}
          </Button>

          {resendMessage && <p className="mt-3 text-sm text-brand">{resendMessage}</p>}
          {resendError && <p className="mt-3 text-sm text-red-600">{resendError}</p>}

          <p className="mt-6 text-xs text-ink-3">
            Can&apos;t find it? Check your spam folder.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Plan your next group trip without the awkward conversations."
      footer={
        <>
          Already have an account?{" "}
          <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="font-semibold text-brand">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Smith"
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {emailTaken && (
          <p className="text-sm text-red-600">
            That email is already registered.{" "}
            <Link
              href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
              className="font-semibold underline"
            >
              Try logging in instead.
            </Link>
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
