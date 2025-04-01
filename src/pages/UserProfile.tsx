import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Key, Calendar, UserCircle, Phone, Home, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    joined: "January 2023",
    doctorName: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    address: "", // Keep for backward compatibility
    specialty: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load profile data
    setIsLoading(true);
    
    // Map user data to profile form
    setProfileData({
      name: user.name || "",
      email: user.email || "",
      joined: "January 2023", // Mock data
      doctorName: user.doctorName || "",
      phoneNumber: user.phoneNumber || "",
      streetAddress: user.streetAddress || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      address: user.address || "", // Keep for backward compatibility
      specialty: user.specialty || "",
    });
    
    setIsLoading(false);
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          doctorName: profileData.doctorName,
          phoneNumber: profileData.phoneNumber,
          streetAddress: profileData.streetAddress,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          address: `${profileData.streetAddress}, ${profileData.city}, ${profileData.state} ${profileData.zipCode}`,
          specialty: profileData.specialty,
        }
      });
      
      if (error) throw error;
      
      // Update profile in profiles table if available
      if (user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            name: profileData.name,
            street_address: profileData.streetAddress,
            city: profileData.city,
            state: profileData.state,
            zip_code: profileData.zipCode,
            address: `${profileData.streetAddress}, ${profileData.city}, ${profileData.state} ${profileData.zipCode}`
          })
          .eq('id', user.id);
          
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="min-h-screen flex flex-col questionnaire-bg">
      <Navbar />
      <main className="flex-1 container px-6 py-6 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center justify-center gap-2">
            <UserCircle size={20} />
            User Profile
          </h1>
          <p className="text-muted-foreground animate-slide-up animation-delay-100">
            View and manage your account information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="ml-3 text-blue-700">Loading profile...</span>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User size={16} />
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="input-animation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      className="input-animation"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doctorName" className="flex items-center gap-2">
                      <UserCircle size={16} />
                      Doctor Name
                    </Label>
                    <Input
                      id="doctorName"
                      value={profileData.doctorName}
                      onChange={(e) => setProfileData({ ...profileData, doctorName: e.target.value })}
                      className="input-animation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone size={16} />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      className="input-animation"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress" className="flex items-center gap-2">
                        <Home size={16} />
                        Street Address
                      </Label>
                      <Input
                        id="streetAddress"
                        value={profileData.streetAddress}
                        onChange={(e) => setProfileData({ ...profileData, streetAddress: e.target.value })}
                        className="input-animation"
                        placeholder="123 Main St"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="flex items-center gap-2">
                          <Home size={16} />
                          City
                        </Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          className="input-animation"
                          placeholder="New York"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state" className="flex items-center gap-2">
                          <Home size={16} />
                          State
                        </Label>
                        <Input
                          id="state"
                          value={profileData.state}
                          onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                          className="input-animation"
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="flex items-center gap-2">
                        <Home size={16} />
                        ZIP Code
                      </Label>
                      <Input
                        id="zipCode"
                        value={profileData.zipCode}
                        onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                        className="input-animation w-1/2"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty" className="flex items-center gap-2">
                      <Stethoscope size={16} />
                      Specialty
                    </Label>
                    <Input
                      id="specialty"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                      className="input-animation"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="hover-lift">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={18} />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full hover-lift"
                    onClick={() => navigate("/reset-password")}
                  >
                    Change Password
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You will be sent a password reset email
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={18} />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">{profileData.joined}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <span className="font-medium">
                    {user.isAdmin ? (
                      <span className="text-primary">Administrator</span>
                    ) : (
                      <span>Standard User</span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
