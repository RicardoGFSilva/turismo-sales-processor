import React from 'react';

/**
 * Componentes HoloLayer - Design System para Interfaces Espaciais
 * Implementa efeitos de profundidade, interações espaciais e acessibilidade
 */

// ===== PANEL ESPACIAL =====
interface PanelProps {
  children: React.ReactNode;
  state?: 'floating' | 'anchored' | 'pinned' | 'occluded';
  className?: string;
}

export const PanelSpatial: React.FC<PanelProps> = ({
  children,
  state = 'floating',
  className = '',
}) => {
  const stateClasses = {
    floating: 'panel-spatial',
    anchored: 'panel-anchored',
    pinned: 'panel-pinned',
    occluded: 'panel-spatial opacity-50',
  };

  return (
    <div className={`${stateClasses[state]} ${className}`}>
      {children}
    </div>
  );
};

// ===== BOTÃO ESPACIAL =====
interface ButtonSpatialProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ButtonSpatial: React.FC<ButtonSpatialProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'button-spatial',
    secondary: 'button-secondary',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ===== CARD ESPACIAL =====
interface CardSpatialProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const CardSpatial: React.FC<CardSpatialProps> = ({
  children,
  hoverable = true,
  className = '',
}) => {
  return (
    <div
      className={`card ${hoverable ? 'hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// ===== INPUT ESPACIAL =====
interface InputSpatialProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputSpatial: React.FC<InputSpatialProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-spatial-mid">{label}</label>
      )}
      <input
        className={`bg-input border border-border rounded-lg px-4 py-2 focus:border-primary focus:bg-opacity-20 ${className}`}
        {...props}
      />
    </div>
  );
};

// ===== BADGE ESPACIAL =====
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const BadgeSpatial: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
    danger: 'bg-red-500/20 text-red-300',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ===== LOADER ESPACIAL =====
export const LoaderSpatial: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-spatial-far border-t-primary rounded-full animate-spin`}
      role="status"
      aria-label="Carregando..."
    />
  );
};

// ===== TOOLTIP ESPACIAL =====
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipSpatial: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
}) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div className="relative group">
      {children}
      <div
        className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-3 py-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50`}
      >
        {content}
      </div>
    </div>
  );
};

// ===== MODAL ESPACIAL =====
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalSpatial: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-spatial-occlusion backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel-spatial max-w-md w-full mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl font-bold mb-4 text-spatial-near">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
};

// ===== TABS ESPACIAL =====
interface TabsProps {
  tabs: Array<{ label: string; content: React.ReactNode }>;
  defaultTab?: number;
}

export const TabsSpatial: React.FC<TabsProps> = ({
  tabs,
  defaultTab = 0,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  return (
    <div className="w-full">
      <div className="flex border-b border-border gap-2">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === index
                ? 'border-b-2 border-primary text-primary'
                : 'text-spatial-far hover:text-spatial-mid'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 animate-fade-in">{tabs[activeTab].content}</div>
    </div>
  );
};

// ===== PROGRESS BAR ESPACIAL =====
interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
}

export const ProgressSpatial: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = true,
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full">
      <div className="h-2 bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300 glow-spatial"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-spatial-far mt-1">{Math.round(percentage)}%</div>
      )}
    </div>
  );
};

// ===== ALERT ESPACIAL =====
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const AlertSpatial: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
}) => {
  const typeClasses = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <div
      className={`border rounded-lg p-4 ${typeClasses[type]} animate-slide-in-down`}
      role="alert"
    >
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <div className="text-sm">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-current opacity-50 hover:opacity-100"
          aria-label="Fechar alerta"
        >
          ✕
        </button>
      )}
    </div>
  );
};
