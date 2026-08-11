"use client";

import React from "react";

/**
 * FastLoader - Tezlik bilan harakatlanayotgan "ninja/speeder" animatsiyali loader.
 * Foydalanuvchi yuborgan CSS asosida Next.js va Tailwind muhitiga moslashtirilgan.
 */
export const FastLoader = () => {
  return (
    <div className="relative flex items-center justify-center w-full min-h-[120px]">
      <style dangerouslySetInnerHTML={{ __html: `
        .fast-loader-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          margin-left: -50px;
          margin-top: -20px;
          animation: speeder 0.4s linear infinite;
        }
        .fast-loader-wrapper > span {
          height: 5px;
          width: 35px;
          background: var(--brand-500, #2563eb);
          position: absolute;
          top: -19px;
          left: 60px;
          border-radius: 2px 10px 1px 0;
        }
        .fast-base span {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-right: 100px solid var(--brand-500, #2563eb);
          border-bottom: 6px solid transparent;
        }
        .fast-base span:before {
          content: "";
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: var(--brand-500, #2563eb);
          position: absolute;
          right: -110px;
          top: -16px;
        }
        .fast-base span:after {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-top: 0 solid transparent;
          border-right: 55px solid var(--brand-500, #2563eb);
          border-bottom: 16px solid transparent;
          top: -16px;
          right: -98px;
        }
        .fast-face {
          position: absolute;
          height: 12px;
          width: 20px;
          background: var(--brand-500, #2563eb);
          border-radius: 20px 20px 0 0;
          transform: rotate(-40deg);
          right: -125px;
          top: -15px;
        }
        .fast-face:after {
          content: "";
          height: 12px;
          width: 12px;
          background: var(--brand-500, #2563eb);
          right: 4px;
          top: 7px;
          position: absolute;
          transform: rotate(40deg);
          transform-origin: 50% 50%;
          border-radius: 0 0 0 2px;
        }
        .fast-loader-wrapper > span > span:nth-child(1),
        .fast-loader-wrapper > span > span:nth-child(2),
        .fast-loader-wrapper > span > span:nth-child(3),
        .fast-loader-wrapper > span > span:nth-child(4) {
          width: 30px;
          height: 1px;
          background: var(--brand-500, #2563eb);
          position: absolute;
          animation: fazer1 0.2s linear infinite;
        }
        .fast-loader-wrapper > span > span:nth-child(2) {
          top: 3px;
          animation: fazer2 0.4s linear infinite;
        }
        .fast-loader-wrapper > span > span:nth-child(3) {
          top: 1px;
          animation: fazer3 0.4s linear infinite;
          animation-delay: -1s;
        }
        .fast-loader-wrapper > span > span:nth-child(4) {
          top: 4px;
          animation: fazer4 1s linear infinite;
          animation-delay: -1s;
        }
        @keyframes fazer1 {
          0% { left: 0; }
          100% { left: -80px; opacity: 0; }
        }
        @keyframes fazer2 {
          0% { left: 0; }
          100% { left: -100px; opacity: 0; }
        }
        @keyframes fazer3 {
          0% { left: 0; }
          100% { left: -50px; opacity: 0; }
        }
        @keyframes fazer4 {
          0% { left: 0; }
          100% { left: -150px; opacity: 0; }
        }
        @keyframes speeder {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -3px) rotate(-1deg); }
          20% { transform: translate(-2px, 0px) rotate(1deg); }
          30% { transform: translate(1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 3px) rotate(-1deg); }
          60% { transform: translate(-1px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-2px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 1px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 50%;
          margin-top: -20px;
        }
        .longfazers span {
          position: absolute;
          height: 2px;
          width: 20%;
          background: var(--brand-500, #2563eb);
        }
        .longfazers span:nth-child(1) {
          top: 20%;
          animation: lf 0.6s linear infinite;
          animation-delay: -5s;
        }
        .longfazers span:nth-child(2) {
          top: 40%;
          animation: lf2 0.8s linear infinite;
          animation-delay: -1s;
        }
        .longfazers span:nth-child(3) {
          top: 60%;
          animation: lf3 0.6s linear infinite;
        }
        .longfazers span:nth-child(4) {
          top: 80%;
          animation: lf4 0.5s linear infinite;
          animation-delay: -3s;
        }
        @keyframes lf {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes lf2 {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes lf3 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
        @keyframes lf4 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
      ` }} />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="fast-loader-wrapper">
          <span>
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className="fast-base">
            <span />
            <div className="fast-face" />
          </div>
        </div>
        <div className="longfazers">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};
