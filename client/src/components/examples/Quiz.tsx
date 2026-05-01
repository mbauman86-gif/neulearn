import Quiz from '../Quiz'

//todo: remove mock functionality
export default function QuizExample() {
  const mockQuestions = [
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
    {
      type: 'SHORT_TEXT' as const,
      questionText: 'What was your favorite color of bean?',
      correctAnswer: 'green',
    },
  ]
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Quiz
        questions={mockQuestions}
        onComplete={() => console.log('Quiz completed')}
      />
    </div>
  )
}
