import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmailService } from "@/services/EmailService"; // Import EmailService
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner
import { toast } from "sonner";

interface SuspendedAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const SuspendedAccountDialog: React.FC<SuspendedAccountDialogProps> = ({ isOpen, onClose, userEmail }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // Add sending state
  // Removed supportEmail variable, it's handled in the service

  const handleSendEmail = async () => {
    if (isSending) return; // Prevent multiple sends
    setIsSending(true);

    try {
      const success = await EmailService.sendSuspensionSupportEmail(userEmail, message);

      if (success) {
        toast.success("Support email sent successfully!");
        setMessage(''); // Clear message on success
        onClose(); // Close dialog on success
      } else {
        toast.error("Failed to send support email. Please try again or contact support@eyesentrymed.com directly.");
      }
    } catch (error) {
      console.error("Error sending support email:", error);
      toast.error("An error occurred while sending the email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Suspended</DialogTitle>
          <DialogDescription>
            Your account ({userEmail}) is currently suspended. Please contact support for assistance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="email-display" className="text-right col-span-1">
               Your Email
             </Label>
             <span id="email-display" className="col-span-3 text-sm font-medium">{userEmail}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right col-span-1">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              placeholder="Add any details for the support team here..."
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
           <Button type="button" variant="outline" onClick={onClose}>
              Close
             </Button>
            <Button type="button" onClick={handleSendEmail} disabled={isSending}>
              {isSending ? <><LoadingSpinner size="sm" className="mr-2 border-white" /> Sending...</> : 'Send Email to Support'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuspendedAccountDialog;