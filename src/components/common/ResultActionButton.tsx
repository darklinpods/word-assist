import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'gray' | 'emerald' | 'blue' | 'cta';

const baseClasses =
  'px-3 py-1.5 flex items-center gap-1 text-xs rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark border border-primary shadow-sm',
  gray: 'bg-gray-50 text-text-secondary hover:bg-gray-100 border border-gray-200',
  emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  blue: 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20',
  cta: 'bg-cta text-white hover:bg-cta-hover border border-cta shadow-sm',
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
