import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'gray' | 'emerald' | 'blue';

const baseClasses =
  'px-3 py-1.5 flex items-center text-xs rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
  gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200',
  emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
};

const joinClassNames = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export default function ResultActionButton({
  variant = 'gray',
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={joinClassNames(baseClasses, variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
