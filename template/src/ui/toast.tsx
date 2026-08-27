"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/src/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: 
          "border-gray-200 bg-white/95 backdrop-blur-sm text-gray-900 shadow-md " +
          "dark:border-gray-800 dark:bg-gray-950/95 dark:text-gray-100",
        destructive:
          "border-red-200 bg-red-50/95 backdrop-blur-sm text-red-900 shadow-md " +
          "dark:border-red-800 dark:bg-red-950/95 dark:text-red-100",
        success:
          "border-green-200 bg-green-50/95 backdrop-blur-sm text-green-900 shadow-md " +
          "dark:border-green-800 dark:bg-green-950/95 dark:text-green-100",
        warning:
          "border-yellow-200 bg-yellow-50/95 backdrop-blur-sm text-yellow-900 shadow-md " +
          "dark:border-yellow-800 dark:bg-yellow-950/95 dark:text-yellow-100",
        info:
          "border-blue-200 bg-blue-50/95 backdrop-blur-sm text-blue-900 shadow-md " +
          "dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Light mode styles
      "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
      // Dark mode styles
      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600",
      // Destructive variant overrides
      "group-[.destructive]:border-red-200 group-[.destructive]:bg-red-100 group-[.destructive]:text-red-800 group-[.destructive]:hover:bg-red-200 group-[.destructive]:focus:ring-red-500",
      "dark:group-[.destructive]:border-red-800 dark:group-[.destructive]:bg-red-900/50 dark:group-[.destructive]:text-red-200 dark:group-[.destructive]:hover:bg-red-900",
      // Success variant overrides
      "group-[.success]:border-green-200 group-[.success]:bg-green-100 group-[.success]:text-green-800 group-[.success]:hover:bg-green-200 group-[.success]:focus:ring-green-500",
      "dark:group-[.success]:border-green-800 dark:group-[.success]:bg-green-900/50 dark:group-[.success]:text-green-200 dark:group-[.success]:hover:bg-green-900",
      // Warning variant overrides
      "group-[.warning]:border-yellow-200 group-[.warning]:bg-yellow-100 group-[.warning]:text-yellow-800 group-[.warning]:hover:bg-yellow-200 group-[.warning]:focus:ring-yellow-500",
      "dark:group-[.warning]:border-yellow-800 dark:group-[.warning]:bg-yellow-900/50 dark:group-[.warning]:text-yellow-200 dark:group-[.warning]:hover:bg-yellow-900",
      // Info variant overrides
      "group-[.info]:border-blue-200 group-[.info]:bg-blue-100 group-[.info]:text-blue-800 group-[.info]:hover:bg-blue-200 group-[.info]:focus:ring-blue-500",
      "dark:group-[.info]:border-blue-800 dark:group-[.info]:bg-blue-900/50 dark:group-[.info]:text-blue-200 dark:group-[.info]:hover:bg-blue-900",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
      // Light mode styles
      "text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-400",
      // Dark mode styles
      "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 dark:focus:ring-gray-600",
      // Destructive variant
      "group-[.destructive]:text-red-600 group-[.destructive]:hover:text-red-900 group-[.destructive]:hover:bg-red-100 group-[.destructive]:focus:ring-red-500",
      "dark:group-[.destructive]:text-red-400 dark:group-[.destructive]:hover:text-red-100 dark:group-[.destructive]:hover:bg-red-900/50",
      // Success variant
      "group-[.success]:text-green-600 group-[.success]:hover:text-green-900 group-[.success]:hover:bg-green-100 group-[.success]:focus:ring-green-500",
      "dark:group-[.success]:text-green-400 dark:group-[.success]:hover:text-green-100 dark:group-[.success]:hover:bg-green-900/50",
      // Warning variant
      "group-[.warning]:text-yellow-600 group-[.warning]:hover:text-yellow-900 group-[.warning]:hover:bg-yellow-100 group-[.warning]:focus:ring-yellow-500",
      "dark:group-[.warning]:text-yellow-400 dark:group-[.warning]:hover:text-yellow-100 dark:group-[.warning]:hover:bg-yellow-900/50",
      // Info variant
      "group-[.info]:text-blue-600 group-[.info]:hover:text-blue-900 group-[.info]:hover:bg-blue-100 group-[.info]:focus:ring-blue-500",
      "dark:group-[.info]:text-blue-400 dark:group-[.info]:hover:text-blue-100 dark:group-[.info]:hover:bg-blue-900/50",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold tracking-tight",
      "text-gray-900 dark:text-gray-100",
      className
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-sm opacity-90",
      "text-gray-600 dark:text-gray-400",
      className
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};