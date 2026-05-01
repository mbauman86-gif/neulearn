import PlanView from '../PlanView'

//todo: remove mock functionality
export default function PlanViewExample() {
  const mockPlan = [
    {
      date: '2024-03-20',
      tasks: [
        { id: '1', subject: 'READING' as const, title: 'Read a story about sharing', objective: 'Build reading comprehension and character values', status: 'PENDING' as const },
        { id: '2', subject: 'MATH' as const, title: 'Count beans and sort by color', objective: 'Practice counting and color recognition', status: 'COMPLETED' as const },
        { id: '3', subject: 'SCIENCE' as const, title: 'Explore leaves in the backyard', objective: 'Learn about nature and plant parts', status: 'PENDING' as const },
      ],
    },
  ]
  
  return (
    <PlanView
      childName="Emma"
      plan={mockPlan}
      isGenerating={false}
      onBack={() => console.log('Back clicked')}
      onGenerateDaily={() => console.log('Generate daily')}
      onGenerateWeekly={() => console.log('Generate weekly')}
    />
  )
}
