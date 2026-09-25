import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/**
 * Renders trusted-author markdown (catalog content). Raw HTML is not enabled,
 * so embedded tags are shown as text rather than executed.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose max-w-none prose-neutral dark:prose-invert prose-headings:font-semibold prose-a:underline-offset-4 prose-blockquote:font-normal prose-blockquote:text-muted-foreground prose-blockquote:not-italic [&_blockquote_p]:whitespace-pre-line [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
