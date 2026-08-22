import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/services';
import { Clock, Eye, Loader2 } from 'lucide-react';

export default function TutorialsPage() {
  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['tutorials'],
    queryFn: publicApi.getTutorials,
  });

  return (
    <div className="page-shell py-14 space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Video hướng dẫn cài đặt & thao tác Add-in
        </h1>
        <p className="text-[var(--text-secondary)] text-base leading-relaxed">
          Nắm bắt quy trình tự động hóa Revit từng bước trực quan và nhanh chóng nhất.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải video hướng dẫn...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tutorials.map((video) => (
            <div key={video.id} className="space-y-4 panel p-4 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
              <div className="aspect-video bg-[var(--surface-subtle)] relative border border-[var(--line)] rounded-[var(--radius-control)] overflow-hidden">
                <iframe
                  src={video.videoUrl}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[var(--brand)] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--brand-soft)] border border-[var(--line)]">
                    {video.level}
                  </span>
                  <div className="flex items-center gap-3 text-[var(--text-muted)] font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {video.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {video.views}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
