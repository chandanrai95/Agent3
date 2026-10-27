'use client'
import useForm from '@/hooks/useForm'
import { signUpApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/useAuthStore'
import axios from 'axios'
import { redirect, useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'react-toastify'

type SignUpForm = {
  name: string
  email: string
  password: string
  confirmPassword: string
}


function SignUp() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = React.useState<boolean>(false);
  const { formValues, onChangeFormValue } = useForm<SignUpForm>({ name: '', email: '', password: '', confirmPassword: '' });


  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('name', e)
  }

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('email', e)
  }

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('password', e)
  }

  const onChangeConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFormValue('confirmPassword', e)
  }

  const toggleShow = () => {
    setShowPassword((prev) => !prev)
  }

  const onLoginPress = () => {
    redirect('/auth/login')
  }

  const onSignup = async () => {
    try {
      setIsSigningUp(true);
      if (formValues.password !== formValues.confirmPassword) {
        toast("Password doesn't match.")
        return;
      }
      if (!formValues.name || !formValues.email || !formValues.password || !formValues.confirmPassword) {
        toast("All fields are required.")
        return;
      }

      const user = await signUpApi(formValues);
      setUser(user)

      toast('Signup successful', {
        type: 'success'
      })
      router.replace('/')
    } catch (err) {
      console.error('onSignup', err);
      toast('Something went wrong.', {
        type: 'error'
      })
    } finally {
      setIsSigningUp(false);
    }
  }

  return (
    <div
      className="flex flex-1  w-full gap-5 flex-col items-center justify-center"
    >
      <div className="flex w-full flex-col">
        <label>
          Name
        </label>
        <input
          className="mt-2"
          value={formValues?.name}
          placeholder="Enter your name"
          onChange={onChangeName}
        />
      </div>
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

      <div className="flex w-full flex-col">
        <label>
          Confirm Password
        </label>

        <div
          className='password-input-container w-full mt-2'
        >
          <input
            value={formValues?.confirmPassword}
            className="password-input w-full"
            placeholder="Enter your confirm password"
            onChange={onChangeConfirmPassword}
            type={'text'}
          />
        </div>

      </div>

      <button
        className='mt-6'
        onClick={onSignup}
      >
        {isSigningUp ? 'Signing Up...' : 'Sign Up'}
      </button>

      <span className="self-center text-gray-800 mb-3 mt-2 text-center">
        Already have an account? <button
          className="secondary-button rounded-sm text-blue-500 "
          onClick={onLoginPress}
        >
          Log In
        </button>
      </span>
    </div>
  )
}

export default SignUp