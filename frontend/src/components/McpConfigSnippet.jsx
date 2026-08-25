import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  FileCode, 
  ShieldCheck, 
  Info
} from 'lucide-react';
import AiToolIcon from './icons/AiToolIcon';

const CONFIG_TABS = [
  {
    id: 'claude',
    tool: 'claude',
    name: 'Claude Desktop',
    filePath: '%APPDATA%\\Claude\\claude_desktop_config.json',
    language: 'json',
    code: `{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_FROM_LOCALAPPDATA_REVITAPP"
      }
    }
  }
}`,
    notes: 'Mở Claude Desktop Settings > Developer > Edit Config và dán cấu hình trên. Thay thế YOUR_TOKEN_FROM_LOCALAPPDATA_REVITAPP bằng nội dung trong file mcp-access-token.txt.'
  },
  {
    id: 'cursor',
    tool: 'cursor',
    name: 'Cursor IDE',
    filePath: '.cursor/mcp.json (hoặc %USERPROFILE%\\.cursor\\mcp.json)',
    language: 'json',
    code: `{
  "mcpServers": {
    "revitapp": {
      "url": "http://127.0.0.1:8765/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_FROM_LOCALAPPDATA_REVITAPP"
      }
    }
  }
}`,
    notes: 'Tạo hoặc mở file .cursor/mcp.json trong thư mục dự án của bạn hoặc file cấu hình toàn cục của Cursor IDE.'
  },
  {
    id: 'npx_proxy',
    tool: 'claude',
    name: 'Claude (qua NPM Server-Fetch)',
    filePath: '%APPDATA%\\Claude\\claude_desktop_config.json',
    language: 'json',
    code: `{
  "mcpServers": {
    "revitapp": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "http://127.0.0.1:8765/mcp"
      ],
      "env": {
        "REVIT_MCP_TOKEN_PATH": "%LocalAppData%\\\\RevitAPP\\\\mcp-access-token.txt"
      }
    }
  }
}`,
    notes: 'Dành cho các môi trường Claude Desktop yêu cầu giao thức stdio bridge qua gói npm @modelcontextprotocol/server-fetch.'
  },
  {
    id: 'python',
    tool: 'python',
    name: 'Python MCP Client',
    filePath: 'script.py',
    language: 'python',
    code: `import os
import requests

# Đọc token tự động từ LocalAppData
token_path = os.path.expandvars(r"%LocalAppData%\\RevitAPP\\mcp-access-token.txt")
with open(token_path, "r", encoding="utf-8") as f:
    token = f.read().strip()

# Gửi yêu cầu liveness ping hoặc thực thi tool
url = "http://127.0.0.1:8765/mcp"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "query_elements_by_category",
        "arguments": {
            "category": "Structural Columns",
            "mark_filter": "C7"
        }
    },
    "id": 1
}

res = requests.post(url, json=payload, headers=headers)
print("BIMAutomation MCP Response:", res.json())`,
    notes: 'Ví dụ tương tác trực tiếp với BIMAutomation MCP HTTP Server bằng Python script hoặc AI agent tự xây dựng.'
  }
];

export default function McpConfigSnippet() {
  const [activeTabId, setActiveTabId] = useState('claude');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const activeTab = CONFIG_TABS.find(t => t.id === activeTabId) || CONFIG_TABS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeTab.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(activeTab.filePath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="mx-auto my-10 w-full max-w-5xl rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 shadow-sm sm:p-8 lg:p-10" id="mcp-config-snippet">
      
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-start">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-[var(--text-secondary)]">
              MCP SPEC 2025-11-25
            </span>
            <span className="border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400">
              LOOPBACK-ONLY (127.0.0.1)
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex shrink-0 items-center gap-2 text-[var(--text-primary)]" aria-hidden="true">
              <AiToolIcon tool="claude" size={22} />
              <AiToolIcon tool="cursor" size={22} />
            </div>
            <h2 className="text-xl font-extrabold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-2xl">
              Kết Nối AI Client Ngoài (Claude Desktop / Cursor)
            </h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Chỉ cần 1 thao tác copy-paste cấu hình JSON để biến Claude hoặc Cursor thành trợ lý vẽ thép trong Revit.
          </p>
        </div>

        <div className="shrink-0 border-l-2 border-[var(--brand)] pl-3 text-left sm:text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Endpoint Cục Bộ</div>
          <div className="mt-1 font-mono text-xs font-bold text-[var(--brand)]">
            http://127.0.0.1:8765/mcp
          </div>
        </div>
      </div>

      {/* 3 Steps */}
      <div className="my-7 grid divide-y divide-[var(--line)] border-y border-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-1 py-4 text-xs sm:px-5 sm:first:pl-0">
          <div className="font-bold text-[var(--text-primary)]">1. Mở Autodesk Revit</div>
          <div className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">
            Tab <strong>BIMAutomation</strong> tự khởi động MCP cổng 8765.
          </div>
        </div>

        <div className="px-1 py-4 text-xs sm:px-5">
          <div className="font-bold text-[var(--text-primary)]">2. Lấy Bearer Token</div>
          <div className="mt-1.5 truncate font-mono text-[11px] leading-5 text-[var(--text-secondary)]">
            %LocalAppData%\RevitAPP\mcp-access-token.txt
          </div>
        </div>

        <div className="px-1 py-4 text-xs sm:px-5 sm:last:pr-0">
          <div className="font-bold text-[var(--text-primary)]">3. Dán Cấu Hình & Sử Dụng</div>
          <div className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">
            Dán đoạn JSON bên dưới vào client và ra lệnh.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] pb-2">
        {CONFIG_TABS.map((tab) => {
          const isSelected = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap px-3 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-[var(--text-primary)] font-bold text-[var(--surface-raised)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <AiToolIcon tool={tab.tool} size={17} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* File Path & Copy Bar */}
      <div className="flex items-center justify-between gap-3 rounded-t-lg border border-b-0 border-slate-800 bg-slate-900 px-4 py-2.5 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <FileCode className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
          <span className="text-slate-400 hidden sm:inline">File:</span>
          <span className="text-slate-100 font-medium truncate">{activeTab.filePath}</span>
          <button
            onClick={handleCopyPath}
            title="Sao chép đường dẫn file"
            className="text-slate-400 hover:text-white transition-colors p-0.5"
          >
            {copiedPath ? <Check className="h-4 w-4 text-emerald-400" strokeWidth={1.8} /> : <Copy className="h-4 w-4" strokeWidth={1.8} />}
          </button>
        </div>

        <button
          onClick={handleCopyCode}
          className="inline-flex min-h-8 shrink-0 items-center gap-2 bg-sky-400 px-3 py-1.5 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-sky-300"
        >
          {copiedCode ? (
            <>
              <Check className="h-4 w-4" strokeWidth={1.8} />
              <span>Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" strokeWidth={1.8} />
              <span>Sao chép JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor */}
      <div className="overflow-x-auto rounded-b-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-sky-300 sm:p-5 sm:text-sm">
        <pre className="leading-relaxed whitespace-pre font-mono">{activeTab.code}</pre>
      </div>

      {/* Notes */}
      <div className="mt-4 flex items-start gap-3 border border-[var(--line)] bg-[var(--surface-subtle)] p-4 text-xs leading-5 text-[var(--text-secondary)]">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--brand)]" strokeWidth={1.8} />
        <div>
          <span className="mr-1 font-bold text-[var(--text-primary)]">Hướng dẫn:</span>
          {activeTab.notes}
        </div>
      </div>

      {/* Security Callout */}
      <div className="mt-3 flex items-start gap-3 border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
        <div>
          <strong>Bảo mật:</strong> MCP Server chỉ lắng nghe trên Loopback <code>127.0.0.1</code> với Bearer Token 256-bit. Mọi truy cập bên ngoài đều bị chặn.
        </div>
      </div>

    </div>
  );
}
