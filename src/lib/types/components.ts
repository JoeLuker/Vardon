// /src/lib/types/components.ts
export interface ResourceTrackerProps {
	label: string;
	total: number;
	used: number;
	onToggle: (remaining: number) => void;
  }
  
  export interface StatInputProps {
	value: number;
	label?: string;
	min?: number;
	max?: number;
	className?: string;
  }
  
  export interface NavItem {
	href: string;
	text: string;
  }
  
  export interface ClassData {
	level: number;
	bab: number;
	fort: number;
	ref: number;
	will: number;
	special: string[];
	spellsPerDay: Record<number, number>;
  }