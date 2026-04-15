import { useEffect } from "react";
import { navigateTo } from "../router";

function ProtectedRoute({ children, isAuthenticated, isLoading }) {
  const shouldRedirect = !isLoading && !isAuthenticated;

  useEffect(() => {
    if (shouldRedirect) {
      navigateTo("/login");
    }
  }, [shouldRedirect]);

  if (isLoading || shouldRedirect) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
