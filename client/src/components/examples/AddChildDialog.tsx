import { useState } from 'react'
import AddChildDialog from '../AddChildDialog'
import { Button } from '@/components/ui/button'

export default function AddChildDialogExample() {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Add Child Dialog</Button>
      <AddChildDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
