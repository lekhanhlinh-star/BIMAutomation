import React from 'react';
import { Target, Award, Users } from 'lucide-react';

const values = [
  { icon: Target, title: 'Tầm nhìn', body: 'Trở thành hệ sinh thái Add-in & Automation hàng đầu Châu Á cho ngành Xây dựng & BIM (AEC Industry).' },
  { icon: Award, title: 'Chất lượng', body: 'Mọi tính năng đều trải qua quá trình kiểm thử khắt khe trên các dự án quy mô thực tế trước khi phát hành.' },
  { icon: Users, title: 'Đồng hành', body: 'Lắng nghe đóng góp từ cộng đồng người dùng hàng tuần để cải tiến và bổ sung tính năng mới liên tục.' },
];

export default function AboutPage() {
  return (
    <div className="page-shell py-14 grid lg:grid-cols-[.85fr_1.15fr] gap-12 lg:gap-16">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-balance">
          Về dự án BIMAutomation
        </h1>
        <p className="mt-5 text-slate-300 text-sm leading-relaxed max-w-md">
          BIMAutomation ra đời với sứ mệnh đơn giản hóa các quy trình làm việc phức tạp trong môi trường Autodesk Revit, giúp các kỹ sư và kiến trúc sư tập trung vào tư duy sáng tạo thay vì các thao tác thủ công lặp đi lặp lại.
        </p>
      </div>

      <div className="border-t border-[var(--line)]">
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="py-6 border-b border-[var(--line)] flex gap-5">
            <Icon className="w-5 h-5 text-cyan-300 shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
