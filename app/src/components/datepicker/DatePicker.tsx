import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"

interface DatePickerProps {
  date?: Date
  disabled?: boolean
  name?: string
  
  useRange?: boolean
  onChange?: (date: Date | undefined) => void
}

export function DatePicker({ date, disabled, name, useRange, onChange }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar            
          mode={useRange ? "range" : "single"}                    
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date)
            onChange?.(date)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
