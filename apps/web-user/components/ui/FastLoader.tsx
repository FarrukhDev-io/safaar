"use client";

import React from "react";

/**
 * CompassLoader - Kompas strelkasi aylanib turuvchi zamonaviy SVG loader.
 * Foydalanuvchi yuborgan CSS asosida Next.js va Tailwind muhitiga moslashtirilgan.
 */
export const CompassLoader = () => {
  return (
    <div className="relative flex items-center justify-center w-full min-h-[160px]">
      <style dangerouslySetInnerHTML={{ __html: `
        .compass-loader-wrapper .pl {
          display: block;
          width: 9.375em;
          height: 9.375em;
        }

        .compass-loader-wrapper .pl__arrows,
        .compass-loader-wrapper .pl__ring-rotate,
        .compass-loader-wrapper .pl__ring-stroke,
        .compass-loader-wrapper .pl__tick {
          animation-duration: 2s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .compass-loader-wrapper .pl__arrows {
          animation-name: arrows42;
          transform: rotate(45deg);
          transform-origin: 16px 52px;
        }

        .compass-loader-wrapper .pl__ring-rotate,
        .compass-loader-wrapper .pl__ring-stroke {
          transform-origin: 80px 80px;
        }

        .compass-loader-wrapper .pl__ring-rotate {
          animation-name: ringRotate42;
        }

        .compass-loader-wrapper .pl__ring-stroke {
          animation-name: ringStroke42;
          transform: rotate(-45deg);
        }

        .compass-loader-wrapper .pl__tick {
          animation-name: tick42;
        }

        .compass-loader-wrapper .pl__tick:nth-child(2) { animation-delay: -1.75s; }
        .compass-loader-wrapper .pl__tick:nth-child(3) { animation-delay: -1.5s; }
        .compass-loader-wrapper .pl__tick:nth-child(4) { animation-delay: -1.25s; }
        .compass-loader-wrapper .pl__tick:nth-child(5) { animation-delay: -1s; }
        .compass-loader-wrapper .pl__tick:nth-child(6) { animation-delay: -0.75s; }
        .compass-loader-wrapper .pl__tick:nth-child(7) { animation-delay: -0.5s; }
        .compass-loader-wrapper .pl__tick:nth-child(8) { animation-delay: -0.25s; }

        @keyframes arrows42 {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }

        @keyframes ringRotate42 {
          from { transform: rotate(0); }
          to { transform: rotate(720deg); }
        }

        @keyframes ringStroke42 {
          from, to {
            stroke-dashoffset: 452;
            transform: rotate(-45deg);
          }
          50% {
            stroke-dashoffset: 169.5;
            transform: rotate(-180deg);
          }
        }

        @keyframes tick42 {
          from, 3%, 47%, to { stroke-dashoffset: -12; }
          14%, 36% { stroke-dashoffset: 0; }
        }
      ` }} />

      <div className="compass-loader-wrapper drop-shadow-md">
        <svg className="pl" viewBox="0 0 160 160" width="160px" height="160px" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0%" stopColor="#000" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
            <mask id="mask1">
              <rect x={0} y={0} width={160} height={160} fill="url(#grad)" />
            </mask>
            <mask id="mask2">
              <rect x={28} y={28} width={104} height={104} fill="url(#grad)" />
            </mask>
          </defs>
          <g>
            <g className="pl__ring-rotate">
              <circle className="pl__ring-stroke" cx={80} cy={80} r={72} fill="none" stroke="var(--brand-500, #2563eb)" strokeWidth={16} strokeDasharray="452.39 452.39" strokeDashoffset={452} strokeLinecap="round" transform="rotate(-45,80,80)" />
            </g>
          </g>
          <g mask="url(#mask1)">
            <g className="pl__ring-rotate">
              <circle className="pl__ring-stroke" cx={80} cy={80} r={72} fill="none" stroke="var(--brand-300, #93c5fd)" strokeWidth={16} strokeDasharray="452.39 452.39" strokeDashoffset={452} strokeLinecap="round" transform="rotate(-45,80,80)" />
            </g>
          </g>
          <g>
            <g strokeWidth={4} strokeDasharray="12 12" strokeDashoffset={12} strokeLinecap="round" transform="translate(80,80)">
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-200, #bfdbfe)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)" />
            </g>
          </g>
          <g mask="url(#mask1)">
            <g strokeWidth={4} strokeDasharray="12 12" strokeDashoffset={12} strokeLinecap="round" transform="translate(80,80)">
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)" />
              <polyline className="pl__tick" stroke="var(--brand-400, #3b82f6)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)" />
            </g>
          </g>
          <g>
            <g transform="translate(64,28)">
              <g className="pl__arrows" transform="rotate(45,16,52)">
                <path fill="var(--brand-600, #1d4ed8)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z" />
                <path fill="#64748b" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z" />
              </g>
            </g>
          </g>
          <g mask="url(#mask2)">
            <g transform="translate(64,28)">
              <g className="pl__arrows" transform="rotate(45,16,52)">
                <path fill="var(--brand-400, #3b82f6)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z" />
                <path fill="#94a3b8" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
