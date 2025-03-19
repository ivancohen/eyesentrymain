
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  // Get size classes based on size prop
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4'
  };
  
  return (
    <div className={`inline-block ${className}`}>
      <div className={`${sizeClasses[size]} border-primary/30 border-t-primary rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;
