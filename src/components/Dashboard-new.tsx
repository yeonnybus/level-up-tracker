import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">이번 주 진행 상황을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>이번 주 태스크</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0/0</p>
            <p className="text-sm text-muted-foreground">완료된 태스크</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>총 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0시간</p>
            <p className="text-sm text-muted-foreground">이번 주 활동 시간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0%</p>
            <p className="text-sm text-muted-foreground">주간 목표 달성률</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
