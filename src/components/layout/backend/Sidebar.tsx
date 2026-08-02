'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShieldCheck, LogIn, UserPlus, Layers, LogOut, ChevronLeft, ChevronRight, ShoppingCart, ShoppingBag, Images, LayoutGrid, Paintbrush, Home, FileText, Truck, BadgePercent, UserRound } from 'lucide-react';
import { useAdminSession } from '@/tools/BackendSession';
import { AdminProfile } from '@/backend/route-params';

// 扁平化的导航配置
const MENU_ITEMS = [{
  id: 'B01',
  label: '后台登录',
  href: '/adminlogin',
  icon: LogIn,
  role: 'GUEST'
}, {
  id: 'B02',
  label: '后台注册',
  href: '/adminregister',
  icon: UserPlus,
  role: 'GUEST'
}, {
  id: 'B03',
  label: '管理概览',
  href: '/dashboard',
  icon: LayoutDashboard,
  role: 'ADMIN'
}, {
  id: 'B18',
  label: '个人设置',
  href: '/adminprofile',
  icon: UserRound,
  role: 'ADMIN'
}, {
  id: 'B04',
  label: '商品管理',
  href: '/productmanagement',
  icon: Package,
  role: 'ADMIN'
}, {
  id: 'B06',
  label: '分类管理',
  href: '/categorymanagement',
  icon: Layers,
  role: 'ADMIN'
}, {
  id: 'B07',
  label: '客户管理',
  href: '/usermanagement',
  icon: Users,
  role: 'ADMIN'
}, {
  id: 'B08',
  label: '订单管理',
  href: '/ordermanagement',
  icon: ShoppingCart,
  role: 'ADMIN'
}, {
  id: 'B14',
  label: 'Banner轮播图管理',
  href: '/bannermanagement',
  icon: Images,
  role: 'ADMIN'
}, {
  id: 'B15',
  label: '首页推荐专区管理',
  href: '/homerecommendzonemanagement',
  icon: LayoutGrid,
  role: 'ADMIN'
}, {
  id: 'B16',
  label: '物流渠道配置',
  href: '/shippingchannelconfig',
  icon: Truck,
  role: 'ADMIN'
}, {
  id: 'B17',
  label: '促销活动管理',
  href: '/pricingpromotionmanagement',
  icon: BadgePercent,
  role: 'ADMIN'
}];

/** 前台可视化装修可编辑页面入口（新开标签页并带 ?decorate=1） */
const DECORATE_PAGES = [
  {
    id: 'home',
    label: '首页',
    href: '/?decorate=1',
    icon: Home,
  },
  {
    id: 'productdetail',
    label: '商品详情页',
    href: '/productdetail?decorate=1',
    icon: FileText,
  },
  {
    id: 'auth-modal',
    label: '登录/注册弹窗',
    href: '/?decorate=1&authDecorate=login',
    icon: LogIn,
  },
  {
    id: 'login',
    label: '登录页',
    href: '/customerlogin?decorate=1',
    icon: LogIn,
  },
  {
    id: 'register',
    label: '注册页',
    href: '/customerregister?decorate=1',
    icon: UserPlus,
  },
  {
    id: 'cart',
    label: '结算/采购单页',
    href: '/cart?decorate=1',
    icon: ShoppingBag,
  },
] as const;
export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 读取后台会话状态
  const {
    user_id,
    username,
    avatarUrl,
    reset
  } = useAdminSession();
  const isLogin = !!user_id;
  const currentRole = isLogin ? 'ADMIN' : 'GUEST';
  const avatarLetter = (username || 'A').slice(0, 1).toUpperCase();

  // 过滤当前角色可见的菜单
  const displayMenus = MENU_ITEMS.filter(item => item.role === currentRole);

  // 处理退出登录
  const handleLogout = () => {
    reset();
    router.push('/adminlogin');
  };

  // 切换侧边栏展开/收起
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  return <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        shrink-0 flex flex-col transition-all duration-200 sticky top-0 h-full border-r border-border bg-card
      `}>
      {/* 顶部 Logo 区 */}
      <div className="h-16 flex items-center px-4 gap-3 shrink-0 border-b border-border relative">
        <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        
        {sidebarOpen && <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate font-[var(--font-header)] font-bold text-sm tracking-tight text-foreground">GLOBALTRADE</span>
            <span className="truncate text-[10px] font-mono font-medium text-accent tracking-wider uppercase">ADMIN CONSOLE</span>
          </div>}

        {/* 展开/收起 控制按钮 */}
        <button onClick={toggleSidebar} className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-6 h-6 bg-card border border-border rounded-full text-muted-foreground hover:text-foreground shadow-sm transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* 中间导航菜单区 */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {isLogin ? (
          <div
            className={`mb-3 rounded-xl border border-[#93C5FD] bg-[linear-gradient(135deg,#DBEAFE,#EFF6FF)] p-2 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.85)] ${sidebarOpen ? '' : 'flex flex-col items-center'}`}
            data-controller-name="页面内容编辑面板入口"
          >
            <div className={`mb-1.5 flex items-center gap-2 px-1 text-[#1D4ED8] ${sidebarOpen ? '' : 'justify-center'}`}>
              <Paintbrush className="h-4 w-4 shrink-0" />
              {sidebarOpen ? (
                <span className="truncate text-xs font-bold uppercase tracking-[0.08em]">页面可视化装修</span>
              ) : null}
            </div>
            <div className={`flex flex-col gap-1 ${sidebarOpen ? '' : 'w-full items-center'}`}>
              {DECORATE_PAGES.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.id}
                    type="button"
                    title={`装修${page.label}`}
                    onClick={() => window.open(page.href, '_blank', 'noopener,noreferrer')}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#1E40AF] transition hover:bg-white/80 ${sidebarOpen ? 'w-full' : 'justify-center'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen ? <span className="truncate">{page.label}</span> : null}
                  </button>
                );
              })}
              {sidebarOpen ? (
                <p className="mt-1 px-2 text-[10px] leading-4 text-[#1D4ED8]/80">
                  进入首页装修后，点击顶部 Logo 可上传站点 Logo；左下角可配置【客服配置】（WhatsApp）
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {displayMenus.map((item, index) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return <Link key={item.id} href={item.href} data-active={isActive} className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'}`}>
              <Icon className="shrink-0 w-5 h-5" />
              {sidebarOpen && <div className="flex items-center justify-between w-full min-w-0">
                  <span className="truncate">{item.label}</span>
                </div>}
            </Link>;
      })}
      </nav>

      {/* 底部用户面板区 */}
      <div className="p-4 border-t border-border bg-background flex flex-col gap-3">
        {isLogin ? <>
            <button
              type="button"
              onClick={() => AdminProfile.navigateTo(router)}
              className={`flex items-center rounded-md transition-colors hover:bg-secondary ${sidebarOpen ? 'gap-3 px-1 py-1' : 'justify-center p-1'}`}
              title="个人设置"
            >
              <div className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center shrink-0 text-muted-foreground shadow-xs overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-foreground">{avatarLetter}</span>
                )}
              </div>
              {sidebarOpen && <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-foreground truncate">{username || '超级管理员'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">个人设置 · 更换头像</p>
                </div>}
            </button>
            {/* 退出登录按钮 */}
            <button onClick={handleLogout} className={`flex items-center ${sidebarOpen ? 'gap-3 justify-start px-3 py-2.5' : 'justify-center p-2.5'} rounded-md text-sm font-medium text-secondary-foreground hover:bg-secondary hover:text-foreground transition-colors`}>
              <LogOut className="shrink-0 w-5 h-5" />
              {sidebarOpen && <span className="truncate">退出登录</span>}
            </button>
          </> : <div className="flex justify-center text-muted-foreground">
            {/* 未登录时的底部占位 */}
            <ShieldCheck className="shrink-0 w-6 h-6" />
          </div>}
      </div>
    </aside>;
}
