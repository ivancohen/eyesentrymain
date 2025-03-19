import { useState, useEffect } from "react";
import { FixedAdminService, QuestionScore } from "@/services/FixedAdminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileQuestion, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const QuestionManager = () => {
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingScore, setEditingScore] = useState<{
    id: string;
    questionId: string;
    optionId?: string;
    question: string;
    optionText?: string;
    score: number;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadQuestionScores();
  }, []);

  const loadQuestionScores = async () => {
    setIsLoading(true);
    try {
      const scores = await FixedAdminService.fetchQuestionScores();
      setQuestionScores(scores);
    } catch (error) {
      console.error("Error loading question scores:", error);
      toast.error("Failed to load question scores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditScore = (score: QuestionScore) => {
    setEditingScore({
      id: score.id + (score.option_id ? `-${score.option_id}` : ''), // Unique ID for the row
      questionId: score.id,
      optionId: score.option_id,
      question: score.question,
      optionText: score.option_text,
      score: score.score
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveScore = async () => {
    if (!editingScore) return;

    try {
      setIsLoading(true);
      
      const success = await FixedAdminService.updateQuestionScore(
        editingScore.questionId,
        editingScore.optionId,
        editingScore.score
      );
      
      if (success) {
        // Update local state
        setQuestionScores(current => 
          current.map(item => {
            if (
              item.id === editingScore.questionId && 
              item.option_id === editingScore.optionId
            ) {
              return {
                ...item,
                score: editingScore.score
              };
            }
            return item;
          })
        );
        
        setIsEditDialogOpen(false);
        toast.success("Question score updated successfully");
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter questions based on search term
  const filteredScores = questionScores.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.question.toLowerCase().includes(searchLower) ||
      item.question_type.toLowerCase().includes(searchLower) ||
      (item.option_text && item.option_text.toLowerCase().includes(searchLower))
    );
  });

  const getQuestionTypeBadge = (type: string) => {
    let className = "";
    
    switch(type.toLowerCase()) {
      case "dropdown":
        className = "bg-purple-50 text-purple-700 border-purple-200";
        break;
      case "checkbox":
        className = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "radio":
        className = "bg-green-50 text-green-700 border-green-200";
        break;
      case "conditional":
        className = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      default:
        className = "bg-gray-50 text-gray-700 border-gray-200";
    }
    
    return (
      <Badge variant="outline" className={className}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileQuestion size={20} />
          <h2 className="text-xl font-semibold">Question Scoring</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-animation"
            />
          </div>
          <Button 
            onClick={loadQuestionScores} 
            variant="outline" 
            className="hover-lift"
            disabled={isLoading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Question Scores</CardTitle>
          <CardDescription>
            Manage scoring for each question and response option
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Option</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.length > 0 ? (
                    filteredScores.map((score) => (
                      <TableRow 
                        key={score.id + (score.option_id || '')} 
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {score.question}
                        </TableCell>
                        <TableCell>
                          {getQuestionTypeBadge(score.question_type)}
                        </TableCell>
                        <TableCell>
                          {score.option_text || "—"}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          <Badge variant="secondary">
                            {score.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScore(score)}
                            className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                          >
                            <Pencil size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        {searchTerm 
                          ? "No matching questions found" 
                          : "No questions available"
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Score Dialog */}
      {editingScore && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Question Score</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <Label className="text-muted-foreground">Question</Label>
                <p className="font-medium">{editingScore.question}</p>
              </div>
              
              {editingScore.optionText && (
                <div className="mb-4">
                  <Label className="text-muted-foreground">Option</Label>
                  <p className="font-medium">{editingScore.optionText}</p>
                </div>
              )}
              
              <div className="mb-4">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={editingScore.score}
                  onChange={(e) => setEditingScore(prev => 
                    prev ? {...prev, score: parseInt(e.target.value) || 0} : null
                  )}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveScore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QuestionManager;
