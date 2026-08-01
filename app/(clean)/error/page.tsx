import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function ErrorPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6] p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg border border-red-200 text-center">
        <div className="h-20 w-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-3xl">
          ⚠️
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-[#3E2723]">Something went wrong</h2>
          <p className="mt-2 text-[#5D4037]">We encountered an error while processing your request.</p>
        </div>
        
        <Button asChild className="w-full bg-[#FFA726] hover:bg-[#FF9800]">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>;
}
