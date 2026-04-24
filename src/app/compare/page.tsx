import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";

export default function ComparePage() {
  const rows: { feature: string; gp: string; arccos: string; birdies: string; grint: string; tag: string }[] = [
    { feature: "US Course Coverage", gp: "Top ~50%", arccos: "100%", birdies: "100%", grint: "100%", tag: "Request a course" },
    { feature: "GPS & Yardages", gp: "yes", arccos: "yes", birdies: "yes", grint: "yes", tag: "" },
    { feature: "Color-Coded Risk Zones (R/A/G)", gp: "yes", arccos: "no", birdies: "no", grint: "no", tag: "Nowhere else" },
    { feature: "Weather-Compensated Dispersion", gp: "yes", arccos: "no", birdies: "no", grint: "no", tag: "Nowhere else" },
    { feature: "AI Caddie & Club Recommendations", gp: "yes", arccos: "paid", birdies: "paid", grint: "no", tag: "" },
    { feature: "Personal Updatable Playbooks", gp: "yes", arccos: "no", birdies: "no", grint: "no", tag: "Nowhere else" },
    { feature: "Weather Simulation", gp: "yes", arccos: "no", birdies: "no", grint: "no", tag: "Nowhere else" },
    { feature: "Wind, Slope & Altitude Adjust", gp: "yes", arccos: "yes", birdies: "paid", grint: "no", tag: "" },
    { feature: "Aim Lines (Draw/Fade)", gp: "yes", arccos: "no", birdies: "no", grint: "no", tag: "Nowhere else" },
    { feature: "Printed Strategy Guides", gp: "soon", arccos: "no", birdies: "no", grint: "no", tag: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Golf Playbook
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </header>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Comparison
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Aim for your miss, not a miracle.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              See how Golf Playbook stacks up against the rest.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border/50 bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="sticky left-0 z-10 min-w-[180px] bg-background px-4 py-3 text-left font-semibold md:px-6">Feature</th>
                    <th className="px-3 py-3 text-center font-semibold text-[#08401B] dark:text-primary md:px-6">
                      Golf Playbook
                      <span className="block text-xs font-normal text-[#08401B]/80 dark:text-primary/80">Free</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground md:px-6">
                      Arccos
                      <span className="block text-xs font-normal">$$$ + sensors</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground md:px-6">
                      18Birdies
                      <span className="block text-xs font-normal">$$</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-muted-foreground md:px-6">
                      Grint
                      <span className="block text-xs font-normal">$$</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.feature} className="border-b border-border/30 last:border-0">
                      <td className="sticky left-0 z-10 bg-background px-4 py-3 md:px-6">
                        <span>{row.feature}</span>
                        {row.tag && (
                          <span className="ml-2 inline-block rounded-full bg-[#08401B]/10 px-2 py-0.5 text-[10px] font-medium text-[#08401B] dark:bg-primary/10 dark:text-primary">
                            {row.tag}
                          </span>
                        )}
                      </td>
                      {[
                        { val: row.gp, isPrimary: true },
                        { val: row.arccos, isPrimary: false },
                        { val: row.birdies, isPrimary: false },
                        { val: row.grint, isPrimary: false },
                      ].map((col, ci) => (
                        <td key={ci} className="px-3 py-3 text-center md:px-6">
                          {col.val === "yes" && <CheckIcon className={`mx-auto h-5 w-5 ${col.isPrimary ? "text-[#08401B] dark:text-primary" : "text-muted-foreground/50"}`} />}
                          {col.val === "no" && <XIcon className="mx-auto h-4 w-4 text-muted-foreground/30" />}
                          {col.val === "paid" && <span className="text-xs text-muted-foreground">Paid</span>}
                          {col.val === "soon" && <span className="text-xs text-muted-foreground">Soon</span>}
                          {!["yes", "no", "paid", "soon"].includes(col.val) && (
                            <span className={`text-xs font-medium ${col.isPrimary ? "text-[#08401B] dark:text-primary" : "text-muted-foreground"}`}>
                              {col.val}
                              {col.isPrimary && col.val.includes("%") && (
                                <span className="block text-[10px] font-normal text-[#08401B]/60 dark:text-primary/60">Growing</span>
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
