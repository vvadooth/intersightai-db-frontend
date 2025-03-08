import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
        <DialogTitle className="text-red-600 font-bold">Confirm Deletion</DialogTitle>
        <p>⚠️ Are you sure you want to delete {count} document{count !== 1 ? "s" : ""}? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
