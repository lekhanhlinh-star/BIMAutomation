import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Download, LogOut, Menu, User, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuthStore } from '../store/useAuthStore';
import { savePendingIntent } from '../utils/pendingIntent';

const links = [['/','Trang chủ'],['/features','Tính năng'],['/pricing','Bảng giá'],['/tutorials','Hướng dẫn'],['/download','Tải Add-in'],['/feedback','Góp ý']];

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [open,setOpen] = useState(false);
  const buttonRef = useRef(null); const menuRef = useRef(null);
  const location = useLocation(); const navigate = useNavigate();
  useEffect(()=>setOpen(false),[location.pathname]);
  useEffect(()=>{
    if(!open) return;
    menuRef.current?.querySelector('a,button')?.focus();
    const onKey=(e)=>{ if(e.key==='Escape'){setOpen(false);buttonRef.current?.focus();} if(e.key==='Tab'&&menuRef.current){const els=[...menuRef.current.querySelectorAll('a,button:not([disabled])')];const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
    document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey);
  },[open]);
  const goDownload=(e)=>{ if(isAuthenticated) return; e.preventDefault(); savePendingIntent({type:'download',returnTo:'/download'}); navigate('/login'); };
  const NavLink=({path,label,mobile=false})=><Link to={path} onClick={path==='/download'?goDownload:undefined} aria-current={location.pathname===path?'page':undefined} className={`${mobile?'flex items-center px-4':'px-3'} min-h-11 text-sm font-semibold border-b-2 ${location.pathname===path?'text-white border-cyan-400':'text-slate-400 border-transparent hover:text-white'}`}>{label}</Link>;
  return <div className="min-h-screen flex flex-col bg-[var(--surface)] text-slate-100">
    <header className="sticky top-0 z-50 bg-[var(--surface)]/95 border-b border-[var(--line)]">
      <div className="page-shell h-[68px] flex items-center justify-between">
        <Link to="/" className="inline-flex items-center min-h-11" aria-label="BIMAutomation - Trang chủ"><BrandLogo /></Link>
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1">{links.map(([p,l])=><NavLink key={p} path={p} label={l}/>)}</nav>
        <div className="hidden lg:flex items-center gap-2">{isAuthenticated?<><Link to="/account" className="secondary-button !min-h-10 !py-2"><User size={16}/>{user?.name||'Tài khoản'}</Link><button onClick={logout} className="w-10 grid place-items-center text-slate-400 hover:text-rose-300" aria-label="Đăng xuất"><LogOut size={18}/></button></>:<><Link to="/login" className="px-3 min-h-10 flex items-center font-semibold text-sm text-slate-300 hover:text-white">Đăng nhập</Link><Link to="/register" className="primary-button !min-h-10 !py-2">Dùng thử</Link></>}</div>
        <button ref={buttonRef} onClick={()=>setOpen(x=>!x)} aria-label={open?'Đóng menu':'Mở menu'} aria-expanded={open} aria-controls="mobile-navigation" className="lg:hidden w-10 h-10 grid place-items-center border border-[var(--line)]">{open?<X/>:<Menu/>}</button>
      </div>
      {open&&<nav ref={menuRef} id="mobile-navigation" aria-label="Điều hướng di động" className="lg:hidden absolute inset-x-0 top-[68px] bg-[var(--surface-raised)] border-b border-[var(--line)] p-4"><div className="grid gap-1">{links.map(([p,l])=><NavLink key={p} path={p} label={l} mobile/>)}<div className="border-t border-[var(--line)] mt-2 pt-3 grid gap-2">{isAuthenticated?<><Link to="/account" className="secondary-button">Quản lý tài khoản</Link><button onClick={()=>{logout();setOpen(false)}} className="min-h-11 text-rose-300 font-semibold text-left">Đăng xuất</button></>:<><Link to="/login" className="secondary-button">Đăng nhập</Link><Link to="/register" className="primary-button">Đăng ký dùng thử</Link></>}</div></div></nav>}
    </header>
    <main className="flex-1"><Outlet/></main>
    <footer className="border-t border-[var(--line)] bg-[var(--surface-raised)]"><div className="page-shell py-10 grid sm:grid-cols-3 gap-8 text-sm"><div><BrandLogo size="sm"/><p className="mt-3 text-slate-400 leading-relaxed">Add-in tự động hóa quy trình Revit dành cho đội ngũ BIM tại Việt Nam.</p></div><div><h2 className="font-semibold text-white">Sản phẩm</h2><div className="mt-3 grid gap-2 text-slate-400"><Link to="/features">Tính năng</Link><Link to="/pricing">Bảng giá</Link><Link to="/download" onClick={goDownload}>Tải Add-in</Link></div></div><div><h2 className="font-semibold text-white">Hỗ trợ</h2><div className="mt-3 grid gap-2 text-slate-400"><Link to="/tutorials">Hướng dẫn</Link><Link to="/feedback">Gửi góp ý</Link><a href="mailto:support@bimautomation.com">support@bimautomation.com</a></div></div></div><div className="page-shell border-t border-[var(--line-soft)] py-5 text-xs text-slate-600">© 2026 BIMAutomation. Phát triển cho Autodesk Revit.</div></footer>
  </div>;
}
