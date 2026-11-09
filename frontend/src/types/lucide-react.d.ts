/**
 * Typed icon declarations for lucide-react. This keeps app code fully typed
 * when the installed package archive omits its bundled declaration file.
 */
declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<
    SVGProps<SVGSVGElement> & {
      size?: string | number;
      color?: string;
      strokeWidth?: string | number;
    }
  >;

  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUpLeft: LucideIcon;
  export const ArrowDownLeft: LucideIcon;
  export const BadgePercent: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const Headphones: LucideIcon;
  export const House: LucideIcon;
  export const Heart: LucideIcon;
  export const Laptop: LucideIcon;
  export const Menu: LucideIcon;
  export const PackageCheck: LucideIcon;
  export const PackagePlus: LucideIcon;
  export const Package: LucideIcon;
  export const Search: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const Truck: LucideIcon;
  export const UserRound: LucideIcon;
  export const Watch: LucideIcon;
  export const X: LucideIcon;
  export const Minus: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const LockKeyhole: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Users: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const CircleDollarSign: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const LoaderCircle: LucideIcon;
  export const LogOut: LucideIcon;
  export const Save: LucideIcon;
  export const Zap: LucideIcon;
}
