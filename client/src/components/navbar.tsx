import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, User, Shield, LogOut, Coins, Trophy } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const goToProfile = () => {
    setLocation("/profile");
  };

  const goToAdmin = () => {
    setLocation("/admin");
  };

  const goHome = () => {
    setLocation("/");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={goHome}>
            <div className="bg-indigo-600 text-white p-2 rounded-lg mr-3">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">QuizMaster</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" onClick={goHome}>
              Accueil
            </Button>
            <Button variant="ghost" onClick={goToProfile}>
              Profil
            </Button>
            {user.role === "admin" && (
              <Button variant="ghost" onClick={goToAdmin}>
                <Shield className="w-4 h-4 mr-2" />
                Administration
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-gray-900">{user.points.toLocaleString()} pts</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-indigo-600 text-white text-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Coins className="w-3 h-3 mr-1" />
                      {user.points} pts
                    </Badge>
                    {user.role === "admin" && (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={goToProfile}>
                  <User className="w-4 h-4 mr-2" />
                  Mon profil
                </DropdownMenuItem>
                
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={goToAdmin}>
                    <Shield className="w-4 h-4 mr-2" />
                    Administration
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
