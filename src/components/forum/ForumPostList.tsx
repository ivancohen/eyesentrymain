import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ForumService } from '@/services/ForumService';
import { ForumPost } from '@/types/forum';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { MessageSquare, Pin, PlusCircle } from 'lucide-react'; // Example icons
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
// Import ForumPostForm if it will be used in a Dialog here
// import ForumPostForm from './ForumPostForm';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

/**
 * @fileoverview Component to display a list of forum posts for a specific category.
 */

interface ForumPostListProps {
  categoryId: string;
  categoryName?: string; // Optional: Pass category name for display
  categoryRules?: string | null; // Optional: Pass category rules
}

const ForumPostList = ({ categoryId, categoryName, categoryRules }: ForumPostListProps) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for controlling the 'Create Post' dialog if implemented here
  // const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [categoryId]);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ForumService.getPostsByCategory(categoryId);
      setPosts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load posts";
      setError(message);
      toast.error(`Error loading posts: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for successful post creation if dialog is managed here
  // const handlePostCreated = () => {
  //   setIsCreatePostOpen(false);
  //   fetchPosts(); // Refresh the list
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <span className="ml-3">Loading Posts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading posts: {error}</p>
        <Button onClick={fetchPosts} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {categoryName ? `Posts in ${categoryName}` : 'Forum Posts'}
        </h2>
        {/* Button to trigger Create Post Dialog */}
        {/* <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle size={16} className="mr-2" /> Create Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <ForumPostForm categoryId={categoryId} onSuccess={handlePostCreated} onCancel={() => setIsCreatePostOpen(false)} />
          </DialogContent>
        </Dialog> */}
         <Link to={`/forum/create-post?category=${categoryId}`}> {/* Simple link for now */}
            <Button>
                <PlusCircle size={16} className="mr-2" /> Create Post
            </Button>
         </Link>
      </div>

      {/* Display Category Rules if provided */}
      {categoryRules && (
        <Card className="bg-secondary p-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg">Category Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-sm text-muted-foreground">
            {categoryRules}
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
           <MessageSquare className="mx-auto h-12 w-12 opacity-50 mb-4" />
           <p>No posts found in this category yet.</p>
           <p className="mt-2">Be the first to start a discussion!</p>
           {/* Optionally add the create button here too */}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-1">
                  {post.is_pinned && (
                    <Badge variant="secondary" className="mb-1">
                      <Pin className="h-3 w-3 mr-1" /> Pinned
                    </Badge>
                  )}
                  <Link to={`/forum/post/${post.id}`} className="hover:underline">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Started by {post.author?.name || 'Unknown User'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                   <p className="text-sm text-muted-foreground">
                     Last activity: {formatDistanceToNow(new Date(post.last_activity_at), { addSuffix: true })}
                   </p>
                </div>
                {/* Optional: Display reply count */}
                {/* <div className="text-sm text-muted-foreground">
                  {post.reply_count || 0} replies
                </div> */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumPostList;