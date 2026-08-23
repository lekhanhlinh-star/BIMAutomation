import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  FileCode, 
  ShieldCheck, 
  Info,
  Server
} from 'lucide-react';

const CONFIG_TABS = [
  {
    id: 'claude',
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
    <div className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-sm" id="mcp-config-snippet">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              MCP SPEC 2025-11-25
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              LOOPBACK-ONLY (127.0.0.1)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Kết Nối AI Client Ngoài (Claude Desktop / Cursor)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chỉ cần 1 thao tác copy-paste cấu hình JSON để biến Claude hoặc Cursor thành trợ lý vẽ thép trong Revit.
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Endpoint Cục Bộ</div>
          <div className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
            http://127.0.0.1:8765/mcp
          </div>
        </div>
      </div>

      {/* 3 Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">1. Mở Autodesk Revit</div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
            Tab <strong>LDL-STRUCTURAL</strong> tự khởi động MCP cổng 8765.
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">2. Lấy Bearer Token</div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 font-mono truncate">
            %LocalAppData%\RevitAPP\mcp-access-token.txt
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">3. Dán Cấu Hình & Sử Dụng</div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
            Dán đoạn JSON bên dưới vào client và ra lệnh.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
        {CONFIG_TABS.map((tab) => {
          const isSelected = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* File Path & Copy Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-t-xl bg-slate-900 text-slate-300 font-mono text-xs border border-b-0 border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 hidden sm:inline">File:</span>
          <span className="text-slate-100 font-medium truncate">{activeTab.filePath}</span>
          <button
            onClick={handleCopyPath}
            title="Sao chép đường dẫn file"
            className="text-slate-400 hover:text-white transition-colors p-0.5"
          >
            {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors cursor-pointer shrink-0"
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor */}
      <div className="rounded-b-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-sky-300 overflow-x-auto border border-slate-800 shadow-inner">
        <pre className="leading-relaxed whitespace-pre font-mono">{activeTab.code}</pre>
      </div>

      {/* Notes */}
      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1">Hướng dẫn:</span>
          {activeTab.notes}
        </div>
      </div>

      {/* Security Callout */}
      <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong>Bảo mật:</strong> MCP Server chỉ lắng nghe trên Loopback <code>127.0.0.1</code> với Bearer Token 256-bit. Mọi truy cập bên ngoài đều bị chặn.
        </div>
      </div>

    </div>
  );
}
