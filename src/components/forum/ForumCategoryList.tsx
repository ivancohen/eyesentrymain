import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ForumService } from '@/services/ForumService';
import { ForumCategory } from '@/types/forum';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { List } from 'lucide-react'; // Example icon

/**
 * @fileoverview Component to display a list of forum categories.
 */

const ForumCategoryList = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ForumService.getCategories();
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load categories";
      setError(message);
      toast.error(`Error loading categories: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <span className="ml-3">Loading Categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading categories: {error}</p>
        <Button onClick={fetchCategories} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <List size={24} /> Forum Categories
      </h2>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {/* Optionally display post count or last activity here later */}
                <Link to={`/forum/${category.id}`}>
                  <Button variant="outline" className="w-full">
                    View Posts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumCategoryList;