import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

const Button = React.forwardRef(({
    className = '',
    variant = 'default',
    size = 'default',
    children,
    loading = false,
    iconName = null,
    iconPosition = 'left',
    iconSize = null,
    fullWidth = false,
    disabled = false,
    onClick,
    ...props
}, ref) => {
    // Base classes
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    // Variant classes
    const variantClasses = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
        secondary: "bg-gray-600 text-white hover:bg-gray-700",
        ghost: "text-white hover:bg-white/10",
        link: "text-blue-400 underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
    };
    
    // Size classes
    const sizeClasses = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xs: "h-8 rounded-md px-2 text-xs",
        xl: "h-12 rounded-md px-10 text-base",
    };

    // Icon size mapping based on button size
    const iconSizeMap = {
        xs: 12,
        sm: 14,
        default: 16,
        lg: 18,
        xl: 20,
        icon: 16,
    };

    const calculatedIconSize = iconSize || iconSizeMap[size] || 16;

    // Loading spinner
    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );

    // Icon rendering
    const renderIcon = () => {
        if (!iconName) return null;

        const iconMap = {
            RefreshCw: RefreshCw,
            Plus: Plus
        };

        const IconComponent = iconMap[iconName];
        if (!IconComponent) return null;

        return (
            <IconComponent
                size={calculatedIconSize}
                className={`${children && iconPosition === 'left' ? 'mr-2' : ''} ${children && iconPosition === 'right' ? 'ml-2' : ''}`}
            />
        );
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${fullWidth ? 'w-full' : ''} ${className}`;

    return (
        <button
            className={combinedClasses}
            ref={ref}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {iconName && iconPosition === 'left' && renderIcon()}
            {children}
            {iconName && iconPosition === 'right' && renderIcon()}
        </button>
    );
});

Button.displayName = "Button";

export default Button;
