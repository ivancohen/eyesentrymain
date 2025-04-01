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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Mail, Lock, User, Globe, Phone, MapPin, Home, Building, Hash, Stethoscope } from "lucide-react";
import { US_STATES } from "@/utils/states";
import logoImage from "@/assets/logo.png";

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
  isLoading: boolean;
}

const AuthForm = ({ type, onSubmit, isLoading }: AuthFormProps) => {
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
    <Card className="w-full max-w-md bg-white shadow-lg border border-gray-100 animate-fade-in">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <img
            src={logoImage}
            alt="EyeSentry Logo"
            className="h-24"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-blue-800">
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
                <Label htmlFor="name" className="flex items-center gap-2 text-blue-700">
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
                  className="input-animation border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-150">
                <Label htmlFor="doctorName" className="flex items-center gap-2 text-blue-700">
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
                  className="input-animation border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-200">
                <Label htmlFor="specialty" className="flex items-center gap-2 text-blue-700">
                  <Stethoscope size={16} />
                  Specialty
                </Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(value) => handleSelectChange('specialty', value)}
                >
                  <SelectTrigger id="specialty" className="input-animation border-blue-200 focus:border-blue-400" disabled={isLoading}>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Family Physician">Family Physician</SelectItem>
                    <SelectItem value="Internist">Internist</SelectItem>
                    <SelectItem value="General Practitioner (GP)">General Practitioner (GP)</SelectItem>
                    <SelectItem value="Primary Care Physician (PCP)">Primary Care Physician (PCP)</SelectItem>
                    <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                    <SelectItem value="Geriatrician">Geriatrician</SelectItem>
                    <SelectItem value="Nurse Practitioner (NP)">Nurse Practitioner (NP)</SelectItem>
                    <SelectItem value="Physician Assistant (PA)">Physician Assistant (PA)</SelectItem>
                    <SelectItem value="Obstetrician/Gynecologist (OB/GYN)">Obstetrician/Gynecologist (OB/GYN)</SelectItem>
                    <SelectItem value="Preventive Medicine Physician">Preventive Medicine Physician</SelectItem>
                    <SelectItem value="Integrative or Lifestyle Medicine Physician">Integrative or Lifestyle Medicine Physician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-250">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-blue-700">
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
                  className="input-animation border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2 animate-slide-up animation-delay-300">
                <Label htmlFor="streetAddress" className="flex items-center gap-2 text-blue-700">
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
                  className="input-animation border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 animate-slide-up animation-delay-325">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2 text-blue-700">
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
                    className="input-animation border-blue-200 focus:border-blue-400"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="flex items-center gap-2 text-blue-700">
                    <MapPin size={16} />
                    State
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleSelectChange("state", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="state" className="input-animation border-blue-200 focus:border-blue-400">
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
                <Label htmlFor="zipCode" className="flex items-center gap-2 text-blue-700">
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
                  className="input-animation w-1/2 border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2 animate-slide-up animation-delay-350">
            <Label htmlFor="email" className="flex items-center gap-2 text-blue-700">
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
              className="input-animation border-blue-200 focus:border-blue-400"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2 animate-slide-up animation-delay-400">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-2 text-blue-700">
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
                className="pr-10 input-animation border-blue-200 focus:border-blue-400"
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
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white"
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

        {/* Google login removed */}
      </CardContent>
    </Card>
  );
};

export default AuthForm;
