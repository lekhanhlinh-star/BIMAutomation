import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Cpu, Download, FileText, RefreshCw } from 'lucide-react';
import { publicApi } from '../../api/services';

function validDownloadUrl(value){
  if(typeof value!=='string'||!value.trim()) return false;
  if(value.startsWith('/downloads/')) return true;
  try{return ['http:','https:'].includes(new URL(value).protocol)}catch{return false}
}
export default function DownloadPage(){
  const {data:release,isLoading,isError}=useQuery({queryKey:['release'],queryFn:publicApi.getReleases,retry:false});
  const ready=validDownloadUrl(release?.downloadUrl);
  return <div className="page-shell py-14 pb-20 max-w-4xl"><header className="max-w-2xl"><h1 className="text-4xl font-extrabold text-white">Tải BIMAutomation cho Autodesk Revit</h1><p className="mt-4 text-slate-400">Bộ cài tự động thêm BIMAutomation vào Ribbon và liên kết với tài khoản hiện tại của bạn.</p></header>
    <section className="mt-10 border-t border-[var(--line)] pt-8">
      {isLoading?<p className="py-12 text-slate-400"><RefreshCw className="inline animate-spin mr-2"/>Đang kiểm tra bản phát hành…</p>:<><div className="flex flex-col md:flex-row gap-5 justify-between md:items-center pb-7 border-b border-[var(--line)]"><div><h2 className="text-2xl font-bold text-white">BIMAutomation Installer <span className="font-mono text-cyan-300">{release?.latestVersion}</span></h2><p className="mt-2 text-sm text-slate-400">{release?.revitVersions} · {release?.fileSize} · Phát hành {release?.releaseDate}</p></div>{ready?<a href={release.downloadUrl} className="primary-button shrink-0" download><Download size={19}/> Tải bộ cài (.exe)</a>:<button disabled className="secondary-button opacity-50 cursor-not-allowed shrink-0"><Download size={19}/> Bản cài đang được cập nhật</button>}</div>
      {(!ready||isError)&&<p role="status" className="mt-4 border border-amber-800/40 p-4 text-sm text-amber-200">Bản cài đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ hỗ trợ.</p>}
      <div className="grid md:grid-cols-2 gap-8 mt-8"><div><h2 className="font-bold text-white flex gap-2"><Cpu className="text-cyan-300" size={19}/>Yêu cầu hệ thống</h2><ul className="mt-4 grid gap-3 text-sm text-slate-300">{['Autodesk Revit 2021–2025','Windows 10 hoặc Windows 11 (64-bit)','.NET Framework 4.8 trở lên'].map(x=><li key={x} className="flex gap-2"><CheckCircle2 size={17} className="text-cyan-300"/>{x}</li>)}</ul></div><div><h2 className="font-bold text-white flex gap-2"><FileText className="text-cyan-300" size={19}/>Thay đổi trong bản này</h2><ul className="mt-4 grid gap-2 text-sm text-slate-400 list-disc pl-5">{release?.changelog?.map(x=><li key={x}>{x}</li>)}</ul></div></div></>}
    </section>
  </div>;
}
