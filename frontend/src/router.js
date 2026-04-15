import { useCallback, useEffect, useState } from "react";

export function normalizePath(pathname) {
  if (!pathname) return "/";
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
}

export function navigateTo(path) {
  const target = normalizePath(path);
  if (normalizePath(window.location.pathname) !== target) {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function useNavigate() {
  return useCallback((path) => {
    navigateTo(path);
  }, []);
}

export function usePathname() {
  const [pathname, setPathname] = useState(normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
}
