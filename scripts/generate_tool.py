"""
AI 工具生成腳本骨架
自動生成新工具的完整流程：
1. 從待開發工具清單取出下一個
2. 用 Claude API 生成 Astro 頁面 + Preact 元件
3. 自動執行基本測試（語法檢查、構建測試）
4. git commit & push -> 觸發 Cloudflare Pages 自動部署
5. 更新 sitemap
6. 發 Discord 通知
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# === 設定 ===
PROJECT_ROOT = Path(__file__).parent.parent
TOOLS_DIR = PROJECT_ROOT / "src" / "pages" / "tools"
COMPONENTS_DIR = PROJECT_ROOT / "src" / "components" / "tools"
TOOL_LIST_FILE = PROJECT_ROOT / "scripts" / "tool_queue.json"

# 待開發工具清單
DEFAULT_TOOL_QUEUE = [
    {
        "id": "token-counter",
        "name": "LLM Token Counter",
        "description": "Count tokens for GPT, Claude, and Llama models",
        "category": "AI/LLM",
        "difficulty": "low",
        "status": "pending"
    },
    {
        "id": "base64",
        "name": "Base64 Encode/Decode",
        "description": "Encode and decode text and files to/from Base64",
        "category": "Encoding",
        "difficulty": "low",
        "status": "pending"
    },
    {
        "id": "url-encode",
        "name": "URL Encode/Decode",
        "description": "URL encoding and decoding for safe web usage",
        "category": "Encoding",
        "difficulty": "low",
        "status": "pending"
    },
    {
        "id": "cron-generator",
        "name": "Cron Expression Generator",
        "description": "Visual cron expression builder with next run preview",
        "category": "DevOps",
        "difficulty": "medium",
        "status": "pending"
    },
    {
        "id": "markdown-to-html",
        "name": "Markdown to HTML",
        "description": "Convert Markdown to HTML with live preview",
        "category": "Content",
        "difficulty": "low",
        "status": "pending"
    },
    {
        "id": "llm-price-calculator",
        "name": "LLM Price Calculator",
        "description": "Compare costs across different LLM providers",
        "category": "AI/LLM",
        "difficulty": "medium",
        "status": "pending"
    },
]


def load_tool_queue():
    """載入工具佇列"""
    if TOOL_LIST_FILE.exists():
        with open(TOOL_LIST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    # 初始化預設佇列
    save_tool_queue(DEFAULT_TOOL_QUEUE)
    return DEFAULT_TOOL_QUEUE


def save_tool_queue(queue):
    """儲存工具佇列"""
    with open(TOOL_LIST_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)


def get_next_tool(queue):
    """取出下一個待開發工具"""
    for tool in queue:
        if tool["status"] == "pending":
            return tool
    return None


def generate_tool_code(tool):
    """
    用 Claude API 生成工具程式碼
    TODO: 實作 Claude API 呼叫
    """
    print(f"[TODO] 呼叫 Claude API 生成工具: {tool['name']}")
    # 未來實作：
    # 1. 組合 prompt（含設計規範、範例程式碼）
    # 2. 呼叫 Claude API
    # 3. 解析回應，分離 .astro 頁面和 .tsx 元件
    # 4. 寫入對應檔案
    return False


def run_build_test():
    """執行構建測試"""
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.returncode == 0
    except Exception as e:
        print(f"構建測試失敗: {e}")
        return False


def git_commit_and_push(tool):
    """Git commit 並推送"""
    try:
        subprocess.run(["git", "add", "."], cwd=str(PROJECT_ROOT))
        subprocess.run(
            ["git", "commit", "-m", f"feat: add {tool['name']} tool"],
            cwd=str(PROJECT_ROOT)
        )
        subprocess.run(["git", "push"], cwd=str(PROJECT_ROOT))
        return True
    except Exception as e:
        print(f"Git 操作失敗: {e}")
        return False


def send_discord_notification(tool, success):
    """發送 Discord 通知"""
    # TODO: 實作 Discord webhook
    status = "completed" if success else "failed"
    print(f"[TODO] Discord 通知: 工具 {tool['name']} 生成{status}")


def main():
    print(f"=== 工具生成腳本啟動 {datetime.now().isoformat()} ===")

    queue = load_tool_queue()
    tool = get_next_tool(queue)

    if not tool:
        print("佇列中沒有待開發工具")
        return

    print(f"開始生成工具: {tool['name']}")
    tool["status"] = "in_progress"
    save_tool_queue(queue)

    success = generate_tool_code(tool)

    if success:
        if run_build_test():
            git_commit_and_push(tool)
            tool["status"] = "completed"
            tool["completed_at"] = datetime.now().isoformat()
        else:
            tool["status"] = "build_failed"
    else:
        tool["status"] = "generation_failed"

    save_tool_queue(queue)
    send_discord_notification(tool, success)
    print(f"=== 工具生成腳本結束 ===")


if __name__ == "__main__":
    main()
