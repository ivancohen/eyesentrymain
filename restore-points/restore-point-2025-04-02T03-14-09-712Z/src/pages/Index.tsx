import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logoImage from '@/assets/logo.png';
import eyeImage from '@/assets/eye-image.png';

const Index = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <img
              src={logoImage}
              alt="EyeSentry Logo"
              className="h-24 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold mb-4">Welcome Back, Dr. {user.name || 'User'}</h1>
            <p className="text-gray-600 mb-6">
              You are already signed in to the EyeSentry Glaucoma Risk Assessment Portal.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-blue-500 text-white py-16 px-4 flex-1 flex items-center">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              {/* Eye image above the Glaucoma Risk Assessment Portal text */}
              <div className="mx-auto lg:mx-0 mb-4">
                <div className="relative bg-white rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto lg:mx-4" style={{ width: '320px', height: '320px' }}>
                  <img
                    src={eyeImage}
                    alt="Eye Close-up"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Glaucoma Risk Assessment Portal
              </h1>
              <p className="text-xl opacity-90 max-w-lg mx-auto lg:mx-0">
                A clinical tool for healthcare professionals to assess and manage patient glaucoma risk factors.
              </p>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md p-6 bg-white text-gray-900">
                {/* Logo inside the doctor access box */}
                <div className="flex justify-center mb-6">
                  <img
                    src={logoImage}
                    alt="EyeSentry Logo"
                    className="h-32" // 30% bigger than original h-24
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Doctor Access</h2>
                    <p className="text-gray-600">Sign in or register to access the assessment portal</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Link to="/login" className="w-full">
                      <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2">
                        <LogIn className="h-5 w-5" />
                        Sign In
                      </Button>
                    </Link>
                    
                    <Link to="/register" className="w-full">
                      <Button size="lg" variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Register New Account
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="text-center text-sm text-gray-500">
                    <p>For healthcare professionals only</p>
                    <p>Registration requires verification</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Minimal */}
      <section className="bg-white py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-2xl font-bold mb-8 text-blue-800">EyeSentry Assessment Portal Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Standardized Assessment</h3>
              <p className="text-gray-600">
                Evidence-based questionnaire for consistent glaucoma risk evaluation
              </p>
            </div>
            
            <div>
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Analysis</h3>
              <p className="text-gray-600">
                Automated scoring and risk level determination for each patient
              </p>
            </div>
            
            <div>
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Patient Management</h3>
              <p className="text-gray-600">
                Comprehensive patient records and assessment history tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cyan-50 py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img
                src={logoImage}
                alt="EyeSentry Logo"
                className="h-16"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-600">
                &copy; {new Date().getFullYear()} EyeSentry. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                A clinical tool for healthcare professionals
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
