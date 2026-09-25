import { Badge } from "@/components/ui/badge";

const LABEL = { draft: "Draft", published: "Published", archived: "Archived" };

export function StatusBadge({
  status,
}: {
  status: "draft" | "published" | "archived";
}) {
  return (
    <Badge
      variant={status === "published" ? "default" : "outline"}
      className={
        status === "archived"
          ? "font-normal text-muted-foreground"
          : "font-normal"
      }
    >
      {LABEL[status]}
    </Badge>
  );
}
