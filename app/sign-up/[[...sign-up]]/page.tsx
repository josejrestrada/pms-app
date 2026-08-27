import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </div>
  );
}
