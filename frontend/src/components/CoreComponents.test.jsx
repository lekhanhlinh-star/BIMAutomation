import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HeroPromptTypewriter from './HeroPromptTypewriter';
import McpToolsHub from './McpToolsHub';
import WhyAiDrawsRebar from './WhyAiDrawsRebar';
import RebarShowcasePipeline from './RebarShowcasePipeline';
import McpConfigSnippet from './McpConfigSnippet';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve())
  }
});

describe('Worker M2 Core Reusable Components Test Suite', () => {
  afterEach(() => {
    cleanup();
  });

  describe('HeroPromptTypewriter', () => {
    it('renders scenario selector pills and terminal headers', () => {
      render(<HeroPromptTypewriter />);
      expect(screen.getByText(/Preset Cột/i)).toBeInTheDocument();
      expect(screen.getByText(/Dầm từ Excel/i)).toBeInTheDocument();
      expect(screen.getByText(/Preset Móng/i)).toBeInTheDocument();
      expect(screen.getAllByText(/127.0.0.1:8765\/mcp/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/LIVE MCP/i)).toBeInTheDocument();
    });

    it('switches scenarios when clicking a scenario pill', () => {
      render(<HeroPromptTypewriter />);
      const beamPill = screen.getByText(/Dầm từ Excel/i);
      fireEvent.click(beamPill);
      expect(screen.getByText(/4 Dầm liên tục Trục 3/i)).toBeInTheDocument();
    });

    it('copies prompt to clipboard when clicking copy button', () => {
      render(<HeroPromptTypewriter />);
      const copyBtn = screen.getByRole('button', { name: /Sao chép/i });
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('McpToolsHub', () => {
    it('renders 57 tools catalog with search bar and categories', () => {
      render(<McpToolsHub />);
      expect(screen.getByText(/Danh Bạ 57 Công Cụ Chuẩn MCP BIMAutomation/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Vẽ thép & Bản vẽ kết cấu/i).length).toBeGreaterThan(0);
    });

    it('filters tools by search query', () => {
      render(<McpToolsHub />);
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);
      fireEvent.change(searchInput, { target: { value: 'create_column_rebar' } });
      expect(screen.getAllByText('create_column_rebar').length).toBeGreaterThan(0);
    });

    it('opens tool inspection modal when clicking a tool card', () => {
      render(<McpToolsHub />);
      const toolCard = screen.getAllByText('create_column_rebar')[0];
      fireEvent.click(toolCard);
      expect(screen.getByText(/Tham Số Đầu Vào \(Inputs\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Định Dạng Kết Quả Đầu Ra/i)).toBeInTheDocument();
    });
  });

  describe('WhyAiDrawsRebar', () => {
    it('renders 5 architecture pillars', () => {
      render(<WhyAiDrawsRebar />);
      expect(screen.getByText(/Vì Sao AI Vẽ Được Thép An Toàn & Chuẩn Xác\?/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Direct .NET C# Engine Execution/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Revit STA Threading & ExternalEvent Queue/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaction Ownership & Auto-Rollback/i)).toBeInTheDocument();
      expect(screen.getByText(/Server-Authoritative License & Gate/i)).toBeInTheDocument();
      expect(screen.getByText(/Safe In-Revit Confirmation Prompt/i)).toBeInTheDocument();
    });

    it('toggles comparison mode between architectural pillars and traditional script', () => {
      render(<WhyAiDrawsRebar />);
      const compareBtn = screen.getByText(/So Sánh Với Script Truyền Thống/i);
      fireEvent.click(compareBtn);
      expect(screen.getByText(/Script Dynamo \/ Python Rời Rạc/i)).toBeInTheDocument();
    });
  });

  describe('RebarShowcasePipeline', () => {
    it('renders 5 core AI rebar tools and pipeline tabs', () => {
      render(<RebarShowcasePipeline />);
      expect(screen.getByText(/5 Công Cụ AI Vẽ Thép & Chuỗi Triển Khai Sheet Liên Tục/i)).toBeInTheDocument();
      expect(screen.getAllByText(/AI Column Rebar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI Beam Rebar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI Footing Rebar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI Wall Rebar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI Slab Rebar/i).length).toBeGreaterThan(0);
    });

    it('navigates through the continuous beam pipeline steps', () => {
      render(<RebarShowcasePipeline />);
      const beamTab = screen.getByText(/Chuỗi Triển Khai Bản Vẽ Dầm \(9 Bước\)/i);
      fireEvent.click(beamTab);
      expect(screen.getAllByText(/BƯỚC 1/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Chọn Dầm Trên Trục/i).length).toBeGreaterThan(0);

      const nextBtn = screen.getByText(/Bước Tiếp Theo →/i);
      fireEvent.click(nextBtn);
      expect(screen.getAllByText(/Cách Ly & Sắp Xếp Trục Liên Tục/i).length).toBeGreaterThan(0);
    });
  });

  describe('McpConfigSnippet', () => {
    it('renders Claude Desktop and Cursor config tabs and endpoint info', () => {
      render(<McpConfigSnippet />);
      expect(screen.getByText(/Kết Nối AI Client Ngoài \(Claude Desktop \/ Cursor\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/http:\/\/127.0.0.1:8765\/mcp/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/LOOPBACK-ONLY \(127.0.0.1\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Claude Desktop/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cursor IDE/i })).toBeInTheDocument();
    });

    it('switches to Cursor IDE tab', () => {
      render(<McpConfigSnippet />);
      const cursorTab = screen.getByRole('button', { name: /Cursor IDE/i });
      fireEvent.click(cursorTab);
      expect(screen.getAllByText(/\.cursor\/mcp\.json/i).length).toBeGreaterThan(0);
    });

    it('copies config JSON when clicking copy button', () => {
      render(<McpConfigSnippet />);
      const copyBtn = screen.getByRole('button', { name: /Sao chép JSON/i });
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
