import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Info } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FieldCondition {
  dependsOn: string;
  showIf: (value: any) => boolean;
}

export interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "select";
  required?: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
  condition?: FieldCondition;
}

interface DataFormProps {
  title: string;
  fields: Field[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onChange?: (key: string, value: any) => void;
}

const DataForm = ({
  title,
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  onChange
}: DataFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Initialize form with provided data or empty values
    const initialFormData: Record<string, any> = {};
    fields.forEach((field) => {
      initialFormData[field.key] = initialData[field.key] || "";
    });
    setFormData(initialFormData);
  }, [initialData, fields]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    
    // Notify parent component if onChange handler is provided
    if (onChange) {
      onChange(key, value);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    handleChange(
      name, 
      type === "number" ? (value === "" ? "" : Number(value)) : value
    );
  };

  const handleSelectChange = (key: string, value: string) => {
    handleChange(key, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFieldVisible = (field: Field): boolean => {
    if (!field.condition) return true;
    
    const { dependsOn, showIf } = field.condition;
    const dependentValue = formData[dependsOn];
    return showIf(dependentValue);
  };

  return (
    <Card className="w-full max-w-xl glass-panel animate-fade-in">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="absolute right-4 top-4 hover:bg-secondary/80 h-8 w-8"
        >
          <X size={16} />
        </Button>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <Separator />
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 pb-2">
          <div className="grid gap-5">
            {fields.map((field, index) => 
              isFieldVisible(field) && (
                <div key={field.key} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.helpText && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                              <Info size={14} className="text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{field.helpText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {field.type === 'select' ? (
                    <Select
                      value={formData[field.key] || ''}
                      onValueChange={(value) => handleSelectChange(field.key, value)}
                    >
                      <SelectTrigger className="mt-1.5 input-animation">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      name={field.key}
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      className="mt-1.5 input-animation"
                    />
                  )}
                </div>
              )
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="hover-lift">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DataForm;
