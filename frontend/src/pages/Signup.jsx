import { useState } from "react";
import { signupUser } from "../auth";
import { useNavigate } from "../router";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

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

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
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
      await signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (error) {
      setApiError(error.message || "Sign up failed");
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
            <h2>Create your account</h2>
            <p>Enter your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {apiError && <div className="auth-error">{apiError}</div>}

            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.name && <p className="auth-field-error">{errors.name}</p>}
            </div>

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
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="auth-primary-button" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <div className="auth-footer">
              Already have an account?{" "}
              <button type="button" className="auth-link-button" onClick={() => navigate("/login")}>
                Log in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
