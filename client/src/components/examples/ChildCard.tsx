import ChildCard from '../ChildCard'

export default function ChildCardExample() {
  return (
    <div className="p-6 max-w-md">
      <ChildCard
        name="Emma Johnson"
        grade="K"
        completionPercent={75}
        points={240}
        onViewPlans={() => console.log('View plans clicked')}
        onEditChild={() => console.log('Edit child clicked')}
      />
    </div>
  )
}
