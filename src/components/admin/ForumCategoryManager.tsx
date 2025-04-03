import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { ForumService } from '@/services/ForumService';
import { ForumCategory, ForumCategoryData } from '@/types/forum';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

/**
 * @fileoverview Admin component for managing forum categories (CRUD).
 */

const ForumCategoryManager = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategoryData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCategories = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  const handleAddCategory = () => {
    setEditingCategory({
      name: '',
      description: '',
      rules: '',
      display_order: (categories.length + 1) * 10 // Default order
    });
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: ForumCategory) => {
    setEditingCategory({ ...category }); // Copy category data for editing
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category? This might affect existing posts.")) {
      setIsLoading(true); // Indicate processing
      const success = await ForumService.deleteCategory(categoryId);
      if (success) {
        toast.success("Category deleted successfully");
        setRefreshTrigger(prev => prev + 1); // Refresh list
      }
      // Error toast is handled within the service
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) {
      toast.error("Category name is required.");
      return;
    }

    setIsLoading(true);
    const success = await ForumService.saveCategory(editingCategory);
    if (success) {
      setIsFormOpen(false);
      setEditingCategory(null);
      setRefreshTrigger(prev => prev + 1); // Refresh list
    }
    // Error toast is handled within the service
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Forum Categories</h2>
        <div className="flex gap-2">
           <Button onClick={() => setRefreshTrigger(prev => prev + 1)} variant="outline" disabled={isLoading}>
              <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
           </Button>
          <Button onClick={handleAddCategory}>
            <PlusCircle size={16} className="mr-2" /> Add Category
          </Button>
        </div>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner /> <span className="ml-2">Loading categories...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error: {error}</p>
          <Button onClick={fetchCategories} variant="outline" className="mt-2">Retry</Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>View, edit, or delete forum categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No categories created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)} className="mr-1">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)} className="text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          if (!isOpen) setEditingCategory(null); // Clear editing state on close
          setIsFormOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description (Optional)</Label>
                <Textarea
                  id="cat-desc"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-rules">Rules (Optional)</Label>
                <Textarea
                  id="cat-rules"
                  value={editingCategory.rules || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, rules: e.target.value } : null)}
                  placeholder="Enter any specific rules for this category..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-order">Display Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={editingCategory.display_order}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Category'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForumCategoryManager;