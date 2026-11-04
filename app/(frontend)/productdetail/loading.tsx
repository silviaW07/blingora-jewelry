export default function ProductDetailLoading() {
  return (
    <div className="min-h-[70vh] bg-[#f7f4ee]" aria-hidden>
      <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-3 py-4 lg:grid-cols-2 lg:px-6">
        <div className="aspect-square w-full animate-pulse rounded-[20px] bg-[#f0ebe3]" />
        <div className="space-y-3 pt-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[#f0ebe3]" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-[#f0ebe3]" />
          <div className="h-6 w-32 animate-pulse rounded bg-[#f0ebe3]" />
          <div className="grid grid-cols-6 gap-2 pt-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-lg bg-[#f0ebe3]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
