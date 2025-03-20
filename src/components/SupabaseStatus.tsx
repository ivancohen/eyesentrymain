import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const SupabaseStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to get server time - simple query that doesn't require table access
        const { data, error } = await supabase.rpc('get_service_status');
        
        if (error) {
          console.error("Supabase connection error:", error);
          setIsConnected(false);
          toast.error("Failed to connect to Supabase. Please check your credentials.");
        } else {
          setIsConnected(true);
          toast.success("Successfully connected to Supabase!");
        }
      } catch (error) {
        console.error("Unexpected error checking Supabase connection:", error);
        setIsConnected(false);
        toast.error("An unexpected error occurred while connecting to Supabase.");
      }
    };

    checkConnection();
  }, []);

  if (isConnected === null) {
    return <Badge variant="outline" className="animate-pulse">Checking Supabase...</Badge>;
  }

  return (
    <Badge variant={isConnected ? "success" : "destructive"}>
      Supabase: {isConnected ? "Connected" : "Not Connected"}
    </Badge>
  );
};

export default SupabaseStatus;
