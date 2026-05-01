import TaskCard from '../TaskCard'

export default function TaskCardExample() {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <TaskCard
        subject="READING"
        title="Read a story about sharing"
        status="PENDING"
        onClick={() => console.log('Task clicked')}
      />
      <TaskCard
        subject="MATH"
        title="Count beans and sort by color"
        status="COMPLETED"
        onClick={() => console.log('Task clicked')}
      />
      <TaskCard
        subject="SCIENCE"
        title="Explore leaves in the backyard"
        status="PENDING"
        onClick={() => console.log('Task clicked')}
      />
    </div>
  )
}
