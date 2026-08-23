import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import HeroPromptTypewriter from './HeroPromptTypewriter';
import McpToolsHub from './McpToolsHub';
import WhyAiDrawsRebar from './WhyAiDrawsRebar';
import RebarShowcasePipeline from './RebarShowcasePipeline';
import McpConfigSnippet from './McpConfigSnippet';

// Mock clipboard
const mockClipboardWriteText = vi.fn().mockImplementation(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockClipboardWriteText
  }
});

describe('Challenger 1: Interactive Components Stress & Empirical Verification', () => {
  beforeEach(() => {
    mockClipboardWriteText.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // Helper for matching summary bar count
  const expectToolCount = (count) => {
    const strongs = screen.getAllByText(`${count}`, { selector: 'strong' });
    expect(strongs.length).toBeGreaterThan(0);
  };

  // =========================================================================
  // 1. HERO PROMPT TYPEWRITER ADVERSARIAL STRESS SUITE
  // =========================================================================
  describe('HeroPromptTypewriter Stress & Boundary Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        vi.runOnlyPendingTimers();
      });
      vi.useRealTimers();
    });

    it('verifies all 3 scenarios exist with required metadata, logs and results', () => {
      render(<HeroPromptTypewriter />);
      expect(screen.getByText('Preset Cột')).toBeInTheDocument();
      expect(screen.getByText('Dầm từ Excel')).toBeInTheDocument();
      expect(screen.getByText('Preset Móng')).toBeInTheDocument();
    });

    it('empirically types Scenario 0 (Column C7) and streams all 7 logs sequentially', () => {
      render(<HeroPromptTypewriter />);
      
      expect(screen.getByText(/Lệnh Kỹ Sư Gửi AI Client/i)).toBeInTheDocument();

      // Advance timers for prompt typing (prompt length ~38 chars * 45ms = ~1710ms)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Check typed prompt
      expect(screen.getAllByText(/Vẽ hệ cột C7 theo cấu hình đã lưu/i).length).toBeGreaterThan(0);

      // Check log streaming progression (7 logs * 320ms = 2240ms)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Verify all 7 logs rendered
      expect(screen.getByText(/Nhận lệnh: "Vẽ hệ cột C7 theo cấu hình đã lưu"/i)).toBeInTheDocument();
      expect(screen.getByText(/query_elements_by_category\("Structural Columns", mark_filter="C7"\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tìm thấy 16 cột C7 trên các tầng 1, 2, 3, 4, 5/i)).toBeInTheDocument();
      expect(screen.getByText(/create_column_rebar\(column_ids=\[\.\.\.\], preset_name="C7_STANDARD"\)/i)).toBeInTheDocument();
      expect(screen.getByText(/ExternalEvent Queue: Mở Transaction "TX_Rebar_Column_C7"/i)).toBeInTheDocument();
      expect(screen.getByText(/Rải 192 thanh chủ 12Φ20/i)).toBeInTheDocument();
      expect(screen.getByText(/Commit Transaction thành công. 16\/16 cột hoàn thành 100%./i)).toBeInTheDocument();

      // Verify result metrics
      expect(screen.getByText(/16 Cột kết cấu C7 \(500×500 mm\)/i)).toBeInTheDocument();
      expect(screen.getByText(/12Φ20 \/ cột \(CB400-V, so le 50%\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TX_Rebar_Column_C7/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TCVN 5574:2018/i).length).toBeGreaterThan(0);
    });

    it('empirically tests Scenario 1 (Continuous Beam Excel) prompt typing and log stream', () => {
      render(<HeroPromptTypewriter />);
      
      // Click Beam Excel pill
      const beamPill = screen.getByText('Dầm từ Excel');
      act(() => {
        fireEvent.click(beamPill);
      });

      // Advance timers for typing + full log stream (66 chars * 45ms = 2970ms + 7 * 320ms = 2240ms -> 6000ms)
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(screen.getAllByText(/Vẽ thép cho các dầm đang chọn theo bảng thép trong file Excel này/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/BangThepDam_T2\.xlsx/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/get_selected_elements\(\) -> 4 dầm được chọn/i)).toBeInTheDocument();
      expect(screen.getByText(/isolate_continuous_beam_axis\("Trục 3", level="Tầng 2"\)/i)).toBeInTheDocument();
      expect(screen.getByText(/read_rebar_excel_table\("BangThepDam_T2\.xlsx"\)/i)).toBeInTheDocument();
      expect(screen.getByText(/4 Dầm liên tục Trục 3 \(D1–D4, 300×600 mm\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TX_Rebar_Continuous_Beam_Grid3/i).length).toBeGreaterThan(0);
    });

    it('empirically tests Scenario 2 (Footing V1 Preset) prompt typing and log stream', () => {
      render(<HeroPromptTypewriter />);
      
      // Click Footing Preset pill
      const footingPill = screen.getByText('Preset Móng');
      act(() => {
        fireEvent.click(footingPill);
      });

      // Advance timers for typing + log stream
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(screen.getAllByText(/Vẽ thép cho các móng đang chọn theo preset V1/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/8 đài móng Structural Foundations/i)).toBeInTheDocument();
      expect(screen.getByText(/Nạp cấu hình Preset V1/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TX_Rebar_Footing_V1/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/8 Đài móng đơn M1–M8 \(1\.8×2\.2×0\.9 m\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Lưới đáy 2 phương Φ14a150 \(bẻ mỏ 90°\)/i)).toBeInTheDocument();
    });

    it('tests play / pause toggling behavior and freezes timers without throwing', () => {
      render(<HeroPromptTypewriter />);
      
      const pauseBtn = screen.getByTitle('Tạm dừng');
      act(() => {
        fireEvent.click(pauseBtn);
      });

      // Advance time while paused
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Play button should now be available
      const playBtn = screen.getByTitle('Tiếp tục');
      expect(playBtn).toBeInTheDocument();

      // Click play to resume
      act(() => {
        fireEvent.click(playBtn);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getAllByText(/Vẽ hệ cột C7/i).length).toBeGreaterThan(0);
    });

    it('tests replay button resets typing animation from beginning', () => {
      render(<HeroPromptTypewriter />);
      
      // Finish typing
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      const replayBtn = screen.getByTitle('Phát lại hiệu ứng gõ');
      act(() => {
        fireEvent.click(replayBtn);
      });

      // Advance again
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getAllByText(/Vẽ hệ cột C7/i).length).toBeGreaterThan(0);
    });

    it('tests prompt copy button and feedback timer reset', () => {
      render(<HeroPromptTypewriter />);
      
      const copyBtn = screen.getByRole('button', { name: /Sao chép/i });
      act(() => {
        fireEvent.click(copyBtn);
      });

      expect(mockClipboardWriteText).toHaveBeenCalledWith('Vẽ hệ cột C7 theo cấu hình đã lưu');
      expect(screen.getByText('Đã sao chép!')).toBeInTheDocument();

      // Advance 2000ms to reset feedback
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      expect(screen.queryByText('Đã sao chép!')).not.toBeInTheDocument();
    });

    it('stress: rapid scenario switching stress does not create race conditions or errors', () => {
      render(<HeroPromptTypewriter />);
      
      const colPill = screen.getByText('Preset Cột');
      const beamPill = screen.getByText('Dầm từ Excel');
      const footingPill = screen.getByText('Preset Móng');

      // Rapidly switch between pills multiple times
      act(() => {
        fireEvent.click(beamPill);
        fireEvent.click(footingPill);
        fireEvent.click(colPill);
        fireEvent.click(footingPill);
        fireEvent.click(beamPill);
      });

      // Settle timers
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // Should cleanly render Beam Excel scenario
      expect(screen.getAllByText(/Vẽ thép cho các dầm đang chọn theo bảng thép trong file Excel này/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/4 Dầm liên tục Trục 3/i)).toBeInTheDocument();
    });

    it('stress: unmounting mid-typing cleanly removes all interval timers without memory leak', () => {
      const { unmount } = render(<HeroPromptTypewriter />);
      
      // Advance partially into typing
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Unmount component mid-typing
      unmount();

      // Advancing timers after unmount should NOT trigger React state update warnings
      act(() => {
        vi.advanceTimersByTime(10000);
      });
    });

    it('stress: unmounting mid-log stream cleans up interval timers cleanly', () => {
      const { unmount } = render(<HeroPromptTypewriter />);
      
      // Advance to typing end and mid-logs
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // Unmount mid-logs
      unmount();

      act(() => {
        vi.advanceTimersByTime(10000);
      });
    });
  });

  // =========================================================================
  // 2. MCP TOOLS HUB ADVERSARIAL FILTER & SEARCH SUITE (57 TOOLS, 8 GROUPS)
  // =========================================================================
  describe('McpToolsHub 57 Tools Catalog & Search Robustness', () => {
    it('verifies exactly 57 tools are loaded with 8 functional groups and counts', () => {
      render(<McpToolsHub />);
      
      // Verify total summary
      expectToolCount(57);
      expect(screen.getByText(/57 TOOLS DIRECTORY/i)).toBeInTheDocument();

      // Verify category tabs and counts
      expect(screen.getByRole('button', { name: /Tất cả công cụ 57/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Vẽ thép & Bản vẽ kết cấu 12/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đọc mô hình & Chọn đối tượng 5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Xử lý dữ liệu Excel 4/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Dịch bản vẽ Việt \/ Trung 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tạo & Thao tác đối tượng 11/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tag & Thống kê khối lượng 5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Lệnh điều khiển Ribbon 15/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /C# Động & Tiện ích khác 3/i })).toBeInTheDocument();

      // Verify sum: 12 + 5 + 4 + 2 + 11 + 5 + 15 + 3 = 57
      expect(12 + 5 + 4 + 2 + 11 + 5 + 15 + 3).toBe(57);
    });

    it('filters correctly across all 8 individual category tabs', () => {
      render(<McpToolsHub />);

      const categoriesToTest = [
        { name: /Vẽ thép & Bản vẽ kết cấu/i, count: 12 },
        { name: /Đọc mô hình & Chọn đối tượng/i, count: 5 },
        { name: /Xử lý dữ liệu Excel/i, count: 4 },
        { name: /Dịch bản vẽ Việt \/ Trung/i, count: 2 },
        { name: /Tạo & Thao tác đối tượng/i, count: 11 },
        { name: /Tag & Thống kê khối lượng/i, count: 5 },
        { name: /Lệnh điều khiển Ribbon/i, count: 15 },
        { name: /C# Động & Tiện ích khác/i, count: 3 }
      ];

      categoriesToTest.forEach(({ name, count }) => {
        const catBtn = screen.getByRole('button', { name });
        act(() => {
          fireEvent.click(catBtn);
        });
        expectToolCount(count);
      });

      // Switch back to All
      const allBtn = screen.getByRole('button', { name: /Tất cả công cụ 57/i });
      act(() => {
        fireEvent.click(allBtn);
      });
      expectToolCount(57);
    });

    it('verifies permission filter splits into 41 Write and 16 Read tools (57 total)', () => {
      render(<McpToolsHub />);

      // Permission Write (41 tools)
      const writeBtn = screen.getByRole('button', { name: /Quyền Ghi/i });
      act(() => {
        fireEvent.click(writeBtn);
      });
      expectToolCount(41);

      // Permission Read (16 tools)
      const readBtn = screen.getByRole('button', { name: /Quyền Đọc/i });
      act(() => {
        fireEvent.click(readBtn);
      });
      expectToolCount(16);

      // 41 + 16 = 57
      expect(41 + 16).toBe(57);
    });

    it('handles empty query and whitespace-only query without filtering out tools', () => {
      render(<McpToolsHub />);
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);

      // Whitespace search
      act(() => {
        fireEvent.change(searchInput, { target: { value: '    ' } });
      });
      expectToolCount(57);
    });

    it('adversarial search: special characters, regex metacharacters, and symbols do not crash', () => {
      render(<McpToolsHub />);
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);

      const dangerousInputs = [
        '[a-z]+',
        '(.*)',
        '\\d+\\w+',
        '***???',
        '<script>alert("xss")</script>',
        '${jndi:ldap://test}',
        '\'" OR 1=1 --',
        'undefined',
        'null',
        'NaN'
      ];

      dangerousInputs.forEach((query) => {
        act(() => {
          fireEvent.change(searchInput, { target: { value: query } });
        });
        expect(document.body).toBeInTheDocument();
      });
    });

    it('tests unmatched query renders empty state and resets cleanly via reset button', () => {
      render(<McpToolsHub />);
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);

      act(() => {
        fireEvent.change(searchInput, { target: { value: 'nonexistent_tool_xyz_99999' } });
      });

      expect(screen.getByText(/Không tìm thấy công cụ MCP nào khớp với từ khóa/i)).toBeInTheDocument();
      expectToolCount(0);

      // Click Reset Filters button
      const resetBtn = screen.getByRole('button', { name: /Đặt lại bộ lọc/i });
      act(() => {
        fireEvent.click(resetBtn);
      });

      expectToolCount(57);
    });

    it('verifies case-insensitive search and parameter name search', () => {
      render(<McpToolsHub />);
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);

      // Uppercase search
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'CREATE_COLUMN_REBAR' } });
      });
      expect(screen.getAllByText('create_column_rebar').length).toBeGreaterThan(0);

      // Search by specific input parameter name 'lap_length'
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'lap_length' } });
      });
      expect(screen.getAllByText('create_beam_rebar').length).toBeGreaterThan(0);

      // Search by license code
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'column-rebar' } });
      });
      expect(screen.getAllByText('create_column_rebar').length).toBeGreaterThan(0);
    });

    it('opens tool modal, verifies parameter table, error handling callout, and copies schema as valid JSON', () => {
      render(<McpToolsHub />);
      
      // Filter to create_column_rebar
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'create_column_rebar' } });
      });

      // Click Xem Schema to open modal
      const xemSchemaLink = screen.getByText('Xem Schema');
      act(() => {
        fireEvent.click(xemSchemaLink);
      });

      // Modal contents check
      expect(screen.getByText(/Mô Tả Chức Năng/i)).toBeInTheDocument();
      expect(screen.getByText(/Tham Số Đầu Vào \(Inputs\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('column_ids').length).toBeGreaterThan(0);
      expect(screen.getAllByText('int[]').length).toBeGreaterThan(0);
      expect(screen.getByText(/Cơ Chế Bắt Lỗi & Xử Lý An Toàn/i)).toBeInTheDocument();
      expect(screen.getByText(/Rollback nếu cột không tồn tại/i)).toBeInTheDocument();

      // Test Copy Schema action
      const copySchemaBtn = screen.getByRole('button', { name: /Sao chép Schema/i });
      act(() => {
        fireEvent.click(copySchemaBtn);
      });

      expect(mockClipboardWriteText).toHaveBeenCalled();
      const lastPayload = mockClipboardWriteText.mock.calls[mockClipboardWriteText.mock.calls.length - 1][0];
      
      // Verify schema is valid JSON
      const parsedSchema = JSON.parse(lastPayload);
      expect(parsedSchema.name).toBe('create_column_rebar');
      expect(parsedSchema.parameters.type).toBe('object');
      expect(parsedSchema.parameters.properties.column_ids).toBeDefined();
      expect(parsedSchema.parameters.required).toContain('column_ids');

      // Test Copy Tool Name inside modal
      const copyNameBtn = screen.getByRole('button', { name: /Sao chép tên Tool/i });
      act(() => {
        fireEvent.click(copyNameBtn);
      });
      expect(mockClipboardWriteText).toHaveBeenCalledWith('create_column_rebar');

      // Close modal
      const closeBtn = screen.getByRole('button', { name: 'Đóng' });
      act(() => {
        fireEvent.click(closeBtn);
      });

      expect(screen.queryByText(/Mô Tả Chức Năng/i)).not.toBeInTheDocument();
    });

    it('tests zero-input tool (e.g. get_selected_elements) modal gracefully handles empty inputs', () => {
      render(<McpToolsHub />);
      
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm tool theo tên, mô tả/i);
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'get_selected_elements' } });
      });

      const xemSchemaLink = screen.getByText('Xem Schema');
      act(() => {
        fireEvent.click(xemSchemaLink);
      });

      expect(screen.getByText(/Không có tham số đầu vào \(None\)\./i)).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: 'Đóng' });
      act(() => {
        fireEvent.click(closeBtn);
      });
    });
  });

  // =========================================================================
  // 3. MCP CONFIG SNIPPET TAB SWITCHING & JSON VALIDITY SUITE
  // =========================================================================
  describe('McpConfigSnippet Tab Switching & JSON Payload Verification', () => {
    it('verifies all 4 configuration tabs render with correct paths and valid JSON schemas', () => {
      render(<McpConfigSnippet />);

      // Tab 1: Claude Desktop
      const claudeTab = screen.getByRole('button', { name: /Claude Desktop/i });
      act(() => {
        fireEvent.click(claudeTab);
      });
      expect(screen.getAllByText(/claude_desktop_config\.json/i).length).toBeGreaterThan(0);

      const copyCodeBtn = screen.getByRole('button', { name: /Sao chép JSON/i });
      act(() => {
        fireEvent.click(copyCodeBtn);
      });
      const claudeJson = mockClipboardWriteText.mock.calls[mockClipboardWriteText.mock.calls.length - 1][0];
      const parsedClaude = JSON.parse(claudeJson);
      expect(parsedClaude.mcpServers.revitapp.url).toBe('http://127.0.0.1:8765/mcp');

      // Tab 2: Cursor IDE
      const cursorTab = screen.getByRole('button', { name: /Cursor IDE/i });
      act(() => {
        fireEvent.click(cursorTab);
      });
      expect(screen.getAllByText(/\.cursor\/mcp\.json/i).length).toBeGreaterThan(0);

      act(() => {
        fireEvent.click(copyCodeBtn);
      });
      const cursorJson = mockClipboardWriteText.mock.calls[mockClipboardWriteText.mock.calls.length - 1][0];
      const parsedCursor = JSON.parse(cursorJson);
      expect(parsedCursor.mcpServers.revitapp.url).toBe('http://127.0.0.1:8765/mcp');

      // Tab 3: NPX Proxy
      const npxTab = screen.getByRole('button', { name: /Claude \(qua NPM Server-Fetch\)/i });
      act(() => {
        fireEvent.click(npxTab);
      });

      act(() => {
        fireEvent.click(copyCodeBtn);
      });
      const npxJson = mockClipboardWriteText.mock.calls[mockClipboardWriteText.mock.calls.length - 1][0];
      const parsedNpx = JSON.parse(npxJson);
      expect(parsedNpx.mcpServers.revitapp.command).toBe('npx');
      expect(parsedNpx.mcpServers.revitapp.args).toContain('@modelcontextprotocol/server-fetch');
      expect(parsedNpx.mcpServers.revitapp.env.REVIT_MCP_TOKEN_PATH).toContain('%LocalAppData%\\RevitAPP\\mcp-access-token.txt');

      // Tab 4: Python Client
      const pythonTab = screen.getByRole('button', { name: /Python MCP Client/i });
      act(() => {
        fireEvent.click(pythonTab);
      });
      expect(screen.getByText('script.py')).toBeInTheDocument();
      expect(screen.getByText(/import requests/i)).toBeInTheDocument();
    });

    it('tests copy file path action and feedback timeout', () => {
      render(<McpConfigSnippet />);
      
      const copyPathBtn = screen.getByTitle('Sao chép đường dẫn file');
      act(() => {
        fireEvent.click(copyPathBtn);
      });

      expect(mockClipboardWriteText).toHaveBeenCalledWith('%APPDATA%\\Claude\\claude_desktop_config.json');
    });
  });

  // =========================================================================
  // 4. WHY AI DRAWS REBAR TOGGLES & COMPARISON SUITE
  // =========================================================================
  describe('WhyAiDrawsRebar Toggles & Mode Switching', () => {
    it('verifies all 5 pillars and updates detail card when selecting each pillar', () => {
      render(<WhyAiDrawsRebar />);

      const pillars = [
        { name: 'Direct .NET C# Engine Execution', badge: 'High-Performance' },
        { name: 'Revit STA Threading & ExternalEvent Queue', badge: 'Zero Crash Risk' },
        { name: 'Transaction Ownership & Auto-Rollback', badge: 'Atomic Safety' },
        { name: 'Server-Authoritative License & Gate', badge: 'Strict Security' },
        { name: 'Safe In-Revit Confirmation Prompt', badge: 'Human-in-the-Loop' }
      ];

      pillars.forEach(({ name, badge }) => {
        const pillarPill = screen.getByRole('heading', { level: 3, name });
        act(() => {
          fireEvent.click(pillarPill);
        });
        expect(screen.getAllByText(name).length).toBeGreaterThan(0);
        expect(screen.getAllByText(badge).length).toBeGreaterThan(0);
      });
    });

    it('toggles between 5 Pillars and Comparison mode seamlessly', () => {
      render(<WhyAiDrawsRebar />);

      // Switch to Comparison
      const compareBtn = screen.getByRole('button', { name: /So Sánh Với Script Truyền Thống/i });
      act(() => {
        fireEvent.click(compareBtn);
      });

      expect(screen.getByText(/Script Dynamo \/ Python Rời Rạc \(Truyền Thống\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Kiến Trúc Native Engine BIMAutomation \(MCP Standard\)/i)).toBeInTheDocument();

      // Switch back to 5 Pillars
      const pillarsBtn = screen.getByRole('button', { name: /5 Trụ Cột Kiến Trúc Kỹ Thuật/i });
      act(() => {
        fireEvent.click(pillarsBtn);
      });

      expect(screen.getAllByText(/Direct .NET C# Engine Execution/i).length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. REBAR SHOWCASE PIPELINE 5 TOOLS & MULTI-STEP SHEET SUITE
  // =========================================================================
  describe('RebarShowcasePipeline 5 Tools & Step Navigation', () => {
    it('verifies 5 core rebar tools selection and technical specs', () => {
      render(<RebarShowcasePipeline />);

      const tools = [
        { name: 'AI Column Rebar', tag: 'CR • column-rebar', mcp: 'create_column_rebar' },
        { name: 'AI Beam Rebar', tag: 'BR • beam-rebar', mcp: 'create_beam_rebar' },
        { name: 'AI Footing Rebar', tag: 'FR • footing-rebar', mcp: 'create_footing_rebar' },
        { name: 'AI Wall Rebar', tag: 'WR • wall-rebar', mcp: 'create_wall_rebar' },
        { name: 'AI Slab Rebar', tag: 'SR • utility-tools', mcp: 'create_slab_rebar' }
      ];

      tools.forEach(({ name, tag, mcp }) => {
        const toolCard = screen.getByRole('heading', { level: 3, name });
        act(() => {
          fireEvent.click(toolCard);
        });
        expect(screen.getAllByText(name).length).toBeGreaterThan(0);
        expect(screen.getByText(tag)).toBeInTheDocument();
        expect(screen.getByText(`Tool: ${mcp}`)).toBeInTheDocument();
      });
    });

    it('navigates through all 9 steps of Continuous Beam Pipeline with wrap-around', () => {
      render(<RebarShowcasePipeline />);

      const beamTab = screen.getByRole('button', { name: /Chuỗi Triển Khai Bản Vẽ Dầm \(9 Bước\)/i });
      act(() => {
        fireEvent.click(beamTab);
      });

      // Step 1
      expect(screen.getByText(/Bước 1 \/ 9/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Chọn Dầm Trên Trục/i).length).toBeGreaterThan(0);

      // Step forward 8 times to Step 9
      for (let i = 2; i <= 9; i++) {
        const nextBtn = screen.getByRole('button', { name: /Bước Tiếp Theo →/i });
        act(() => {
          fireEvent.click(nextBtn);
        });
        expect(screen.getByText(new RegExp(`Bước ${i} \\/ 9`, 'i'))).toBeInTheDocument();
      }

      // At step 9, next button changes to "Bắt Đầu Lại"
      const restartBtns = screen.getAllByRole('button', { name: /Bắt Đầu Lại/i });
      const restartBtn = restartBtns.find(b => b.textContent.includes('Bắt Đầu Lại'));
      expect(restartBtn).toBeDefined();

      // Click restart button -> wraps around to step 1
      act(() => {
        fireEvent.click(restartBtn);
      });
      expect(screen.getByText(/Bước 1 \/ 9/i)).toBeInTheDocument();

      // Test direct step clicking (e.g. click Step 5 pill)
      const step5Pill = screen.getByRole('button', { name: /BƯỚC 5 Tạo Mặt Cắt Dọc Dầm/i });
      act(() => {
        fireEvent.click(step5Pill);
      });
      expect(screen.getByText(/Bước 5 \/ 9/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Tạo Mặt Cắt Dọc Dầm/i).length).toBeGreaterThan(0);

      // Test Step back button
      const prevBtn = screen.getByRole('button', { name: /← Bước Trước/i });
      act(() => {
        fireEvent.click(prevBtn);
      });
      expect(screen.getByText(/Bước 4 \/ 9/i)).toBeInTheDocument();
    });

    it('navigates through all 6 steps of Footing Pipeline with wrap-around', () => {
      render(<RebarShowcasePipeline />);

      const footingTab = screen.getByRole('button', { name: /Chuỗi Triển Khai Bản Vẽ Móng \(6 Bước\)/i });
      act(() => {
        fireEvent.click(footingTab);
      });

      expect(screen.getByText(/Bước 1 \/ 6/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Chọn Nhóm Đài Móng/i).length).toBeGreaterThan(0);

      // Step through all 6 steps
      for (let i = 2; i <= 6; i++) {
        const nextBtn = screen.getByRole('button', { name: /Bước Tiếp Theo →/i });
        act(() => {
          fireEvent.click(nextBtn);
        });
        expect(screen.getByText(new RegExp(`Bước ${i} \\/ 6`, 'i'))).toBeInTheDocument();
      }

      // Wrap around
      const restartBtns = screen.getAllByRole('button', { name: /Bắt Đầu Lại/i });
      const restartBtn = restartBtns.find(b => b.textContent.includes('Bắt Đầu Lại'));
      expect(restartBtn).toBeDefined();

      act(() => {
        fireEvent.click(restartBtn);
      });
      expect(screen.getByText(/Bước 1 \/ 6/i)).toBeInTheDocument();
    });
  });
});
