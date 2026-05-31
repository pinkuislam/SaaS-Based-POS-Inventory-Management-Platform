import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import { Eye } from "lucide-react";

export function CrudActionsCell({
  edit,
  deleteUrl,
  deleteTitle,
  deleteMessage,
  viewHref,
  viewLabel = "View",
}: {
  edit?: React.ReactNode;
  deleteUrl?: string;
  deleteTitle?: string;
  deleteMessage?: string;
  viewHref?: string;
  viewLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {viewHref ? (
        <Link href={viewHref}>
          <Button size="sm" variant="outline">
            <Eye className="mr-1 h-3.5 w-3.5" />
            {viewLabel}
          </Button>
        </Link>
      ) : null}
      {edit}
      {deleteUrl ? (
        <DeleteButton
          url={deleteUrl}
          confirmTitle={deleteTitle}
          confirmMessage={deleteMessage}
        />
      ) : null}
    </div>
  );
}
