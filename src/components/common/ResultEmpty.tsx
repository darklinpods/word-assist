import { type ReactNode } from 'react';

const joinClassNames = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

interface Props {
  children: ReactNode;
  className?: string;
}

export default function ResultEmpty({ children, className }: Props) {
  return (
    <div
      className={joinClassNames(
        'text-[13px] text-gray-500 bg-white p-4 rounded-lg border border-gray-200 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
