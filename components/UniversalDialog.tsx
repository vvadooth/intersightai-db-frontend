"use client";

import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UniversalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function UniversalDialog({
  open,
  onClose,
  title,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
}: UniversalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
        <DialogTitle className="font-bold">{title}</DialogTitle>
        <p className="mt-2 text-gray-600">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          {cancelText && (
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button onClick={onConfirm || onClose}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
