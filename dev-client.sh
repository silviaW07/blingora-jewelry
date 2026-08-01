#!/bin/bash

# 脚本功能：
# 1. 移除所有tsconfig*.json文件中的extends字段
# 2. 修改App.tsx和entities-proxy.tsx中的配置

echo "开始处理tsconfig文件..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 获取父文件夹名称作为项目ID
PARENT_DIR=$(basename "$(dirname "$SCRIPT_DIR")")
PROJECT_ID="$PARENT_DIR"
echo "检测到项目ID: $PROJECT_ID"

# 查找所有tsconfig*.json文件并移除extends字段
for tsconfig_file in tsconfig*.json; do
    if [ -f "$tsconfig_file" ]; then
        echo "处理文件: $tsconfig_file"
        
        # 创建临时文件
        temp_file=$(mktemp)
        
        # 使用sed移除特定的extends行
        # 移除包含 "extends": "../../tsconfig.base.json" 的行
        sed '/^[[:space:]]*"extends"[[:space:]]*:[[:space:]]*"\.\.\/\.\.\/tsconfig\.base\.json"[[:space:]]*,*[[:space:]]*$/d' "$tsconfig_file" > "$temp_file"
        
        # 替换原文件
        mv "$temp_file" "$tsconfig_file"
        echo "已移除 $tsconfig_file 中的extends字段"
    fi
done

# 查找App.tsx文件并修改dynamicBase逻辑
echo "开始处理App.tsx文件..."

# 查找src/App.tsx文件
APP_FILE="src/App.tsx"
if [ -f "$APP_FILE" ]; then
    echo "找到文件: $APP_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用sed替换dynamicBase逻辑
    # 将 "const dynamicBase = window.__dynamic_base__ || '/';" 替换为 "const dynamicBase = '/';"
    sed 's/const dynamicBase = window\.__dynamic_base__ || '\''\/'\'';/const dynamicBase = '\''\/'\'';/g' "$APP_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$APP_FILE"
    echo "已修改 $APP_FILE 中的dynamicBase逻辑"
else
    echo "未找到 $APP_FILE 文件"
fi

# 查找entities-proxy.tsx文件并修改构造方法注释
echo "开始处理entities-proxy.tsx文件..."

# 查找src/tools/entities-proxy.tsx文件
ENTITIES_PROXY_FILE="src/tools/entities-proxy.tsx"
if [ -f "$ENTITIES_PROXY_FILE" ]; then
    echo "找到文件: $ENTITIES_PROXY_FILE"
    
    # 检查第一个构造方法是否已经被注释（使用动态项目ID）
    if grep -q "^[[:space:]]*// constructor(baseUrl: string = \"\" +\"/BACKEND_${PROJECT_ID}\"+\"/api/entities\") {" "$ENTITIES_PROXY_FILE"; then
        echo "第一个构造方法已被注释，需要取消注释并注释第二个"
        
        # 创建临时文件
        temp_file=$(mktemp)
        
        # 使用awk进行处理：取消第一个构造方法的注释，注释第二个构造方法
        awk -v project_id="$PROJECT_ID" '
        BEGIN { in_first_constructor = 0; in_second_constructor = 0; line_count = 0; }
        
        # 检测第一个构造方法（被注释的）
        $0 ~ "^[[:space:]]*// constructor\\(baseUrl: string = \"\" \\+\"/BACKEND_" project_id "\"\\+\"/api/entities\"\\) \\{" {
            in_first_constructor = 1
            line_count = 1
            print "  constructor(baseUrl: string = \"\" +\"/BACKEND_" project_id "\"+\"/api/entities\") {"
            next
        }
        
        # 处理第一个构造方法内部的注释行
        in_first_constructor == 1 && /^[[:space:]]*\/\/   this\.baseUrl = baseUrl;/ {
            line_count++
            print "    this.baseUrl = baseUrl;"
            next
        }
        
        # 处理第一个构造方法的结束
        in_first_constructor == 1 && /^[[:space:]]*\/\/ \}/ {
            in_first_constructor = 0
            print "  }"
            next
        }
        
        # 检测第二个构造方法（未被注释的）
        /^[[:space:]]*constructor\(/ && in_first_constructor == 0 {
            in_second_constructor = 1
            print "  // " $0
            next
        }
        
        # 处理第二个构造方法内部的行
        in_second_constructor == 1 && /^[[:space:]]*\}$/ {
            in_second_constructor = 0
            print "  // }"
            next
        }
        
        # 处理第二个构造方法内部的其他行
        in_second_constructor == 1 {
            # 添加注释前缀，保持原有缩进
            gsub(/^[[:space:]]*/, "")
            print "    // " $0
            next
        }
        
        # 其他行保持不变
        { print }
        ' "$ENTITIES_PROXY_FILE" > "$temp_file"
        
        # 替换原文件
        mv "$temp_file" "$ENTITIES_PROXY_FILE"
        echo "已切换构造方法：第一个取消注释，第二个已注释"
        
    elif grep -q "^[[:space:]]*constructor(baseUrl: string = \"\" +\"/BACKEND_${PROJECT_ID}\"+\"/api/entities\") {" "$ENTITIES_PROXY_FILE"; then
        echo "第一个构造方法未被注释，已经是正确状态，无需修改"
    else
        echo "未找到预期的构造方法格式（项目ID: $PROJECT_ID），跳过处理"
    fi
else
    echo "未找到 $ENTITIES_PROXY_FILE 文件"
fi

# 查找server/index.ts文件并替换{{PROJECT_ID}}
echo "开始处理server/index.ts文件..."

SERVER_INDEX_FILE="server/index.ts"
if [ -f "$SERVER_INDEX_FILE" ]; then
    echo "找到文件: $SERVER_INDEX_FILE"
    
    # 检查文件中是否包含{{PROJECT_ID}}占位符
    if grep -q "{{PROJECT_ID}}" "$SERVER_INDEX_FILE"; then
        echo "发现{{PROJECT_ID}}占位符，准备替换为: $PROJECT_ID"
        
        # 创建临时文件
        temp_file=$(mktemp)
        
        # 使用sed替换{{PROJECT_ID}}为实际的项目ID
        sed "s/{{PROJECT_ID}}/$PROJECT_ID/g" "$SERVER_INDEX_FILE" > "$temp_file"
        
        # 替换原文件
        mv "$temp_file" "$SERVER_INDEX_FILE"
        echo "已将 $SERVER_INDEX_FILE 中的{{PROJECT_ID}}替换为 $PROJECT_ID"
    else
        echo "$SERVER_INDEX_FILE 中未发现{{PROJECT_ID}}占位符，无需替换"
    fi
else
    echo "未找到 $SERVER_INDEX_FILE 文件"
fi

echo "所有文件处理完成！"

# 处理 BackendBasicLayout.tsx 中的 getProjectId 函数
echo "开始处理 BackendBasicLayout.tsx 中的 getProjectId 函数..."
BACKEND_LAYOUT_FILE="src/layouts/BackendBasicLayout.tsx"
if [ -f "$BACKEND_LAYOUT_FILE" ]; then
    echo "找到文件: $BACKEND_LAYOUT_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用 awk 进行多行替换
    awk -v project_id="$PROJECT_ID" '
    BEGIN { in_getProjectId = 0; brace_count = 0; }
    
    # 检测 getProjectId 函数开始
    /^const getProjectId = \(\): string => \{/ {
        in_getProjectId = 1
        brace_count = 1
        print "const getProjectId = (): string => {"
        print "  try {"
        print "    const pathParts = window.location.pathname.split(\"/\");"
        print "    const projectIdFromPath = pathParts.find(part => part.startsWith(\"PROJ_\"));"
        print "    if (projectIdFromPath) return projectIdFromPath;"
        print "    const hostname = window.location.hostname;"
        print "    if (hostname === \"localhost\" || hostname === \"127.0.0.1\") {"
        print "      return \"" project_id "\";"
        print "    }"
        print "    return \"" project_id "\";"
        print "  } catch {"
        print "    return \"" project_id "\";"
        print "  }"
        print "};"
        next
    }
    
    # 在 getProjectId 函数内部，跳过原有内容
    in_getProjectId == 1 {
        # 统计大括号
        for (i = 1; i <= length($0); i++) {
            char = substr($0, i, 1)
            if (char == "{") brace_count++
            if (char == "}") brace_count--
        }
        
        # 如果大括号平衡且遇到结束的分号，函数结束
        if (brace_count == 0 && $0 ~ /^};/) {
            in_getProjectId = 0
        }
        next
    }
    
    # 其他行保持不变
    { print }
    ' "$BACKEND_LAYOUT_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$BACKEND_LAYOUT_FILE"
    echo "已更新 $BACKEND_LAYOUT_FILE 中的 getProjectId 函数"
else
    echo "未找到 $BACKEND_LAYOUT_FILE 文件"
fi

# 处理 FrontendBasicLayout.tsx 中的 getProjectId 函数
echo "开始处理 FrontendBasicLayout.tsx 中的 getProjectId 函数..."
FRONTEND_LAYOUT_FILE="src/layouts/FrontendBasicLayout.tsx"
if [ -f "$FRONTEND_LAYOUT_FILE" ]; then
    echo "找到文件: $FRONTEND_LAYOUT_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用 awk 进行多行替换
    awk -v project_id="$PROJECT_ID" '
    BEGIN { in_getProjectId = 0; brace_count = 0; }
    
    # 检测 getProjectId 函数开始
    /^const getProjectId = \(\): string => \{/ {
        in_getProjectId = 1
        brace_count = 1
        print "const getProjectId = (): string => {"
        print "  try {"
        print "    const pathParts = window.location.pathname.split(\"/\");"
        print "    const projectIdFromPath = pathParts.find(part => part.startsWith(\"PROJ_\"));"
        print "    if (projectIdFromPath) return projectIdFromPath;"
        print "    const hostname = window.location.hostname;"
        print "    if (hostname === \"localhost\" || hostname === \"127.0.0.1\") {"
        print "      return \"" project_id "\";"
        print "    }"
        print "    return \"" project_id "\";"
        print "  } catch {"
        print "    return \"" project_id "\";"
        print "  }"
        print "};"
        next
    }
    
    # 在 getProjectId 函数内部，跳过原有内容
    in_getProjectId == 1 {
        # 统计大括号
        for (i = 1; i <= length($0); i++) {
            char = substr($0, i, 1)
            if (char == "{") brace_count++
            if (char == "}") brace_count--
        }
        
        # 如果大括号平衡且遇到结束的分号，函数结束
        if (brace_count == 0 && $0 ~ /^};/) {
            in_getProjectId = 0
        }
        next
    }
    
    # 其他行保持不变
    { print }
    ' "$FRONTEND_LAYOUT_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$FRONTEND_LAYOUT_FILE"
    echo "已更新 $FRONTEND_LAYOUT_FILE 中的 getProjectId 函数"
else
    echo "未找到 $FRONTEND_LAYOUT_FILE 文件"
fi

# 处理 ApiRequest.ts 中的 getProjectId 函数
echo "开始处理 ApiRequest.ts 中的 getProjectId 函数..."
API_REQUEST_FILE="src/tools/ApiRequest.ts"
if [ -f "$API_REQUEST_FILE" ]; then
    echo "找到文件: $API_REQUEST_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用 awk 替换 getProjectId 函数
    awk -v project_id="$PROJECT_ID" '
    BEGIN { in_getProjectId = 0; brace_count = 0; }
    
    # 检测 getProjectId 函数开始
    /^const getProjectId = \(\) => \{/ {
        in_getProjectId = 1
        brace_count = 1
        print "const getProjectId = () => {"
        print "  const projectIdFromPath = window.location.pathname.split(\"/\").find(part => part.startsWith(\"PROJ_\"));"
        print "  if (projectIdFromPath) return projectIdFromPath;"
        print "  const hostname = window.location.hostname;"
        print "  if (hostname === \"localhost\" || hostname === \"127.0.0.1\") {"
        print "    return \"" project_id "\";"
        print "  }"
        print "  return \"" project_id "\";"
        print "}"
        next
    }
    
    # 在 getProjectId 函数内部，跳过原有内容
    in_getProjectId == 1 {
        # 统计大括号
        for (i = 1; i <= length($0); i++) {
            char = substr($0, i, 1)
            if (char == "{") brace_count++
            if (char == "}") brace_count--
        }
        
        # 如果大括号平衡，函数结束
        if (brace_count == 0) {
            in_getProjectId = 0
        }
        next
    }
    
    # 其他行保持不变
    { print }
    ' "$API_REQUEST_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$API_REQUEST_FILE"
    echo "已更新 $API_REQUEST_FILE 中的 getProjectId 函数"
else
    echo "未找到 $API_REQUEST_FILE 文件"
fi

# 处理 next.config.mjs 中的 rewrites 配置
echo "开始处理 next.config.mjs 中的 rewrites 配置..."
NEXT_CONFIG_FILE="next.config.mjs"
if [ -f "$NEXT_CONFIG_FILE" ]; then
    echo "找到文件: $NEXT_CONFIG_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用 sed 替换 rewrites 中所有包含 PROJ_xxx 的路径
    # 匹配所有 /flow-engine/PROJ_xxx/v2/run_flow 格式的路径（不依赖行尾字符）
    sed -E "s|/flow-engine/PROJ_[a-zA-Z0-9_]+/v2/run_flow|/flow-engine/${PROJECT_ID}/v2/run_flow|g" \
        "$NEXT_CONFIG_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$NEXT_CONFIG_FILE"
    echo "已更新 $NEXT_CONFIG_FILE 中的 rewrites source 和 destination 路径"
else
    echo "未找到 $NEXT_CONFIG_FILE 文件"
fi

echo "所有文件处理完成！"

# 处理 rpc-client.ts 中的 API_URL，开发环境指向本地
echo "开始处理 rpc-client.ts 中的 API_URL..."
RPC_CLIENT_FILE="src/tools/rpc-client.ts"
if [ -f "$RPC_CLIENT_FILE" ]; then
    echo "找到文件: $RPC_CLIENT_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 替换 API_URL 为本地开发地址
    sed "s|const API_URL = .*|const API_URL = 'http://localhost:3100/rpc/${PROJECT_ID}';|g" "$RPC_CLIENT_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$RPC_CLIENT_FILE"
    echo "已更新 $RPC_CLIENT_FILE 中的 API_URL 为本地开发地址"
else
    echo "未找到 $RPC_CLIENT_FILE 文件"
fi

# 处理 storeFactory.ts 中的 getTenantKey 函数
echo "开始处理 storeFactory.ts 中的 getTenantKey 函数..."
STORE_FACTORY_FILE="src/tools/storeFactory.ts"
if [ -f "$STORE_FACTORY_FILE" ]; then
    echo "找到文件: $STORE_FACTORY_FILE"
    
    # 创建临时文件
    temp_file=$(mktemp)
    
    # 使用 awk 替换 getTenantKey 函数
    awk -v project_id="$PROJECT_ID" '
    BEGIN { in_getTenantKey = 0; brace_count = 0; }
    
    # 检测 getTenantKey 函数开始
    /^const getTenantKey = \(name: string\): string => \{/ {
        in_getTenantKey = 1
        brace_count = 1
        print "const getTenantKey = (name: string): string => {"
        print "  return \"" project_id "_\" + name;"
        print "};"
        next
    }
    
    # 在 getTenantKey 函数内部，跳过原有内容
    in_getTenantKey == 1 {
        # 统计大括号
        for (i = 1; i <= length($0); i++) {
            char = substr($0, i, 1)
            if (char == "{") brace_count++
            if (char == "}") brace_count--
        }
        
        # 如果大括号平衡，函数结束
        if (brace_count == 0) {
            in_getTenantKey = 0
        }
        next
    }
    
    # 其他行保持不变
    { print }
    ' "$STORE_FACTORY_FILE" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$STORE_FACTORY_FILE"
    echo "已更新 $STORE_FACTORY_FILE 中的 getTenantKey 函数"
else
    echo "未找到 $STORE_FACTORY_FILE 文件"
fi
