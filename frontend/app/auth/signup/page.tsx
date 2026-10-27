'use client'
import useForm from '@/hooks/useForm'
import { signUpApi } from '@/lib/api/auth'
import { errorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/useAuthStore'
import Field, { PasswordToggle } from '@/components/auth/field'
import Icon from '@/components/ui/icon'
import Spinner from '@/components/ui/spinner'
import { btnPrimary } from '@/components/ui/styles'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'react-toastify'

type SignUpForm = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRENGTH = [
  { label: 'Too weak', color: 'text-error', bar: 'bg-error' },
  { label: 'Weak', color: 'text-error', bar: 'bg-error' },
  { label: 'Fair', color: 'text-rag-syncing', bar: 'bg-rag-syncing' },
  { label: 'Good', color: 'text-secondary', bar: 'bg-secondary' },
  { label: 'Strong', color: 'text-rag-indexed', bar: 'bg-rag-indexed' },
]

const passwordScore = (p: string) =>
  !p ? 0 : [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length

function SignUp() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = React.useState<boolean>(false);
  const [submitted, setSubmitted] = React.useState(false);
  const { formValues, onChangeFormValue } = useForm<SignUpForm>({ name: '', email: '', password: '', confirmPassword: '' });

  const score = passwordScore(formValues.password)
  // the backend requires names and passwords of at least 6 characters
  const errors = {
    name: formValues.name.trim().length < 6 ? 'Name must be at least 6 characters' : null,
    email: !EMAIL_PATTERN.test(formValues.email) ? 'Please enter a valid email address' : null,
    password: formValues.password.length < 6 ? 'Password must be at least 6 characters' : null,
    confirmPassword: formValues.confirmPassword !== formValues.password ? 'Passwords must match' : null,
  }

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return

    try {
      setIsSigningUp(true);
      const user = await signUpApi(formValues);
      setUser(user)
      router.replace('/')
    } catch (err) {
      console.error('onSignup', err);
      toast(errorMessage(err, 'Could not create your account.'), {
        type: 'error'
      })
    } finally {
      setIsSigningUp(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold tracking-tight text-on-surface mb-2">Create your account</h1>
        <p className="text-body-md text-on-surface-variant">Start building AI agents in minutes.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSignup} noValidate>
        <Field
          id="name"
          label="Full name"
          icon="person"
          autoComplete="name"
          placeholder="Sarah Connor"
          value={formValues.name}
          onChange={(e) => onChangeFormValue('name', e)}
          error={submitted ? errors.name : null}
        />
        <Field
          id="email"
          label="Email"
          icon="alternate_email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={formValues.email}
          onChange={(e) => onChangeFormValue('email', e)}
          error={submitted ? errors.email : null}
        />

        <div className="flex flex-col gap-1.5">
          <Field
            id="password"
            label="Password"
            icon="lock"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={formValues.password}
            onChange={(e) => onChangeFormValue('password', e)}
            error={submitted ? errors.password : null}
            hint={formValues.password && (
              <span className={`flex items-center gap-1 text-label-sm ${STRENGTH[score].color}`}>
                {STRENGTH[score].label}
                {score >= 3 && <Icon name="verified_user" className="text-[14px]" />}
              </span>
            )}
            trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
          />
          <div className="grid grid-cols-4 gap-1.5 pt-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1 rounded-full transition-colors ${i <= score ? STRENGTH[score].bar : 'bg-surface-container-highest'}`} />
            ))}
          </div>
        </div>

        <Field
          id="confirm-password"
          label="Confirm password"
          icon="lock_reset"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={formValues.confirmPassword}
          onChange={(e) => onChangeFormValue('confirmPassword', e)}
          error={(submitted || formValues.confirmPassword) ? errors.confirmPassword : null}
        />

        <button type="submit" className={`${btnPrimary} w-full mt-2 py-3 text-[16px]`} disabled={isSigningUp}>
          {isSigningUp && <Spinner />}
          {isSigningUp ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border-dark/60 text-center text-body-sm text-on-surface-variant">
        Already have an account?
        <Link href="/auth/login" className="text-primary hover:underline text-label-md font-medium ml-1">Log in</Link>
      </div>
    </div>
  )
}

export default SignUp
