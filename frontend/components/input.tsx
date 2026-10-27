import React from "react"

type InputProp = {
  label: string,
  placeholder: string
  value: any,
  onChange: (_v: string) => void
}

const Input = ({
  label,
  placeholder,
  value,
  onChange
}: InputProp) => {

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div
      className="flex flex-col gap-2"
    >
      <label>
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={onChangeInput}
      />
    </div>
  )
}

export default Input