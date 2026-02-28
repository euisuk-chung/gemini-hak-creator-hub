"use client";

import ExcalidrawEditor from "@/components/whiteboard/ExcalidrawEditor";

export default function WhiteboardPage() {
  return (
    <div className="w-full h-screen">
      <ExcalidrawEditor height="100vh" />
    </div>
  );
}
