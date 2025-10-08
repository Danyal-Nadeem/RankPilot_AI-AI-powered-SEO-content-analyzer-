"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Loader2, ShieldCheck, Key } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, error: authError, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  React.useEffect(() => {
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      await login(values.email, values.password)
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      {/* Background Orbs */}
      <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 dark:bg-indigo-500/5" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10 dark:bg-purple-500/5" />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="border-border/80 shadow-2xl bg-card/60 backdrop-blur-md relative overflow-hidden">
            {/* Glowing top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <CardHeader className="space-y-1.5 text-center">
              <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-2">
                <Key className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription>
                Sign in to manage your SEO audits and suggestions.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {authError && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isSubmitting}
                    className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                    {...register("email")}
                  />
                  {errors.email && (
                    <span className="text-[10px] text-rose-500 font-bold">{errors.email.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                    {...register("password")}
                  />
                  {errors.password && (
                    <span className="text-[10px] text-rose-500 font-bold">{errors.password.message}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 mt-2 font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 border-t border-border/40 bg-muted/20 py-4 text-center">
              <span className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-bold text-indigo-500 hover:text-indigo-400">
                  Register
                </Link>
              </span>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>SSL Encrypted Connection</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
