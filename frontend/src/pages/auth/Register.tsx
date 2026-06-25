import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { pbError } from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await register(values.email, values.password, values.name);
      toast.success("Account created — you're all set!");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(pbError(err, "Could not create account"));
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start sending AI-crafted outreach in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Ada Lovelace" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Confirm password</Label>
          <Input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("passwordConfirm")}
          />
          {form.formState.errors.passwordConfirm && (
            <p className="text-xs text-destructive">
              {form.formState.errors.passwordConfirm.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
