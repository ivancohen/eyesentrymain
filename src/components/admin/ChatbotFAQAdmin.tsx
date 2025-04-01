import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

const CATEGORIES = [
  "Questionnaire",
  "Eye Pressure",
  "Steroids",
  "Equipment",
  "Diagnosis",
  "Treatment",
  "General"
];

const ChatbotFAQAdmin: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState<Omit<FAQ, 'id'>>({
    question: '',
    answer: '',
    category_id: 'General'
  });

  // Fetch FAQs from the database
  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chatbot_faqs')
        .select('*');
      if (filterCategory && filterCategory !== 'all') {
        query = query.eq('category_id', filterCategory);
      }
      
      // Use category_id for ordering
      const { data, error } = await query.order('category_id', { ascending: true });
      if (error) {
        console.error("Error fetching FAQs:", error);
        toast.error("Failed to load FAQ data");
        return;
      }
      
      setFaqs(data || []);
    } catch (error) {
      console.error("Error in fetchFaqs:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [filterCategory]);

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category_id: 'General'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value }));
  };

  const handleAdd = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id
    });
    setEditingId(faq.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      if (isAdding) {
        // Create new FAQ
        const { data, error } = await supabase
          .from('chatbot_faqs')
          .insert([formData])
          .select();
        
        if (error) {
          console.error("Error adding FAQ:", error);
          toast.error("Failed to add FAQ");
          return;
        }
        
        toast.success("FAQ added successfully");
      } else if (editingId) {
        // Update existing FAQ
        const { error } = await supabase
          .from('chatbot_faqs')
          .update(formData)
          .eq('id', editingId);
        
        if (error) {
          console.error("Error updating FAQ:", error);
          toast.error("Failed to update FAQ");
          return;
        }
        
        toast.success("FAQ updated successfully");
      }
      
      resetForm();
      fetchFaqs();
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chatbot_faqs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting FAQ:", error);
        toast.error("Failed to delete FAQ");
        return;
      }
      
      toast.success("FAQ deleted successfully");
      fetchFaqs();
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const filteredFaqs = faqs.filter(faq => {
    const searchMatch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Chatbot FAQ Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>

          {(isAdding || editingId) && (
            <Card className="mb-6 border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select
                      value={formData.category_id}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question</label>
                    <Input
                      name="question"
                      value={formData.question}
                      onChange={handleInputChange}
                      placeholder="Enter question"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Answer</label>
                    <Textarea
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      placeholder="Enter answer"
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-4">Loading FAQs...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-4">No FAQs found</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Category</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="font-medium">{faq.category_id}</TableCell>
                      <TableCell>{faq.question}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(faq)}
                            className="h-8 w-8 text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(faq.id)}
                            className="h-8 w-8 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotFAQAdmin;