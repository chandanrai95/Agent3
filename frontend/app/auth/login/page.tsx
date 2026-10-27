'use client'
import useForm from '@/hooks/useForm'
import { loginApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/useAuthStore'
import { redirect, useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'react-toastify'

type LoginForm = {
  email: string
  password: string
}


function Login() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState<boolean>(false);
  const { formValues, onChangeFormValue } = useForm<LoginForm>({ email: '', password: '' });


  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('email', e)
  }

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('password', e)
  }

  const toggleShow = () => {
    setShowPassword((prev) => !prev)
  }

  const onLoginPress = async () => {
    try {
      setIsLoggingIn(true);
      if (!formValues?.email || !formValues?.password) {
        toast('Email and Password are required fields.', {
          type: 'error'
        })
        return;
      }

      const user = await loginApi(formValues)
      toast('Log in successful', {
        type: 'success'
      })
      setUser(user)
      router.push('/')
    } catch (err) {
      console.error('onLoginPress', err)
      toast('Something went wrong.',  {
        type: 'error'
      })
    } finally {
      setIsLoggingIn(false);
    }
  }

  const onCreateAccout = () => {
    redirect('/auth/signup')
  }

  return (
    <div
      className="flex flex-1  w-full gap-5 flex-col items-center justify-center"
    >
      <div className="flex w-full flex-col">
        <label>
          Email
        </label>
        <input
          className="mt-2"
          value={formValues?.email}
          placeholder="Enter your email"
          onChange={onChangeEmail}
        />
      </div>

      <div className="flex w-full flex-col">
        <label>
          Password
        </label>

        <div
          className='password-input-container w-full mt-2'
        >
          <input
            value={formValues?.password}
            className="password-input w-full"
            placeholder="Enter your password"
            onChange={onChangePassword}
            type={showPassword ? 'text' : 'password'}
          />
          <div
            className='pl-3 pr-3 text-lg font-semibold cursor-pointer'
            onClick={toggleShow}
          >
            {showPassword ? 'Hide' : 'Show'}
          </div>
        </div>

      </div>

      <button
        className='mt-6'
        onClick={onLoginPress}
      >
        {isLoggingIn ? 'Logging In...' : 'Login'}
      </button>

      <span className="self-center text-gray-800 mb-3 mt-2 text-center">
        Don't have an account? <button
          className="secondary-button rounded-sm text-blue-500 "
          onClick={onCreateAccout}
        >
          Create Account
        </button>
      </span>
    </div>
  )
}

export default Login