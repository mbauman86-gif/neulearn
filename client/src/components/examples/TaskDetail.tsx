import { useState } from 'react'
import TaskDetail from '../TaskDetail'

export default function TaskDetailExample() {
  const [view, setView] = useState<'with-quiz' | 'with-scripture'>('with-scripture')
  
  const taskWithScripture = {
    title: "Practice saying thank you",
    objective: "Learn to be grateful for the things we have",
    instructionsForChild: "Today, say thank you to three different people. Tell them why you are thankful for them!",
    scriptureReference: "1 Thessalonians 5:18",
    scriptureText: "Give thanks in all circumstances",
    onBack: () => console.log('Back clicked'),
    onComplete: () => console.log('Task completed'),
  }
  
  const taskWithQuiz = {
    title: "Count beans and sort by color",
    objective: "Practice counting and color recognition",
    instructionsForChild: "Get 20 beans. Count them one by one. Then sort them into groups by color. How many of each color do you have?",
    quiz: {
      questions: [
        {
          type: 'MULTIPLE_CHOICE' as const,
          questionText: 'How many beans did you count?',
          options: ['10', '15', '20', '25'],
          correctAnswer: '20',
        },
        {
          type: 'YES_NO' as const,
          questionText: 'Did you find beans of different colors?',
          options: ['Yes', 'No'],
          correctAnswer: 'Yes',
        },
      ],
    },
    onBack: () => console.log('Back clicked'),
    onComplete: () => console.log('Quiz completed'),
  }
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-card">
        <Button onClick={() => setView(view === 'with-quiz' ? 'with-scripture' : 'with-quiz')}>
          Toggle: {view === 'with-quiz' ? 'Show Scripture Example' : 'Show Quiz Example'}
        </Button>
      </div>
      <TaskDetail {...(view === 'with-quiz' ? taskWithQuiz : taskWithScripture)} />
    </div>
  )
}

import { Button } from '@/components/ui/button'
