# Frontend Component Review Harness

本 Harness 用于约束 AI 对 `apps/frontend` 中 Vue 3 组件进行代码审查。  
审查目标是发现组件过长、职责混杂、类型重复、状态管理不清、可维护性差、UI 结构难扩展等问题。

当用户要求 review、审查、检查、重构 `apps/frontend` 中的 Vue 组件时，必须先读取并遵守 `.agents/HARNESS.md`。

## Project Background

本项目frontend 技术栈为 Vue3 + TS + Vite + Pinia +Vue Router + tailwindcss + reka-ui

## Review Output Format

AI 做代码审查时必须按以下顺序输出：

1. Findings：问题列表，按严重程度排序
2. Open Questions：需要确认的问题
3. Summary：简短总结
4. Suggested Commands：建议用户自行运行的命令

每个 Finding 必须包含：

- 严重级别：`P0` / `P1` / `P2` / `P3`
- 文件路径和行号
- 问题说明
- 为什么这是问题
- 建议修改方式
- 简短示例

示例：

```md
[P2] 组件承担了过多职责  
文件：`apps/frontend/src/views/Order/OrderList.vue:42`

该组件同时负责筛选表单、订单列表渲染、状态流转、接口请求和弹窗控制，后续扩展会变得困难。

建议拆成：

- `OrderFilter.vue`
- `OrderTable.vue`
- `OrderStatusBadge.vue`
- `useOrderList.ts`
```

## Component Length Rules

AI 必须检查组件长度。

判断标准：

- 单个 `.vue` 文件超过 `300` 行：必须提示是否拆分
- `<script setup>` 超过 `180` 行：必须检查是否应抽 composable
- `<template>` 超过 `120` 行：必须检查是否应拆子组件
- 单个函数超过 `50` 行：必须检查是否拆成更小函数
- 单个组件同时处理 3 个以上业务职责：必须提示拆分

错误示例：

```vue
<script setup lang="ts">
const filters = ref({});
const orders = ref([]);
const dialogVisible = ref(false);

async function fetchOrders() {}
async function approveOrder() {}
async function rejectOrder() {}
async function exportOrders() {}
async function handleRealtimeUpdate() {}
</script>

<template>
  <!-- 筛选表单、表格、分页、弹窗、状态按钮全部写在一个组件里 -->
</template>
```

推荐示例：

```txt
OrderList.vue
OrderFilter.vue
OrderTable.vue
OrderReviewDialog.vue
composables/useOrderList.ts
types/order.ts
```

## Component Split Rules

AI 必须判断组件是否需要拆分。

满足任一条件时，应建议拆分：

- 模板中出现重复 UI 块
- 某段 UI 有独立业务含义
- 某段 UI 可以单独测试或复用
- 父组件需要传入大量 props 才能控制某一区域
- 一个组件里同时包含列表、表单、弹窗、详情、状态流转

推荐拆分方式：

```vue
<!-- OrderList.vue -->
<script setup lang="ts">
import OrderFilter from "./components/OrderFilter.vue";
import OrderTable from "./components/OrderTable.vue";
import OrderReviewDialog from "./components/OrderReviewDialog.vue";
</script>

<template>
  <OrderFilter v-model="filters" @search="fetchOrders" />
  <OrderTable :orders="orders" @review="openReviewDialog" />
  <OrderReviewDialog v-model:open="reviewDialogOpen" :order="selectedOrder" />
</template>
```

不推荐拆分方式：

```txt
components/
  Left.vue
  Right.vue
  Top.vue
```

组件命名必须表达业务含义，而不是布局位置。

## Type Management Rules

AI 必须检查类型定义是否分散、重复或过度内联。

必须建议统一处理的情况：

- 多个组件重复定义相同接口
- API 返回类型直接写在页面组件里
- 表单类型、接口类型、展示类型混在一起
- 使用 `any`、`Record<string, any>` 掩盖真实类型
- 后端已有 DTO 或共享类型但前端重新手写不一致类型

错误示例：

```ts
interface Order {
  id: string;
  status: string;
  patientName: string;
}
```

如果多个文件都定义了类似 `Order`，移动到统一文件：

```txt
apps/frontend/src/types/order.ts
```

推荐示例：

```ts
export type OrderStatus = "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface OrderListItem {
  id: string;
  patientName: string;
  hospital: string;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderQuery {
  keyword?: string;
  status?: OrderStatus;
  page: number;
  pageSize: number;
}
```

在定义接口继承关系时，应优先让业务接口直接继承最基础、最稳定的公共接口，而不是继承另一个带有具体业务场景字段的派生接口。
例如，Order 表示订单的基础数据结构，OrderList 和 AdminOrderList 都是在订单基础信息之上，
面向不同页面或不同角色扩展出来的列表数据结构。因此它们都应该直接 extends Order。
派生接口应继承基础接口，而不是继承其他具体业务场景下的派生接口，避免因接口链式继承导致字段污染和业务耦合。

推荐示例：

```ts
export interface OrderList extends Order {
  userName: string;
}

export interface AdminOrderList extends Order {
  nickName: string;
  userName: string;
}
```

不推荐写法：

```ts
export interface OrderList extends Order {
  userName: string;
}

export interface AdminOrderList extends OrderList {
  nickName: string;
}
```

组件中使用：

```ts
import type { OrderListItem, OrderQuery } from "@/types/order";
```

## Props And Emits Rules

AI 必须检查 props 和 emits 是否类型明确。

推荐：

```ts
interface Props {
  orders: OrderListItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  review: [order: OrderListItem];
  refresh: [];
}>();
```

不推荐：

```ts
defineProps({
  orders: Array,
  loading: Boolean,
});

const emit = defineEmits(["review", "refresh"]);
```

## Composable Extraction Rules

当组件里出现可复用的状态逻辑，AI 必须建议抽 composable。

适合抽 composable 的情况：

- 列表查询、分页、筛选
- 表单提交和校验
- 弹窗状态
- WebSocket 或实时订阅
- 多组件共享的业务流程

推荐示例：

```ts
// composables/useOrderList.ts
export function useOrderList() {
  const loading = ref(false);
  const orders = ref<OrderListItem[]>([]);
  const query = ref<OrderQuery>({
    page: 1,
    pageSize: 10,
  });

  async function fetchOrders() {
    loading.value = true;

    try {
      orders.value = await getOrders(query.value);
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    orders,
    query,
    fetchOrders,
  };
}
```

## State Management Rules

AI 必须判断状态应该放在哪里。

判断标准：

- 只被当前组件使用：放组件内
- 被当前页面多个子组件使用：放父组件或 composable
- 跨页面共享：考虑 Pinia/store
- 来自服务端的数据：优先通过 API/composable 管理
- 不要为了方便把所有状态都放全局 store

错误示例：

```ts
// 全局 store 存放只属于一个弹窗的状态
const reviewDialogVisible = ref(false);
```

推荐：

```ts
// 当前页面内部状态放在页面或 composable 中
const reviewDialogVisible = ref(false);
```

## Template Review Rules

AI 必须检查模板是否复杂。

需要提示优化的情况：

- 多层 `v-if` / `v-for` 嵌套
- 大量内联表达式
- 重复状态判断
- 复杂 class 拼接
- 一个模板块超过 80 行仍没有子组件边界

错误示例：

```vue
<span>
  {{ order.status === 'PENDING' ? '待接单' : order.status === 'COMPLETED' ? '已完成' : '处理中' }}
</span>
```

推荐：

```ts
function getOrderStatusText(status: OrderStatus) {
  const statusMap: Record<OrderStatus, string> = {
    PENDING: "待接单",
    ASSIGNED: "已分配",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };

  return statusMap[status];
}
```

## API And Error Handling Rules

AI 必须检查接口调用是否有 loading、错误处理和用户反馈。

错误示例：

```ts
async function submit() {
  await createOrder(form.value);
}
```

推荐：

```ts
const submitting = ref(false);

async function submit() {
  submitting.value = true;

  try {
    await createOrder(form.value);
    toast.success("提交成功");
  } catch {
    toast.error("提交失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}
```

## Change Rules

AI 必须检查变更是否有必要，并给出理由。
在进行检查前进行如下自测，并告知使用者：

```text

1. 这次修改涉及哪些模块？
2. 可能影响哪些已有功能？
3. 是否会影响接口结构？
4. 是否会影响数据库结构？
5. 是否需要更新文档？
```

## Forbidden

AI 在 Review 中禁止：

- 禁止只说“建议优化”但不给具体位置和理由
- 没有明确的说明禁止重构
- 禁止无依据要求大规模重构
- 禁止把中文文案改成 Unicode 转义
- 禁止建议主动运行 build
- 禁止把所有逻辑都建议抽到 store
- 禁止用 `any` 作为类型统一方案
- 禁止只按行数机械拆分，必须结合职责判断

## Suggested Commands

AI 不需要主动执行 build。  
如果需要验证，应只告诉用户可以运行：

```bash
pnpm --filter @medical-escort/frontend run dev
```

如项目后续添加类型检查或测试脚本，再建议：

```bash
pnpm --filter @medical-escort/frontend run typecheck
pnpm --filter @medical-escort/frontend run test
```
