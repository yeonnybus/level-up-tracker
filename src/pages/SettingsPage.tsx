import React from "react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-gray-600">계정 및 앱 설정을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">프로필 설정</h3>
          <p className="text-gray-600">프로필 정보를 수정할 수 있습니다.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">알림 설정</h3>
          <p className="text-gray-600">알림 옵션을 설정할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};
