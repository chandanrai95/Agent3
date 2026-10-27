'use client'
import useForm from '@/hooks/useForm'
import { loginApi } from '@/lib/api/auth'
import { errorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/useAuthStore'
import Field, { PasswordToggle } from '@/components/auth/field'
import Spinner from '@/components/ui/spinner'
import { btnPrimary } from '@/components/ui/styles'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'react-toastify'

type LoginForm = {
  email: string
  password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState<boolean>(false);
  const [submitted, setSubmitted] = React.useState(false);
  const { formValues, onChangeFormValue } = useForm<LoginForm>({ email: '', password: '' });

  const errors = {
    email: !formValues.email ? 'Email is required' : !EMAIL_PATTERN.test(formValues.email) ? 'Please enter a valid email address' : null,
    password: !formValues.password ? 'Password is required' : null,
  }

  const onLoginPress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (errors.email || errors.password) return

    try {
      setIsLoggingIn(true);
      const user = await loginApi(formValues)
      setUser(user)
      router.push('/')
    } catch (err) {
      console.error('onLoginPress', err)
      toast(errorMessage(err, 'Could not log in.'), {
        type: 'error'
      })
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold tracking-tight text-on-surface mb-2">Welcome back</h1>
        <p className="text-body-md text-on-surface-variant">Log in to manage your agents and their knowledge.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onLoginPress} noValidate>
        <Field
          id="email"
          label="Email"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={formValues.email}
          onChange={(e) => onChangeFormValue('email', e)}
          error={submitted ? errors.email : null}
        />
        <Field
          id="password"
          label="Password"
          icon="lock"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={formValues.password}
          onChange={(e) => onChangeFormValue('password', e)}
          error={submitted ? errors.password : null}
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
        />

        <button type="submit" className={`${btnPrimary} w-full mt-2 py-3 text-[16px]`} disabled={isLoggingIn}>
          {isLoggingIn && <Spinner />}
          {isLoggingIn ? 'Signing in...' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border-dark/60 text-center text-body-sm text-on-surface-variant">
        Don&apos;t have an account?
        <Link href="/auth/signup" className="text-primary hover:underline text-label-md font-medium ml-1">Sign up</Link>
      </div>
    </div>
  )
}

export default Login
