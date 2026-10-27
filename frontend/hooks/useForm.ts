'use client'
import React from "react"


function useForm<T extends Record<string, any>>(initialValue: T) {
	const [formValues, setFormValues] = React.useState<T>(initialValue || {})

	const onChangeFormValue = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
		setFormValues((prev) => ({
			...prev,
			[key]: e.target.value
		}))
	}

	const onChangeValue = (key: string, value: any) => {
		setFormValues((prev) => ({
			...prev,
			[key]: value
		}))
	}


	return {
		formValues,
		onChangeFormValue,
		onChangeValue
	}
}

export default useForm