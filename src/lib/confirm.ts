import Swal from "sweetalert2";

type ConfirmOptions = {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "question" | "info" | "error";
};

export async function confirmAction({
  title = "Are you sure?",
  text,
  confirmText = "Yes, continue",
  cancelText = "Cancel",
  icon = "question",
}: ConfirmOptions = {}): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "swal2-popup-themed",
      confirmButton: "swal2-confirm-themed",
      cancelButton: "swal2-cancel-themed",
    },
  });
  return result.isConfirmed === true;
}

export async function confirmDelete(
  title = "Delete this item?",
  text = "You won't be able to revert this!"
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "var(--destructive)",
    cancelButtonColor: "var(--muted-foreground)",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "swal2-popup-themed",
      confirmButton: "swal2-confirm-delete",
      cancelButton: "swal2-cancel-themed",
    },
  });
  return result.isConfirmed === true;
}
