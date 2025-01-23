import { FileQuestion } from "lucide-react"
import { Button } from "~/components/ui/button"

interface NoDataProps {
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function NoData({ message = "No data available", actionLabel, onAction }: NoDataProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 bg-background text-muted-foreground p-8 rounded-lg border border-dashed">
      <FileQuestion className="h-10 w-10" />
      <p className="text-sm">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}