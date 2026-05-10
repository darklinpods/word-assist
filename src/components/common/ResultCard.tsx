import { type ReactNode } from 'react';

type Variant = 'card' | 'section';

const variantClasses: Record<Variant, string> = {
  card: 'bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal',
  section: 'mt-5 border-t border-gray-100 pt-4',
};

const joinClassNames = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

interface Props {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: Variant;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  titleTag?: 'h2' | 'h3';
  bodyClassName?: string;
  children: ReactNode;
}

export default function ResultCard({
  title,
  icon,
  actions,
  variant = 'card',
  className,
  headerClassName,
  titleClassName,
  titleTag = 'h2',
  bodyClassName,
  children,
}: Props) {
  const TitleTag = titleTag;
  return (
    <div className={joinClassNames(variantClasses[variant], className)}>
      <div className={joinClassNames('flex justify-between items-center', headerClassName)}>
        <TitleTag className={joinClassNames('flex items-center gap-2 text-sm font-bold text-text-primary font-heading', titleClassName)}>
          {icon}
          {title}
        </TitleTag>
        {actions}
      </div>
      <div className={bodyClassName || 'mt-3'}>{children}</div>
    </div>
  );
}
