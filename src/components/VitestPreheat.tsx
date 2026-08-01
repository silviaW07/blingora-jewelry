"use client";

import dayjs from "dayjs";
import { motion } from "framer-motion";
import { Layers3, Rocket, Sparkles, Zap } from "lucide-react";
import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const activityData = [{
  key: "Mon",
  value: 21
}, {
  key: "Tue",
  value: 42
}, {
  key: "Wed",
  value: 58
}, {
  key: "Thu",
  value: 63
}, {
  key: "Fri",
  value: 70
}, {
  key: "Sat",
  value: 75
}, {
  key: "Sun",
  value: 78
}];
const featureBadges = ["shadcn/ui primitives", "Framer Motion", "Lucide icons", "Recharts"];
export default function VitestPreheat() {
  const timestamp = dayjs().format("YYYY-MM-DD HH:mm");
  return <div className="grid gap-6 p-6 lg:grid-cols-2">
      <Card className="border-dashed">
        <CardHeader className="gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary" size={20} />
            <div>
              <CardTitle>Vitest 预热面板</CardTitle>
              <CardDescription>最后预编译：{timestamp}</CardDescription>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            该组件引入常用 shadcn 组件、Recharts、Lucide、Framer Motion，
            通过渲染行为让 Vitest 在预热阶段就编译绝大部分依赖，从而缩短后续冒烟耗时。
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <XAxis dataKey="key" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{
                borderRadius: 12,
                borderColor: "hsl(var(--border))",
                background: "hsl(var(--card))"
              }} />
                <Line type="natural" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {featureBadges.map((item, index) => <Badge key={item} variant="secondary">
                {item}
              </Badge>)}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers3 size={16} />
            <span>依赖缓存已启用</span>
          </div>
          <Button size="sm" className="gap-1">
            <Rocket size={16} />
            重新预热
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>依赖健康度</CardTitle>
          <CardDescription>实时跟踪 Vitest 预热状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.35
        }} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap size={16} className="text-yellow-500" />
              <span>当前命中率</span>
              <Badge variant="outline">92%</Badge>
            </div>
            <Progress value={92} />
            <p className="text-muted-foreground text-xs">
              命中率越高，后续 Vitest 请求耗时越短。
            </p>
          </motion.div>

          <Tabs defaultValue="recharts" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="recharts">Recharts</TabsTrigger>
              <TabsTrigger value="motion">Motion</TabsTrigger>
              <TabsTrigger value="icons">Lucide</TabsTrigger>
            </TabsList>
            <TabsContent value="recharts" className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                预热过程中将 Recharts 的动画计算提前执行，确保图表组件在冒烟时不会触发二次编译。
              </p>
            </TabsContent>
            <TabsContent value="motion" className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Framer Motion 的关键帧在此组件中被执行，可复用缓存避免热身阶段的 GC 抖动。
              </p>
            </TabsContent>
            <TabsContent value="icons" className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Lucide 图标包体积不小，预热时加载一次可让后续页面切换更顺畅。
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
}
