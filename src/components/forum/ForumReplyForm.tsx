import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ForumService } from '@/services/ForumService';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * @fileoverview Component for submitting a reply to a forum post.
 */

interface ForumReplyFormProps {
  postId: string;
  onSuccess: () => void; // Callback to refresh replies list
}

const ForumReplyForm = ({ postId, onSuccess }: ForumReplyFormProps) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error("Reply content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const replyData = {
        post_id: postId,
        content: replyContent.trim(),
      };
      const newReplyId = await ForumService.createReply(replyData);

      if (newReplyId) {
        setReplyContent(''); // Clear the textarea
        toast.success("Reply submitted successfully!");
        onSuccess(); // Trigger refresh in parent component
      }
      // Error handling is done within ForumService.createReply
    } catch (error) {
      // Fallback error handling (though service should handle toasts)
      console.error("Error submitting reply:", error);
      toast.error("An unexpected error occurred while submitting the reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t pt-6">
      <h4 className="text-lg font-semibold mb-2">Post a Reply</h4>
      <div className="space-y-2">
        <Textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write your reply here..."
          rows={4}
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !replyContent.trim()}>
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Submit Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ForumReplyForm;