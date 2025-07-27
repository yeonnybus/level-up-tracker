import { Plus, Users } from "lucide-react";
import React from "react";

export const GroupsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">그룹 관리</h1>
          <p className="text-gray-600">
            팀원들과 함께 목표를 달성하고 진행 상황을 공유하세요
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          그룹 생성
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            참여 중인 그룹이 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            그룹을 만들거나 초대 코드로 그룹에 참여해보세요.
          </p>
          <div className="space-y-2">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="mr-2 h-4 w-4" />새 그룹 만들기
            </button>
            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              초대 코드로 참여
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
