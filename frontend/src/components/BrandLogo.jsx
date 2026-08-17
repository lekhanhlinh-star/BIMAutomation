import React from 'react';

const sizeClasses = {
  sm: 'brand-logo--sm',
  md: 'brand-logo--md',
  lg: 'brand-logo--lg',
};

export default function BrandLogo({ size = 'md', iconOnly = false, className = '' }) {
  return (
    <span className={`brand-logo ${sizeClasses[size] || sizeClasses.md} ${className}`.trim()}>
      <span className="brand-logo__mark" aria-hidden="true">
        <img src="/assets/brand/bimautomation-mark.png" alt="" />
      </span>
      {!iconOnly && (
        <span className="brand-logo__wordmark">
          BIM<span>Automation</span>
        </span>
      )}
    </span>
  );
}
