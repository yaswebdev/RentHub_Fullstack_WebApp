import React from 'react';
import { cn } from '../lib/utils';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/60', className)}
      {...props}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 group">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      
      {/* Content Skeleton */}
      <div className="space-y-2 mt-1">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-1">
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const HeaderSkeleton = () => (
  <div className="space-y-4 mb-8">
    <Skeleton className="h-10 w-2/3 md:w-1/2" />
    <div className="flex gap-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const GallerySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[400px] md:h-[500px]">
    <Skeleton className="md:col-span-2 h-full rounded-2xl" />
    <div className="hidden md:grid grid-cols-2 col-span-2 gap-4 h-full">
      <Skeleton className="rounded-2xl h-full" />
      <Skeleton className="rounded-2xl h-full" />
      <Skeleton className="rounded-2xl h-full" />
      <Skeleton className="rounded-2xl h-full" />
    </div>
  </div>
);
