import { useEffect, useState } from "react";

interface FloatingObject {
  id: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  opacity: number;
}

const baseSvgProps: React.SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Icons = [
  (props) => (
    <svg {...baseSvgProps} {...props} aria-hidden>
      <title>Dollar</title>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  (props) => (
    <svg {...baseSvgProps} {...props} aria-hidden>
      <title>Credit card</title>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  (props) => (
    <svg {...baseSvgProps} {...props} aria-hidden>
      <title>Chart</title>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  (props) => (
    <svg {...baseSvgProps} {...props} aria-hidden>
      <title>User</title>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9.5a3 3 0 0 0-5 0" />
      <path d="M14.5 14.5a3 3 0 0 1-5 0" />
    </svg>
  ),
] satisfies React.FC<React.SVGProps<SVGSVGElement>>[];

function generateElements(count: number): FloatingObject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    Icon: Icons[i % Icons.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 20 + Math.random() * 24,
    duration: 15 + Math.random() * 25,
    delay: -(Math.random() * 20),
    rotate: Math.random() * 360,
    opacity: 0.06 + Math.random() * 0.08,
  }));
}

interface FloatingElementsProps {
  count?: number;
}

export function FloatingElements({ count = 18 }: FloatingElementsProps) {
  const [elements, setElements] = useState<FloatingObject[] | null>(null);

  useEffect(() => {
    setElements(generateElements(count));
  }, [count]);

  if (elements === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {elements.map((obj) => {
        const Icon = obj.Icon;

        return (
          <div
            key={obj.id}
            className="absolute text-foreground"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: obj.size,
              height: obj.size,
              opacity: obj.opacity,
              animation: `float-element ${obj.duration}s ease-in-out ${obj.delay}s infinite`,
            }}
          >
            <Icon width="100%" height="100%" />
          </div>
        );
      })}
    </div>
  );
}
