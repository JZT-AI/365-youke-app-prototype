import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "线索管理后台交互原型",
  description: "会话列表、群列表、群线索查看、聊天记录圈选及线索分配的独立后台原型。",
};

export default function LeadManagementPage() {
  return (
    <main className="prototype-page">
      <iframe
        className="prototype-frame"
        src="/lead-management.html"
        title="线索管理后台交互原型"
      />
    </main>
  );
}
