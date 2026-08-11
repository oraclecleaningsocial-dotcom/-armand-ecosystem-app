import {
  ShoppingCart, Fuel, Home, HeartPulse, ShoppingBag, Popcorn, MoreHorizontal,
  Camera, Search, PieChart, ChevronLeft, Check, Pencil, Plus, Share2, Download,
  X, Loader2, ScanLine, ChevronDown, ChevronRight, StickyNote, Image,
  List, Calendar, Upload, ScanFace, Calculator, MapPin, Phone, FileText, ExternalLink,
  Lock, Unlock, Bell, TrendingUp, Landmark, Briefcase, Trash2, ArrowLeftRight, LayoutGrid,
  Settings, ScanBarcode, ScanSearch, Package, PartyPopper, Square, CheckSquare,
  Ticket, Train, Plane, Music,
} from 'lucide-react'

const ICONS = {
  ShoppingCart, Fuel, Home, HeartPulse, ShoppingBag, Popcorn, MoreHorizontal,
  Camera, Search, PieChart, ChevronLeft, Check, Pencil, Plus, Share2, Download,
  X, Loader2, ScanLine, ChevronDown, ChevronRight, StickyNote, Image,
  List, Calendar, Upload, ScanFace, Calculator, MapPin, Phone, FileText, ExternalLink,
  Lock, Unlock, Bell, TrendingUp, Landmark, Briefcase, Trash2, ArrowLeftRight, LayoutGrid,
  Settings, ScanBarcode, ScanSearch, Package, PartyPopper, Square, CheckSquare,
  Ticket, Train, Plane, Music,
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 2 }) {
  const Cmp = ICONS[name] || MoreHorizontal
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
