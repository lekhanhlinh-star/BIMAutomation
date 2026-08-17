import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/services';
import { Clock, Eye } from 'lucide-react';

export default function TutorialsPage() {
  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['tutorials'],
    queryFn: publicApi.getTutorials
  });

  return (
    <div className="page-shell py-12 space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Video hướng dẫn cài đặt & thao tác Add-in
        </h1>
        <p className="text-slate-400 text-sm">
          Nắm bắt quy trình tự động hóa Revit từng bước trực quan nhất.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải video hướng dẫn...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tutorials.map((video) => (
            <div key={video.id} className="space-y-4">
              <div className="aspect-video bg-[var(--surface-raised)] relative border border-[var(--line)]">
                <iframe
                  src={video.videoUrl}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-cyan-300 uppercase tracking-wide">
                    {video.level}
                  </span>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {video.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {video.views}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
