import {
  ShoppingCart, Fuel, Home, HeartPulse, ShoppingBag, Popcorn, MoreHorizontal,
  Camera, Search, PieChart, ChevronLeft, Check, Pencil, Plus, Share2, Download,
  X, Loader2, ScanLine, ChevronDown, ChevronRight, StickyNote, Image,
  List, Calendar, Upload, ScanFace, Calculator,
} from 'lucide-react'

const ICONS = {
  ShoppingCart, Fuel, Home, HeartPulse, ShoppingBag, Popcorn, MoreHorizontal,
  Camera, Search, PieChart, ChevronLeft, Check, Pencil, Plus, Share2, Download,
  X, Loader2, ScanLine, ChevronDown, ChevronRight, StickyNote, Image,
  List, Calendar, Upload, ScanFace, Calculator,
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 2 }) {
  const Cmp = ICONS[name] || MoreHorizontal
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
