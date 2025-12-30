
import React from 'react';

export const ChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 10.5c-1.148 0-2.08.932-2.08 2.08s.932 2.08 2.08 2.08c.574 0 1.09-.233 1.47-.613" />
    </svg>
);
