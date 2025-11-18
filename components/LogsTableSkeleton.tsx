import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function LogsTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-4 w-10"></th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-12 bg-muted-foreground/20" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
              </th>
              <th className="px-6 py-4 text-left">
                <Skeleton className="h-4 w-20 bg-muted-foreground/20" />
              </th>
              <th className="px-6 py-4 text-right">
                <Skeleton className="h-4 w-16 ml-auto bg-muted-foreground/20" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-4 bg-muted-foreground/20" />
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
                    <Skeleton className="h-3 w-24 bg-muted-foreground/10" />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Skeleton className="h-7 w-28 rounded-full bg-muted-foreground/20" />
                </td>
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-48 bg-muted-foreground/20" />
                </td>
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
                </td>
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded bg-muted-foreground/20" />
                    <Skeleton className="h-8 w-8 rounded bg-muted-foreground/20" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
