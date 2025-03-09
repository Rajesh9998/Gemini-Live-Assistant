/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import cn from "classnames";
import ReactMarkdown from "react-markdown";
import "./PlanDisplay.css";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";

interface RightSidePanelProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const RightSidePanelComponent: React.FC<RightSidePanelProps> = ({ isOpen, toggleOpen }) => {
  const { client } = useLiveAPIContext();
  const [toolData, setToolData] = useState<string>("");
  const [hasNewData, setHasNewData] = useState<boolean>(false);

  // Handle tool calls and format the data as markdown
  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall in RightSidePanel`, toolCall);
      const fc = toolCall.functionCalls.find((fc) => fc.name === "display_plan");
      if (fc) {
        const { plan, current_step, step_description, command: cmdValue, reasoning } = fc.args as any;
        const markdown = `### Step ${current_step}
**Plan:** ${plan}

**Step Description:** ${step_description}

**Command:** \`${cmdValue}\`

**Reasoning:** ${reasoning}

---`;
        setToolData((prev) => prev + "\n\n" + markdown);
        setHasNewData(true);
        
        // If panel is closed and we get new data, flash the toggle button
        if (!isOpen) {
          setTimeout(() => setHasNewData(false), 3000);
        }
      }
      
      // Send response for the tool call
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };
    
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, isOpen]);

  // Reset the new data indicator when panel is opened
  useEffect(() => {
    if (isOpen) {
      setHasNewData(false);
    }
  }, [isOpen]);

  return (
    <div className={cn("right-side-panel", { open: isOpen })}>
      <header className="top">
        <h2>Hacking Plan</h2>
        <button 
          className={cn("opener", { "has-new-data": hasNewData && !isOpen })}
          onClick={toggleOpen}
          title={isOpen ? "Close panel" : "Open panel"}
        >
          {isOpen ? (
            <RiSidebarFoldLine color="#b4b8bb" />
          ) : (
            <RiSidebarUnfoldLine color="#b4b8bb" />
          )}
        </button>
      </header>
      <div className="content">
        {toolData ? (
          <ReactMarkdown>{toolData}</ReactMarkdown>
        ) : (
          <div className="empty-state">
            <p>No hacking plan available yet.</p>
            <p>Ask the AI to help you with a hacking challenge to see the plan here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const RightSidePanel = React.memo(RightSidePanelComponent);