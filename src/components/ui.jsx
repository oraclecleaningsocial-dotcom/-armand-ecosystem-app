import {
  Bell, ChevronRight, Cloud, CloudRain, CloudSnow, Dumbbell, Euro,
  HeartPulse, NotebookText, ReceiptText, Salad, ShoppingCart, Sparkles, Sun, Wallet, Wind, Zap
} from 'lucide-react';

const ICONS_BY_NAME = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: Zap,
  snow: CloudSnow,
  wind: Wind,
  salad: Salad,
  cart: ShoppingCart,
  wallet: Wallet,
  euro: Euro,
  dumbbell: Dumbbell,
  heart: HeartPulse,
  note: NotebookText,
  bell: Bell,
  sparkles: Sparkles,
  receipt: ReceiptText
};

export function Icon({ name }) {
  const C = ICONS_BY_NAME[name] || Sparkles;
  return <C size={20} />;
}

export const euro = n => '€' + Number(n || 0).toFixed(2);

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Card({ children, className = '' }) {
  return <div className={'card ' + className}>{children}</div>;
}

export function Widget({ w, onGo }) {
  return (
    <button className="widget" onClick={() => onGo(w.screen)}>
      <div className="widgetIcon">
        <Icon name={w.icon} />
      </div>
      <div className="widgetText">
        <h3>{w.title}</h3>
        <strong>{w.mainValue}</strong>
        <p>{w.description}</p>
      </div>
      <span className="cta">
        {w.actionButton}
        <ChevronRight size={15} />
      </span>
    </button>
  );
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div className="sectionTitle">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
