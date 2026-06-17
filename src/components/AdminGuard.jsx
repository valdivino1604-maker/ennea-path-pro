import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const ADMIN_ID = "6a31ede4977440ad85d90422"; // Valdivino

export default function AdminGuard({ children }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.id !== ADMIN_ID) {
    return <Navigate to="/" replace />;
  }

  return children;
}