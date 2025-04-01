
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface QuestionnaireNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: "next" | "prev") => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const QuestionnaireNavigation = ({
  currentPage,
  totalPages,
  onPageChange,
  onSubmit,
  isSubmitting
}: QuestionnaireNavigationProps) => {
  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={() => onPageChange("prev")}
        disabled={currentPage === 0 || isSubmitting}
        className="flex items-center gap-2 hover-lift border-blue-500 text-blue-500 hover:bg-blue-50"
      >
        <ArrowLeft size={16} /> Previous
      </Button>

      {currentPage < totalPages - 1 ? (
        <Button
          onClick={() => onPageChange("next")}
          disabled={isSubmitting}
          className="flex items-center gap-2 hover-lift"
        >
          Next <ArrowRight size={16} />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 hover-lift"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 border-b-2 border-white rounded-full animate-spin mr-1"></span>
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      )}
    </div>
  );
};

export default QuestionnaireNavigation;
