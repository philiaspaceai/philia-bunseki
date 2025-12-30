
import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.05-4.319l5.4-6.3a.75.75 0 011.1 0l5.4 6.3A9.75 9.75 0 0116.5 18.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-2.25m0 0l-1.01-1.136a.75.75 0 010-1.061l1.01-1.136m0 2.25l1.01-1.136a.75.75 0 000-1.061l-1.01-1.136M6.75 15.75l-1.5-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 15.75l1.5-1.5" />
    </svg>
);
