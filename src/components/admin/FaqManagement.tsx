import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash, Edit, Plus, Search, FileQuestion } from 'lucide-react';
import { faqService, FaqCategory, Faq } from '@/services/FaqService';
import { toast } from 'sonner';

export const FaqManagement = () => {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredFaqs, setFilteredFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Form states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState<boolean>(false);
  const [isAddFaqOpen, setIsAddFaqOpen] = useState<boolean>(false);
  const [isEditFaqOpen, setIsEditFaqOpen] = useState<boolean>(false);
  
  const [categoryForm, setCategoryForm] = useState<Partial<FaqCategory>>({
    name: '',
    description: '',
    isActive: true
  });
  
  const [faqForm, setFaqForm] = useState<Partial<Faq>>({
    categoryId: '',
    question: '',
    answer: '',
    priority: 0,
    isActive: true
  });
  
  const [editingCategoryId, setEditingCategoryId] = useState<string>('');
  const [editingFaqId, setEditingFaqId] = useState<string>('');
  
  // Load categories and FAQs
  useEffect(() => {
    loadCategories();
    loadAllFaqs();
  }, []);
  
  // Filter FAQs when search query or selected category changes
  useEffect(() => {
    filterFaqs();
  }, [searchQuery, selectedCategory, faqs]);
  
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesData = await faqService.getCategories();
      setCategories(categoriesData);
      
      // Select the first category by default if none is selected
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load FAQ categories");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadAllFaqs = async () => {
    setIsLoading(true);
    try {
      const faqsData = await faqService.getAllFaqs();
      setFaqs(faqsData);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      toast.error("Failed to load FAQs");
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterFaqs = () => {
    let filtered = [...faqs];
    
    // Filter by category if selected and not "all"
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.categoryId === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredFaqs(filtered);
  };
  
  // Category CRUD operations
  const handleAddCategory = async () => {
    try {
      if (!categoryForm.name) {
        toast.error("Category name is required");
        return;
      }
      
      const newCategory = await faqService.createCategory({
        name: categoryForm.name || '',
        description: categoryForm.description || '',
        isActive: categoryForm.isActive !== false
      });
      
      if (newCategory) {
        toast.success("Category added successfully");
        setCategories([...categories, newCategory]);
        setCategoryForm({ name: '', description: '', isActive: true });
        setIsAddCategoryOpen(false);
      } else {
        toast.error("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };
  
  const handleEditCategory = async () => {
    try {
      if (!categoryForm.name) {
        toast.error("Category name is required");
        return;
      }
      
      const success = await faqService.updateCategory(editingCategoryId, categoryForm);
      
      if (success) {
        toast.success("Category updated successfully");
        
        // Update the categories list
        setCategories(categories.map(cat => 
          cat.id === editingCategoryId 
            ? { ...cat, ...categoryForm, id: cat.id } 
            : cat
        ));
        
        setCategoryForm({ name: '', description: '', isActive: true });
        setIsEditCategoryOpen(false);
      } else {
        toast.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All associated FAQs will also be deleted.")) {
      return;
    }
    
    try {
      const success = await faqService.deleteCategory(id);
      
      if (success) {
        toast.success("Category deleted successfully");
        
        // Remove the category from the list
        setCategories(categories.filter(cat => cat.id !== id));
        
        // Remove associated FAQs
        setFaqs(faqs.filter(faq => faq.categoryId !== id));
        
        // If the deleted category was selected, select another one
        if (selectedCategory === id) {
          const remainingCategories = categories.filter(cat => cat.id !== id);
          setSelectedCategory(remainingCategories.length > 0 ? remainingCategories[0].id : '');
        }
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };
  
  // FAQ CRUD operations
  const handleAddFaq = async () => {
    try {
      if (!faqForm.question || !faqForm.answer || !faqForm.categoryId) {
        toast.error("Question, answer, and category are required");
        return;
      }
      
      const newFaq = await faqService.createFaq({
        categoryId: faqForm.categoryId || '',
        question: faqForm.question || '',
        answer: faqForm.answer || '',
        priority: faqForm.priority || 0,
        isActive: faqForm.isActive !== false
      });
      
      if (newFaq) {
        toast.success("FAQ added successfully");
        setFaqs([...faqs, newFaq]);
        setFaqForm({ 
          categoryId: selectedCategory, 
          question: '', 
          answer: '', 
          priority: 0, 
          isActive: true 
        });
        setIsAddFaqOpen(false);
      } else {
        toast.error("Failed to add FAQ");
      }
    } catch (error) {
      console.error("Error adding FAQ:", error);
      toast.error("Failed to add FAQ");
    }
  };
  
  const handleEditFaq = async () => {
    try {
      if (!faqForm.question || !faqForm.answer || !faqForm.categoryId) {
        toast.error("Question, answer, and category are required");
        return;
      }
      
      const success = await faqService.updateFaq(editingFaqId, faqForm);
      
      if (success) {
        toast.success("FAQ updated successfully");
        
        // Update the FAQs list
        setFaqs(faqs.map(faq => 
          faq.id === editingFaqId 
            ? { 
                ...faq, 
                ...faqForm, 
                id: faq.id,
                category: categories.find(c => c.id === faqForm.categoryId)?.name || faq.category
              } 
            : faq
        ));
        
        setFaqForm({ 
          categoryId: selectedCategory, 
          question: '', 
          answer: '', 
          priority: 0, 
          isActive: true 
        });
        setIsEditFaqOpen(false);
      } else {
        toast.error("Failed to update FAQ");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    }
  };
  
  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }
    
    try {
      const success = await faqService.deleteFaq(id);
      
      if (success) {
        toast.success("FAQ deleted successfully");
        
        // Remove the FAQ from the list
        setFaqs(faqs.filter(faq => faq.id !== id));
      } else {
        toast.error("Failed to delete FAQ");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };
  
  // Open edit dialogs with pre-filled data
  const openEditCategory = (category: FaqCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    setEditingCategoryId(category.id);
    setIsEditCategoryOpen(true);
  };
  
  const openEditFaq = (faq: Faq) => {
    setFaqForm({
      categoryId: faq.categoryId,
      question: faq.question,
      answer: faq.answer,
      priority: faq.priority,
      isActive: faq.isActive
    });
    setEditingFaqId(faq.id);
    setIsEditFaqOpen(true);
  };
  
  const openAddFaq = () => {
    setFaqForm({ 
      categoryId: selectedCategory, 
      question: '', 
      answer: '', 
      priority: 0, 
      isActive: true 
    });
    setIsAddFaqOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        {/* FAQs Tab */}
        <TabsContent value="faqs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Frequently Asked Questions</CardTitle>
              <div className="flex space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={openAddFaq}>
                  <Plus className="mr-2 h-4 w-4" /> Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {isLoading ? "Loading FAQs..." : "No FAQs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium">{faq.question}</TableCell>
                        <TableCell>{faq.category}</TableCell>
                        <TableCell>{faq.priority}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${faq.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditFaq(faq)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFaq(faq.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FAQ Categories</CardTitle>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {isLoading ? "Loading categories..." : "No categories found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FAQ Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isActive"
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                />
                <Label htmlFor="isActive">{categoryForm.isActive ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-isActive"
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">{categoryForm.isActive ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditCategory}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add FAQ Dialog */}
      <Dialog open={isAddFaqOpen} onOpenChange={setIsAddFaqOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select 
                value={faqForm.categoryId} 
                onValueChange={(value) => setFaqForm({ ...faqForm, categoryId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Question
              </Label>
              <Input
                id="question"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="answer" className="text-right pt-2">
                Answer
              </Label>
              <Textarea
                id="answer"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="col-span-3 min-h-[150px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Input
                id="priority"
                type="number"
                value={faqForm.priority}
                onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="faq-isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="faq-isActive"
                  checked={faqForm.isActive}
                  onCheckedChange={(checked) => setFaqForm({ ...faqForm, isActive: checked })}
                />
                <Label htmlFor="faq-isActive">{faqForm.isActive ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddFaq}>Add FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit FAQ Dialog */}
      <Dialog open={isEditFaqOpen} onOpenChange={setIsEditFaqOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select 
                value={faqForm.categoryId} 
                onValueChange={(value) => setFaqForm({ ...faqForm, categoryId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-question" className="text-right">
                Question
              </Label>
              <Input
                id="edit-question"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-answer" className="text-right pt-2">
                Answer
              </Label>
              <Textarea
                id="edit-answer"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="col-span-3 min-h-[150px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-priority" className="text-right">
                Priority
              </Label>
              <Input
                id="edit-priority"
                type="number"
                value={faqForm.priority}
                onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-faq-isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-faq-isActive"
                  checked={faqForm.isActive}
                  onCheckedChange={(checked) => setFaqForm({ ...faqForm, isActive: checked })}
                />
                <Label htmlFor="edit-faq-isActive">{faqForm.isActive ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditFaq}>Update FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqManagement;