import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ForumService } from '@/services/ForumService';
import { toast } from 'sonner';
import { Send, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ForumPostData } from '@/types/forum';

/**
 * @fileoverview Component form for creating a new forum post.
 */

interface ForumPostFormProps {
  categoryId: string;
  onSuccess: (newPostId: string) => void; // Callback on successful creation
  onCancel: () => void; // Callback to close the form/dialog
}

const ForumPostForm = ({ categoryId, onSuccess, onCancel }: ForumPostFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData: ForumPostData = {
        category_id: categoryId,
        title: title.trim(),
        content: content.trim(),
      };
      const newPostId = await ForumService.createPost(postData);

      if (newPostId) {
        setTitle('');
        setContent('');
        toast.success("Post created successfully!");
        onSuccess(newPostId); // Pass the new ID back
      }
      // Error handling is done within ForumService.createPost
    } catch (error) {
      // Fallback error handling
      console.error("Error creating post:", error);
      toast.error("An unexpected error occurred while creating the post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="post-title">Post Title</Label>
        <Input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="post-content">Content</Label>
        <Textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the main content of your post here..."
          rows={8}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
         <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X size={16} className="mr-1" /> Cancel
         </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Create Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ForumPostForm;