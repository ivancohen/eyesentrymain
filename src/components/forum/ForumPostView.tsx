import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ForumService } from '@/services/ForumService';
import { ForumPost, ForumReply, ForumCategory } from '@/types/forum';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Pin, Trash2, UserCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { formatDistanceToNow } from 'date-fns';
import ForumReplyForm from './ForumReplyForm'; // Assuming this component exists
import { useAuth } from '@/contexts/AuthContext'; // To check if user is admin

/**
 * @fileoverview Component to display a single forum post and its replies.
 */

const ForumPostView = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, isAdmin } = useAuth(); // Get current user and admin status

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [category, setCategory] = useState<ForumCategory | null>(null); // To display rules
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      fetchPostAndReplies();
    } else {
      setError("Post ID is missing.");
      setIsLoading(false);
    }
  }, [postId]);

  const fetchPostAndReplies = async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const postData = await ForumService.getPostById(postId);
      if (!postData) {
        throw new Error("Post not found or access denied.");
      }
      setPost(postData);

      // Fetch category details if needed (e.g., for rules)
      if (postData.category_id) {
         // Assuming ForumService has getCategoryById or similar
         // const categoryData = await ForumService.getCategoryById(postData.category_id);
         // setCategory(categoryData);
         // For now, we'll skip fetching category details to keep it simple
      }

      const repliesData = await ForumService.getRepliesByPost(postId);
      setReplies(repliesData);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load post details";
      setError(message);
      toast.error(`Error loading post: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySuccess = () => {
    // Refetch replies after a new one is posted
    if (postId) {
      ForumService.getRepliesByPost(postId).then(setReplies);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !isAdmin) return;
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      const success = await ForumService.deletePost(post.id);
      if (success) {
        // Optionally navigate back or show a deleted message
        toast.success("Post deleted");
        // Maybe navigate back to category? navigate(`/forum/${post.category_id}`);
        setPost(null); // Clear the post locally
      }
    }
  };

  const handleDeleteReply = async (replyId: string) => {
     if (!isAdmin) return;
     if (window.confirm("Are you sure you want to delete this reply?")) {
       const success = await ForumService.deleteReply(replyId);
       if (success) {
         setReplies(currentReplies => currentReplies.filter(reply => reply.id !== replyId));
         toast.success("Reply deleted");
       }
     }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <span className="ml-3">Loading Post...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
        <Link to="/forum">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
          </Button>
        </Link>
      </div>
    );
  }

  if (!post) {
     return (
       <div className="text-center py-8 text-muted-foreground">
         <p>Post not found.</p>
         <Link to="/forum">
           <Button variant="outline" className="mt-4">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
           </Button>
         </Link>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to={`/forum/${post.category_id}`} className="inline-flex items-center text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Category
      </Link>

      {/* Category Rules (if fetched) */}
      {category?.rules && (
        <Card className="bg-secondary p-4">
           <CardHeader className="p-0 pb-2">
             <CardTitle className="text-lg">Category Rules</CardTitle>
           </CardHeader>
           <CardContent className="p-0 text-sm text-muted-foreground">
             {category.rules}
           </CardContent>
        </Card>
      )}

      {/* Main Post */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                Posted by {post.author?.name || 'Unknown User'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               {post.is_pinned && (
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Pin className="h-4 w-4 text-muted-foreground" />
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Pinned Post</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               )}
               {isAdmin && (
                 <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={handleDeletePost} title="Delete Post">
                   <Trash2 size={16} />
                 </Button>
               )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          {/* Render post content safely - consider using Markdown renderer if needed */}
          <p>{post.content}</p>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Replies ({replies.length})</h3>
        {replies.length === 0 ? (
          <p className="text-muted-foreground">No replies yet.</p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <Card key={reply.id} className="bg-muted/50">
                <CardContent className="p-4">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                         {/* Basic user icon for now */}
                         <UserCircle size={16} />
                         <span>{reply.author?.name || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground">
                           {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                         </span>
                         {isAdmin && (
                           <Button variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => handleDeleteReply(reply.id)} title="Delete Reply">
                             <Trash2 size={14} />
                           </Button>
                         )}
                      </div>
                   </div>
                  <p className="text-sm">{reply.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <ForumReplyForm postId={post.id} onSuccess={handleReplySuccess} />

    </div>
  );
};

export default ForumPostView;