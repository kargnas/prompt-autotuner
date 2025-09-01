import React from 'react';

const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 0 0-2.25-1.352L6.343 15a3 3 0 0 1-2.25-1.352L3.09 12.5l1.002-1.001a3 3 0 0 0 2.25-1.352l.002-.002a3 3 0 0 1 2.25-1.352L10.5 7.5l1.001 1.002a3 3 0 0 0 1.352 2.25l.002.002a3 3 0 0 1 1.352 2.25L15 13.657l-1.002 1.001a3 3 0 0 0-1.352 2.25l-.002.002a3 3 0 0 1-1.352 2.25L10.5 20.25l-1.001-1.002Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.375 12.739a3.375 3.375 0 0 0-3.375-3.375h-1.5a3.375 3.375 0 0 0-3.375 3.375v1.5a3.375 3.375 0 0 0 3.375 3.375h1.5a3.375 3.375 0 0 0 3.375-3.375v-1.5Z"
    />
  </svg>
);

export default WandIcon;