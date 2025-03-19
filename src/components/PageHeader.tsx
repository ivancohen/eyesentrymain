
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon: ReactNode;
  description?: string;
  iconDescription?: ReactNode;
}

const PageHeader = ({ title, icon, description, iconDescription }: PageHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center gap-2">
        {icon}
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground animate-slide-up animation-delay-100">
          {iconDescription && (
            <span className="inline-flex items-center gap-1">
              {iconDescription}
            </span>
          )}
          {description}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
