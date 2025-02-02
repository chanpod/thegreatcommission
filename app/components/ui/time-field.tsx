import * as React from "react"
import { Input } from "./input"

interface TimeFieldProps {
    value: string
    onChange: (value: string) => void
}

export function TimeField({ value, onChange }: TimeFieldProps) {
    return (
        <Input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-[150px]"
        />
    )
} 