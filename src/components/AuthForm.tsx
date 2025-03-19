
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Mail, Lock, User, Globe, Phone, MapPin, Home, Building, Hash, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { US_STATES } from "@/utils/states";

interface FormData {
  email: string;
  password: string;
  name: string;
  doctorName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  specialty: string;
}

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: FormData) => void;
  onGoogleLogin?: () => void;
  isLoading: boolean;
}

const AuthForm = ({ type, onSubmit, onGoogleLogin, isLoading }: AuthFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    doctorName: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    specialty: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md glass-panel animate-fade-in">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {type === "login" ? "Sign in" : "Create a Practice Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {type === "login"
            ? "Enter your credentials to access your account"
            : "Fill in your practice details to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "register" && (
            <>
              <div className="space-y-2 animate-slide-up animation-delay-100">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User size={16} />
                  Practice Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Eye Care Associates"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-animation"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-150">
                <Label htmlFor="doctorName" className="flex items-center gap-2">
                  <Stethoscope size={16} />
                  Doctor's Name
                </Label>
                <Input
                  id="doctorName"
                  name="doctorName"
                  placeholder="Dr. Jane Smith"
                  value={formData.doctorName}
                  onChange={handleChange}
                  required
                  className="input-animation"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-200">
                <Label htmlFor="specialty" className="flex items-center gap-2">
                  <Stethoscope size={16} />
                  Specialty
                </Label>
                <Input
                  id="specialty"
                  name="specialty"
                  placeholder="Ophthalmology"
                  value={formData.specialty}
                  onChange={handleChange}
                  required
                  className="input-animation"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-250">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone size={16} />
                  Office Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="(555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="input-animation"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-300">
                <Label htmlFor="streetAddress" className="flex items-center gap-2">
                  <Home size={16} />
                  Street Address
                </Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  placeholder="123 Medical Center Dr"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  required
                  className="input-animation"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 animate-slide-up animation-delay-325">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <Building size={16} />
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="input-animation"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="flex items-center gap-2">
                    <MapPin size={16} />
                    State
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleSelectChange("state", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="state" className="input-animation">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 animate-slide-up animation-delay-350">
                <Label htmlFor="zipCode" className="flex items-center gap-2">
                  <Hash size={16} />
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="input-animation w-1/2"
                  disabled={isLoading}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2 animate-slide-up animation-delay-350">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={16} />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-animation"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2 animate-slide-up animation-delay-400">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock size={16} />
                Password
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="pr-10 input-animation"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full mt-6 hover-lift"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
                <span className="ml-2">
                  {type === "login" ? "Signing in..." : "Creating account..."}
                </span>
              </div>
            ) : type === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {type === "login" && onGoogleLogin && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2" 
              onClick={onGoogleLogin}
              disabled={isLoading}
            >
              <Globe size={16} />
              <span>Google</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthForm;
