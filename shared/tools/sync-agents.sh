#!/bin/bash
# sync-agents.sh - 在 .paperclip 和 mindsync 之间同步 Agent 配置

set -e

# 配置
PAPERCLIP_BASE="${HOME}/.paperclip/instances/default/companies/6a1f17f0-f9e9-416e-bed4-0f1556a8fc33/agents"
MINDSYNC_AGENTS="${HOME}/workspaces/mindsync/agents"

# Agent ID 映射
declare -A AGENT_MAP=(
    ["d3d3f38e-7003-49d6-8301-825d8faf9ff8"]="ceo"
    ["8ee8ca86-8478-43e7-b22e-9878315a1271"]="cmo"
    ["98779e06-b071-42c6-b6e9-ca42cf491578"]="qa"
    ["bae3a947-b810-476f-8a7c-ff7d85dbfe86"]="mandala-expert"
)

# 确保目录存在
mkdir -p "$MINDSYNC_AGENTS"

# 从 Paperclip 导出到 mindsync
export_to_mindsync() {
    echo "📤 Exporting agents from Paperclip to mindsync..."

    if [[ ! -d "$PAPERCLIP_BASE" ]]; then
        echo "❌ Error: Paperclip agents directory not found at $PAPERCLIP_BASE"
        exit 1
    fi

    for agent_id in "${!AGENT_MAP[@]}"; do
        agent_name="${AGENT_MAP[$agent_id]}"
        src_dir="$PAPERCLIP_BASE/$agent_id"
        dest_dir="$MINDSYNC_AGENTS/$agent_name"

        if [[ -d "$src_dir" ]]; then
            echo "  📁 Syncing $agent_name ($agent_id)..."
            mkdir -p "$dest_dir"
            rsync -av --delete "$src_dir/" "$dest_dir/" 2>/dev/null || cp -r "$src_dir"/* "$dest_dir/" 2>/dev/null || true
        else
            echo "  ⚠️  Agent $agent_name ($agent_id) not found in Paperclip"
        fi
    done

    echo "✅ Export complete!"
    echo ""
    echo "Next steps:"
    echo "  cd ~/workspaces/mindsync"
    echo "  git add agents/"
    echo "  git commit -m 'sync(agents): update from Paperclip'"
}

# 从 mindsync 导入到 Paperclip
import_from_mindsync() {
    echo "📥 Importing agents from mindsync to Paperclip..."

    if [[ ! -d "$PAPERCLIP_BASE" ]]; then
        echo "❌ Error: Paperclip directory not found at $PAPERCLIP_BASE"
        echo "Please ensure Paperclip is installed and initialized."
        exit 1
    fi

    for agent_id in "${!AGENT_MAP[@]}"; do
        agent_name="${AGENT_MAP[$agent_id]}"
        src_dir="$MINDSYNC_AGENTS/$agent_name"
        dest_dir="$PAPERCLIP_BASE/$agent_id"

        if [[ -d "$src_dir" ]]; then
            echo "  📁 Syncing $agent_name → $agent_id..."
            mkdir -p "$dest_dir"
            rsync -av --delete "$src_dir/" "$dest_dir/" 2>/dev/null || cp -r "$src_dir"/* "$dest_dir/" 2>/dev/null || true
        else
            echo "  ⚠️  Agent $agent_name not found in mindsync"
        fi
    done

    echo "✅ Import complete!"
    echo ""
    echo "Note: You may need to restart Paperclip for changes to take effect."
}

# 显示状态
show_status() {
    echo "📊 Agent Sync Status"
    echo "===================="
    echo ""
    echo "Paperclip base: $PAPERCLIP_BASE"
    echo "Mindsync agents: $MINDSYNC_AGENTS"
    echo ""
    echo "Agent mappings:"
    for agent_id in "${!AGENT_MAP[@]}"; do
        agent_name="${AGENT_MAP[$agent_id]}"
        pc_exists="❌"
        ms_exists="❌"
        [[ -d "$PAPERCLIP_BASE/$agent_id" ]] && pc_exists="✅"
        [[ -d "$MINDSYNC_AGENTS/$agent_name" ]] && ms_exists="✅"
        printf "  %s (%s): Paperclip %s | Mindsync %s\n" "$agent_name" "${agent_id:0:8}..." "$pc_exists" "$ms_exists"
    done
}

# 主逻辑
case "${1:-status}" in
    export|e)
        export_to_mindsync
        ;;
    import|i)
        import_from_mindsync
        ;;
    status|s)
        show_status
        ;;
    *)
        echo "Usage: $0 {export|import|status}"
        echo ""
        echo "Commands:"
        echo "  export   Export agents from Paperclip to mindsync (for Git commit)"
        echo "  import   Import agents from mindsync to Paperclip (restore config)"
        echo "  status   Show current sync status"
        exit 1
        ;;
esac
