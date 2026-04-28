export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>

      <div className="rounded-md border">
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
