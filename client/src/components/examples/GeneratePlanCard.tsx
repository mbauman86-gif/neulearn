import GeneratePlanCard from '../GeneratePlanCard'

export default function GeneratePlanCardExample() {
  return (
    <div className="p-6">
      <GeneratePlanCard
        onGenerateDaily={() => console.log('Generate daily plan')}
        onGenerateWeekly={() => console.log('Generate weekly plan')}
      />
    </div>
  )
}
