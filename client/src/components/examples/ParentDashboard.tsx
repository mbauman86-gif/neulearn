import ParentDashboard from '../ParentDashboard'

//todo: remove mock functionality
export default function ParentDashboardExample() {
  const mockChildren = [
    { id: '1', name: 'Emma Johnson', grade: 'K' as const, completionPercent: 75, points: 240 },
    { id: '2', name: 'Noah Smith', grade: '1' as const, completionPercent: 60, points: 180 },
    { id: '3', name: 'Olivia Brown', grade: '2' as const, completionPercent: 90, points: 320 },
  ]
  
  return (
    <ParentDashboard
      children={mockChildren}
      onAddChild={() => console.log('Add child')}
      onViewPlans={(id) => console.log('View plans for:', id)}
      onEditChild={(id) => console.log('Edit child:', id)}
      onLogout={() => console.log('Logout')}
    />
  )
}
