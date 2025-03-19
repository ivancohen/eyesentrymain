
interface QuestionnaireProgressProps {
  currentPage: number;
  totalPages: number;
}

const QuestionnaireProgress = ({ currentPage, totalPages }: QuestionnaireProgressProps) => {
  const getPageTitle = (page: number): string => {
    switch (page) {
      case 0: return "Basic Information";
      case 1: return "Medical History";
      case 2: return "Clinical Measurements";
      default: return "";
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">
          Page {currentPage + 1} of {totalPages}
        </span>
        <span className="text-sm text-muted-foreground">
          {getPageTitle(currentPage)}
        </span>
      </div>
      <div className="w-full bg-secondary h-2 rounded-full">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuestionnaireProgress;
