import { forwardRef } from "react";
import clsx from "clsx";

const baseStyles = "btn";

const variants = {
  primary: "btn-primary",
  accent: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  dangerSubtle: "btn-danger-subtle",
};

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  fullWidth = false, 
  children, 
  ...props 
}, ref) => {
  const isDarkMode = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  
  const sizeClasses =
    size === "sm"
      ? "btn-sm"
      : size === "lg"
      ? "btn-lg"
      : size === "iconSm"
      ? "btn-icon-sm"
      : size === "iconLg"
      ? "btn-icon-lg"
      : size === "icon"
      ? "btn-icon"
      : "btn-md"; // md default

  const variantClass = variants[variant];

  return (
    <button
      ref={ref}
      className={clsx(baseStyles, variantClass, sizeClasses, fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
