import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ForumCategoryList from '@/components/forum/ForumCategoryList';
import ForumPostList from '@/components/forum/ForumPostList';
import ForumPostView from '@/components/forum/ForumPostView';
import ForumPostForm from '@/components/forum/ForumPostForm'; // Import form for create route
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar'; // Import Navbar
import { ForumService } from '@/services/ForumService'; // Import ForumService to fetch category details
import { ForumCategory } from '@/types/forum'; // Import ForumCategory type
import { useState } from 'react'; // Import useState

/**
 * @fileoverview Main page component for the forum feature.
 * Handles routing to display categories, posts, or individual post views.
 * Includes standard page layout and Navbar.
 */

const ForumPage = () => {
  const { categoryId, postId } = useParams<{ categoryId?: string; postId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null>(null); // State for category details
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Determine if the current route is for creating a post
  const isCreatePostRoute = location.pathname === '/forum/create-post';
  // Extract categoryId from query params for the create route
  const queryParams = new URLSearchParams(location.search);
  const createInCategory = queryParams.get('category');

  useEffect(() => {
    // Redirect non-authenticated users
    if (!authLoading && !user) {
      toast.error("You must be logged in to access the forum.");
      navigate('/login');
    }
    // Redirect if trying to create post without a category ID
    if (isCreatePostRoute && !createInCategory) {
        toast.error("Cannot create a post without specifying a category.");
        navigate('/forum'); // Redirect back to category list
    }
  }, [authLoading, user, navigate, isCreatePostRoute, createInCategory]);

  // Fetch category details when categoryId is present (for PostList)
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (categoryId) {
        setLoadingCategory(true);
        try {
          // Assuming ForumService has getCategoryById or similar
          // This function needs to be added to ForumService.ts
          // const data = await ForumService.getCategoryById(categoryId);
          // setCategory(data);

          // Placeholder: Fetch all categories and find the one needed
          // Replace this with a dedicated getCategoryById function later
          const allCategories = await ForumService.getCategories();
          const foundCategory = allCategories.find(cat => cat.id === categoryId);
          setCategory(foundCategory || null);

        } catch (error) {
          console.error("Error fetching category details:", error);
          toast.error("Could not load category details.");
          setCategory(null);
        } finally {
          setLoadingCategory(false);
        }
      } else {
        setCategory(null); // Clear category if no categoryId
      }
    };
    fetchCategoryDetails();
  }, [categoryId]);


  if (authLoading || loadingCategory) { // Show loading if auth or category details are loading
    return (
      <div className="flex justify-center items-center min-h-screen questionnaire-bg">
        <LoadingSpinner />
        <span className="ml-3">Loading Forum...</span>
      </div>
    );
  }

  // Render based on route parameters
  const renderContent = () => {
    if (isCreatePostRoute && createInCategory) {
      return (
        <ForumPostForm
          categoryId={createInCategory}
          onSuccess={(newPostId) => navigate(`/forum/post/${newPostId}`)} // Navigate to new post on success
          onCancel={() => navigate(`/forum/${createInCategory}`)} // Navigate back to category on cancel
        />
      );
    } else if (postId) {
      return <ForumPostView />; // PostId is extracted via useParams within the component
    } else if (categoryId) {
      // Pass category details to PostList if available
      return <ForumPostList
                categoryId={categoryId}
                categoryName={category?.name}
                categoryRules={category?.rules}
             />;
    } else {
      return <ForumCategoryList />;
    }
  };

  return (
    // Added standard page layout structure
    <div className="min-h-screen flex flex-col questionnaire-bg relative">
      <Navbar showProfile={true} /> {/* Added Navbar */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {/* Add a main title or breadcrumbs if desired */}
        {/* <h1 className="text-3xl font-bold mb-6">Doctor Forum</h1> */}
        {renderContent()}
      </main>
    </div>
  );
};

export default ForumPage;