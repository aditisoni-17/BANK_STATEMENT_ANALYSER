import { useState } from "react";
import { loginUser } from "../auth";
import { useNavigate } from "../router";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.email) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await loginUser({
        email: formData.email,
        password: formData.password,
      });
      navigate("/");
    } catch (error) {
      setApiError(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card-wrap">
        <div className="auth-brand">
          <div className="auth-mark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h1>Bank Statement Analyzer</h1>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {apiError && <div className="auth-error">{apiError}</div>}

            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && <p className="auth-field-error">{errors.email}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
            </div>

            <button type="submit" className="auth-primary-button" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="auth-footer">
              Don't have an account?{" "}
              <button type="button" className="auth-link-button" onClick={() => navigate("/signup")}>
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
