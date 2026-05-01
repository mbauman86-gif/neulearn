import ChildHome from '../ChildHome'

//todo: remove mock functionality
export default function ChildHomeExample() {
  const mockTasks = [
    { id: '1', subject: 'READING' as const, title: 'Read a story about sharing', status: 'PENDING' as const },
    { id: '2', subject: 'MATH' as const, title: 'Count beans and sort by color', status: 'COMPLETED' as const },
    { id: '3', subject: 'SCIENCE' as const, title: 'Explore leaves in the backyard', status: 'PENDING' as const },
    { id: '4', subject: 'CHARACTER' as const, title: 'Practice saying thank you', status: 'PENDING' as const },
  ]
  
  return (
    <ChildHome
      childName="Emma"
      points={240}
      badges={['FIRST_TASK_COMPLETE', 'FIRST_DAY_COMPLETE']}
      tasks={mockTasks}
      onTaskClick={(id) => console.log('Task clicked:', id)}
    />
  )
}
