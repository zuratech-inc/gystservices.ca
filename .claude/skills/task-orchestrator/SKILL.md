---
name: task-orchestrator
description: Orchestrates multi-agent task review workflow. Invoke this skill when creating a new task, feature, or user story to trigger the full agent review pipeline.
disable-model-invocation: true
---

# Task Orchestrator

Run the full multi-agent review pipeline for: **$ARGUMENTS**

## Workflow

Execute the following agents in order. Each agent's output feeds into the next.

### Phase 1: Project Management Review
Use the **project-manager** subagent to:
- Analyze the task requirements
- Break down into subtasks with estimates
- Identify risks and dependencies
- Create an implementation plan

Capture the output and pass relevant context to subsequent agents.

### Phase 2: Architecture & Security Review
Use the **architecture-reviewer** subagent to:
- Review the proposed implementation from an architectural perspective
- Assess scalability concerns for the planned approach
- Identify security vulnerabilities and mitigations
- Define implementation constraints and design patterns to follow

Pass architectural constraints and security findings forward.

### Phase 3: QA Strategy
Use the **qa-reviewer** subagent to:
- Design the test strategy based on requirements and architectural decisions
- Create specific test cases covering functional, security, and performance scenarios
- Define acceptance criteria verification plan
- Prioritize test implementation order

Pass test requirements forward.

### Phase 4: Implementation
Use the **coding-agent** subagent to:
- Implement the feature following the plans from all previous agents
- Write tests according to QA specifications
- Follow architectural constraints
- Complete the implementation checklist

### Phase 5: Synthesis
After all agents have completed, synthesize a final summary:
- Overall status and readiness assessment
- Key decisions made across all agents
- Remaining open items or blockers
- Recommended next steps